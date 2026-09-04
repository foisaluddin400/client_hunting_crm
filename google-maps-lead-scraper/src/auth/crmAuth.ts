import { BusinessLead } from '../types/business';

export const CRM_AUTH_TOKEN_KEY = 'leadflow_crm_token';
export const CRM_USER_KEY = 'leadflow_crm_user';
export const CRM_BASE_URL_KEY = 'leadflow_crm_base_url';
export const DEFAULT_CRM_BASE_URL = 'http://localhost:3000';

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  agencyName?: string;
}

export interface CrmAuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: CrmUser | null;
  crmUrl: string;
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  duplicates: number;
  failed: number;
  totalProcessed?: number;
  results: Array<{
    id: string;
    name: string;
    status: 'imported' | 'duplicate' | 'failed';
    message?: string;
  }>;
  error?: string;
}

/**
 * Retrieve current authentication state from chrome.storage.local (with fallback to memory/localStorage)
 */
export async function getStoredAuth(): Promise<CrmAuthState> {
  let token: string | null = null;
  let user: CrmUser | null = null;
  let crmUrl: string = DEFAULT_CRM_BASE_URL;

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const res = await chrome.storage.local.get([
        CRM_AUTH_TOKEN_KEY,
        CRM_USER_KEY,
        CRM_BASE_URL_KEY,
      ]);
      token = res[CRM_AUTH_TOKEN_KEY] || null;
      user = res[CRM_USER_KEY] || null;
      crmUrl = res[CRM_BASE_URL_KEY] || DEFAULT_CRM_BASE_URL;
    } catch (err) {
      console.error('Failed to read auth from storage:', err);
    }
  } else if (typeof localStorage !== 'undefined') {
    token = localStorage.getItem(CRM_AUTH_TOKEN_KEY);
    const userStr = localStorage.getItem(CRM_USER_KEY);
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {}
    }
    crmUrl = localStorage.getItem(CRM_BASE_URL_KEY) || DEFAULT_CRM_BASE_URL;
  }

  return {
    isAuthenticated: Boolean(token),
    token,
    user,
    crmUrl,
  };
}

/**
 * Log into CRM using existing CRM credentials
 */
export async function loginToCrm(
  email: string,
  password: string,
  baseUrl: string = DEFAULT_CRM_BASE_URL
): Promise<{ success: boolean; user?: CrmUser; error?: string }> {
  try {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Invalid email address or password.',
      };
    }

    if (!data.token) {
      return {
        success: false,
        error: 'Authentication failed: Server did not return token.',
      };
    }

    const user: CrmUser = {
      id: data.user?.id || '',
      name: data.user?.name || '',
      email: data.user?.email || email.trim(),
      agencyName: data.user?.agencyName,
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        [CRM_AUTH_TOKEN_KEY]: data.token,
        [CRM_USER_KEY]: user,
        [CRM_BASE_URL_KEY]: cleanUrl,
      });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CRM_AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(CRM_USER_KEY, JSON.stringify(user));
      localStorage.setItem(CRM_BASE_URL_KEY, cleanUrl);
    }

    return { success: true, user };
  } catch (err: any) {
    console.error('CRM login error:', err);
    return {
      success: false,
      error: 'Cannot connect to CRM server. Make sure the CRM is running and reachable.',
    };
  }
}

/**
 * Log out from CRM
 */
export async function logoutFromCrm(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove([CRM_AUTH_TOKEN_KEY, CRM_USER_KEY]);
  } else if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CRM_AUTH_TOKEN_KEY);
    localStorage.removeItem(CRM_USER_KEY);
  }
}

/**
 * Send selected leads to CRM /api/lead-finder/import endpoint
 */
export async function importLeadsToCrm(
  leads: BusinessLead[],
  baseUrl: string = DEFAULT_CRM_BASE_URL
): Promise<ImportResponse> {
  const auth = await getStoredAuth();
  if (!auth.token) {
    return {
      success: false,
      imported: 0,
      duplicates: 0,
      failed: leads.length,
      results: [],
      error: 'Authentication required. Please log into your Client Hunting CRM account.',
    };
  }

  try {
    const cleanUrl = (auth.crmUrl || baseUrl).replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/api/lead-finder/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ businesses: leads }),
    });

    if (res.status === 401) {
      // Token expired or invalid
      await logoutFromCrm();
      return {
        success: false,
        imported: 0,
        duplicates: 0,
        failed: leads.length,
        results: [],
        error: 'Your CRM session has expired. Please log in again.',
      };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        imported: 0,
        duplicates: 0,
        failed: leads.length,
        results: [],
        error: data.error || 'Failed to save data to CRM database.',
      };
    }

    return {
      success: true,
      imported: data.imported || 0,
      duplicates: data.duplicates || 0,
      failed: data.failed || 0,
      totalProcessed: data.totalProcessed || leads.length,
      results: data.results || [],
    };
  } catch (err: any) {
    console.error('Import leads error:', err);
    return {
      success: false,
      imported: 0,
      duplicates: 0,
      failed: leads.length,
      results: [],
      error: 'CRM server unavailable. Please ensure your CRM backend is running.',
    };
  }
}
