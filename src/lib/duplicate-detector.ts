/**
 * Duplicate business detection engine for Google Maps Leads and CRM Leads.
 * Follows exact requirements:
 * 1. Normalize business name, phone, website, and location/address.
 * 2. Matches name AND at least one overlapping secondary identifier (phone, address, website).
 * 3. Does not reject on name alone if no secondary information is available to compare.
 */

export function normalizeBusinessName(name?: string | null): string {
  if (!name) return "";
  let n = name.trim().toLowerCase();
  // Remove punctuation, collapse spaces
  n = n.replace(/[^\w\s]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  // Remove common legal entity designations at the end
  n = n.replace(/\b(llc|inc|corp|corporation|ltd|limited|co|company)\b$/g, "").trim();
  return n;
}

export function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  // Keep only digits
  const digits = phone.replace(/\D/g, "");
  // Return last 10 digits for consistent local comparison if standard length
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function normalizeWebsite(website?: string | null): string {
  if (!website) return "";
  let w = website.trim().toLowerCase();
  // Remove protocol
  w = w.replace(/^https?:\/\//, "");
  // Remove www.
  w = w.replace(/^www\./, "");
  // Strip path, query params, hash and trailing slash
  w = w.split("/")[0].split("?")[0].split("#")[0].trim();
  return w;
}

export function normalizeAddress(address?: string | null): string {
  if (!address) return "";
  let a = address.trim().toLowerCase();
  a = a.replace(/[^\w\s]/g, " ");
  a = a.replace(/\s+/g, " ").trim();
  return a;
}

export interface BusinessEntity {
  name?: string | null;
  businessName?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  location?: string | null;
  fullAddress?: string | null;
}

/**
 * Compare a candidate business with an existing business to determine if they represent the same business.
 */
export function isDuplicateBusiness(
  candidate: BusinessEntity,
  existing: BusinessEntity
): boolean {
  const candidateName = normalizeBusinessName(candidate.businessName || candidate.name);
  const existingName = normalizeBusinessName(existing.businessName || existing.name);

  if (!candidateName || !existingName) {
    return false;
  }

  // Name must match
  if (candidateName !== existingName) {
    return false;
  }

  // Check available secondary identifiers
  const cPhone = normalizePhone(candidate.phone);
  const ePhone = normalizePhone(existing.phone);
  const hasPhoneOverlap = Boolean(cPhone && ePhone);

  const cWeb = normalizeWebsite(candidate.website);
  const eWeb = normalizeWebsite(existing.website);
  const hasWebOverlap = Boolean(cWeb && eWeb);

  const cAddr = normalizeAddress(candidate.address || candidate.location || candidate.fullAddress);
  const eAddr = normalizeAddress(existing.address || existing.location || existing.fullAddress);
  const hasAddrOverlap = Boolean(cAddr && eAddr);

  // If NO secondary information overlaps between the two, do not use Business Name alone as a blocker
  if (!hasPhoneOverlap && !hasWebOverlap && !hasAddrOverlap) {
    return false;
  }

  // A duplicate exists when name matches AND at least one available secondary identifier matches
  if (hasPhoneOverlap && cPhone === ePhone) {
    return true;
  }

  if (hasWebOverlap && cWeb === eWeb) {
    return true;
  }

  if (hasAddrOverlap) {
    // Exact or substantial substring match for address
    if (cAddr === eAddr || cAddr.includes(eAddr) || eAddr.includes(cAddr)) {
      return true;
    }
  }

  // If secondary identifiers were available to compare but none matched, they are treated as different businesses
  return false;
}

export function normalizeEmail(email?: string | null): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export function normalizeSocialUrl(url?: string | null): string {
  if (!url) return "";
  let s = url.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.replace(/\/+$/, "");
  return s;
}

export interface DuplicateContactCounts {
  emails: Record<string, number>;
  phones: Record<string, number>;
  linkedins: Record<string, number>;
  instagrams: Record<string, number>;
  facebooks: Record<string, number>;
  twitters: Record<string, number>;
}

export function computeContactDuplicateCounts(
  records: Array<{
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
  }>
): DuplicateContactCounts {
  const counts: DuplicateContactCounts = {
    emails: {},
    phones: {},
    linkedins: {},
    instagrams: {},
    facebooks: {},
    twitters: {},
  };

  for (const item of records) {
    const emailKey = normalizeEmail(item.email);
    if (emailKey) {
      counts.emails[emailKey] = (counts.emails[emailKey] || 0) + 1;
    }

    const phoneKey = normalizePhone(item.phone);
    const whatsappKey = normalizePhone(item.whatsapp);

    // If both exist and match, only count once for this business
    if (phoneKey && whatsappKey && phoneKey === whatsappKey) {
      counts.phones[phoneKey] = (counts.phones[phoneKey] || 0) + 1;
    } else {
      if (phoneKey) {
        counts.phones[phoneKey] = (counts.phones[phoneKey] || 0) + 1;
      }
      if (whatsappKey) {
        counts.phones[whatsappKey] = (counts.phones[whatsappKey] || 0) + 1;
      }
    }

    const linkedinKey = normalizeSocialUrl(item.linkedin);
    if (linkedinKey) {
      counts.linkedins[linkedinKey] = (counts.linkedins[linkedinKey] || 0) + 1;
    }

    const instagramKey = normalizeSocialUrl(item.instagram);
    if (instagramKey) {
      counts.instagrams[instagramKey] = (counts.instagrams[instagramKey] || 0) + 1;
    }

    const facebookKey = normalizeSocialUrl(item.facebook);
    if (facebookKey) {
      counts.facebooks[facebookKey] = (counts.facebooks[facebookKey] || 0) + 1;
    }

    const twitterKey = normalizeSocialUrl(item.twitter);
    if (twitterKey) {
      counts.twitters[twitterKey] = (counts.twitters[twitterKey] || 0) + 1;
    }
  }

  return counts;
}
