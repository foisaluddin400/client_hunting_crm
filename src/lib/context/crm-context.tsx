"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Lead,
  FollowUpItem,
  MessageTemplate,
  MapBusiness,
  SmtpConfig,
  UserProfile,
  Channel,
  LeadStatus,
  ActivityItem,
} from "../types";
import { INITIAL_LEADS } from "../mock-data/leads";
import { INITIAL_FOLLOW_UPS } from "../mock-data/follow-ups";
import { DEFAULT_TEMPLATES } from "../mock-data/templates";
import { MOCK_MAP_BUSINESSES } from "../mock-data/map-businesses";
import {
  DEFAULT_BUSINESS_CATEGORIES,
  CATEGORIES_STORAGE_KEY,
} from "@/constants/categories";
import {
  DEFAULT_COUNTRIES,
  COUNTRIES_STORAGE_KEY,
} from "@/constants/countries";
import { useToast } from "./toast-context";

interface ActiveOutreachState {
  isOpen: boolean;
  lead?: Lead;
  channel?: Channel;
  defaultMessage?: string;
}

interface ActiveLeadDetailsState {
  isOpen: boolean;
  leadId?: string;
}

interface ActiveAddLeadState {
  isOpen: boolean;
  initialData?: Partial<Lead>;
  mode: "add" | "edit";
  editLeadId?: string;
}

interface ActiveDeleteConfirmState {
  isOpen: boolean;
  leadId?: string;
  businessName?: string;
}

interface ActiveRescheduleState {
  isOpen: boolean;
  followUpId?: string;
  leadName?: string;
  currentDate?: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalFollowUpsSent: number;
  emailCount: number;
  whatsappCount: number;
  linkedinCount: number;
  twitterCount: number;
  instagramCount: number;
  facebookCount: number;
  emailsSent?: number;
  whatsappPrepared?: number;
  replies?: number;
  emailOpenRate?: number | null;
  pendingFollowUps?: number;
  todayFollowUps?: number;
  pipeline: Record<string, number>;
  topNiches: { name: string; count: number; percentage: number }[];
  recentActivities: any[];
}

interface CRMContextType {
  leads: Lead[];
  followUps: FollowUpItem[];
  templates: MessageTemplate[];
  mapBusinesses: MapBusiness[];
  smtpConfig: SmtpConfig;
  userProfile: UserProfile;
  stats: DashboardStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authModalOpen: boolean;

  // Active Modals
  activeOutreach: ActiveOutreachState;
  activeLeadDetails: ActiveLeadDetailsState;
  activeAddLead: ActiveAddLeadState;
  activeDeleteConfirm: ActiveDeleteConfirmState;
  activeReschedule: ActiveRescheduleState;

  // Lead Actions
  addLead: (lead: Omit<Lead, "id" | "dateAdded" | "activities">) => Promise<string>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addLeadFromMap: (business: MapBusiness) => Promise<void>;
  updateLeadStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  logActivity: (leadId: string, activity: Omit<ActivityItem, "id">) => Promise<void>;
  deleteActivity: (leadId: string, activityId: string) => Promise<void>;
  sendEmailSmtp: (params: {
    leadId: string;
    recipient: string;
    subject: string;
    message: string;
  }) => Promise<boolean>;

  // Follow-up Actions
  addFollowUp: (item: Omit<FollowUpItem, "id">) => Promise<void>;
  updateFollowUp: (id: string, updates: Partial<FollowUpItem>) => Promise<void>;
  completeFollowUp: (id: string) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  rescheduleFollowUp: (id: string, newDate: string, newTime?: string) => Promise<void>;

  // Categories & Target Countries (Single Source of Truth)
  categories: string[];
  countries: string[];
  updateCategories: (newCategories: string[]) => Promise<void>;
  updateCountries: (newCountries: string[]) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  removeCategory: (name: string) => Promise<void>;
  resetCategories: () => Promise<void>;

  // Templates & Config Actions
  saveTemplate: (template: Partial<MessageTemplate> & { name: string; body: string }) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  updateSmtpConfig: (config: Partial<SmtpConfig>) => Promise<void>;
  testSmtpConnection: (config?: Partial<SmtpConfig>) => Promise<boolean>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Data Refresh
  refreshData: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Auth Modal Actions
  openAuthModal: (initialMode?: "login" | "register") => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;

  // Modals Toggles
  openOutreach: (lead: Lead, channel?: Channel, defaultMessage?: string) => void;
  closeOutreach: () => void;
  openLeadDetails: (leadId: string) => void;
  closeLeadDetails: () => void;
  openAddLead: (initialData?: Partial<Lead>, mode?: "add" | "edit", editLeadId?: string) => void;
  closeAddLead: () => void;
  openDeleteConfirm: (leadId: string, businessName: string) => void;
  closeDeleteConfirm: () => void;
  openReschedule: (followUpId: string, leadName: string, currentDate: string) => void;
  closeReschedule: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(INITIAL_FOLLOW_UPS);
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [mapBusinesses, setMapBusinesses] = useState<MapBusiness[]>(MOCK_MAP_BUSINESSES);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "smtp.gmail.com",
    port: "587",
    username: "",
    password: "",
    fromName: "Alex Morgan | LeadFlow",
    fromEmail: "alex@leadflowcrm.com",
    secure: true,
    isVerified: false,
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Alex Morgan",
    agencyName: "Apex Growth Studio",
    email: "alex@apexgrowth.io",
    role: "Agency Founder & Lead Hunter",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    timezone: "America/Chicago (CST)",
  });

  // Business Categories & Target Countries State (Single Source of Truth)
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to parse cached categories:", err);
      }
    }
    return DEFAULT_BUSINESS_CATEGORIES;
  });

  const [countries, setCountries] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(COUNTRIES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to parse cached countries:", err);
      }
    }
    return DEFAULT_COUNTRIES;
  });

  // Modal states
  const [activeOutreach, setActiveOutreach] = useState<ActiveOutreachState>({ isOpen: false });
  const [activeLeadDetails, setActiveLeadDetails] = useState<ActiveLeadDetailsState>({ isOpen: false });
  const [activeAddLead, setActiveAddLead] = useState<ActiveAddLeadState>({ isOpen: false, mode: "add" });
  const [activeDeleteConfirm, setActiveDeleteConfirm] = useState<ActiveDeleteConfirmState>({ isOpen: false });
  const [activeReschedule, setActiveReschedule] = useState<ActiveRescheduleState>({ isOpen: false });

  // 1. Fetch Backend Data
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      // 1. Auth & Profile
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          setUserProfile((prev) => ({ ...prev, ...meData.user }));
          setIsAuthenticated(true);
        }
        if (meData.settings) {
          setSmtpConfig((prev) => ({
            ...prev,
            host: meData.settings.smtpHost || prev.host,
            port: String(meData.settings.smtpPort || prev.port),
            username: meData.settings.smtpUsername || prev.username,
            fromName: meData.settings.fromName || prev.fromName,
            fromEmail: meData.settings.fromEmail || prev.fromEmail,
            secure: meData.settings.secure ?? prev.secure,
            isVerified: meData.settings.isVerified ?? prev.isVerified,
            lastTested: meData.settings.lastTested,
          }));
        }
      } else if (meRes.status === 401) {
        setIsAuthenticated(false);
      }

      // 2. Leads
      const leadsRes = await fetch("/api/leads?limit=100");
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (Array.isArray(leadsData.leads)) {
          setLeads(leadsData.leads);
        }
      }

      // 3. Follow-ups
      const fuRes = await fetch("/api/follow-ups");
      if (fuRes.ok) {
        const fuData = await fuRes.json();
        if (Array.isArray(fuData.followUps)) {
          setFollowUps(fuData.followUps);
        }
      }

      // 4. Templates
      const tplRes = await fetch("/api/templates");
      if (tplRes.ok) {
        const tplData = await tplRes.json();
        if (Array.isArray(tplData.templates) && tplData.templates.length > 0) {
          setTemplates(tplData.templates);
        }
      }

      // 5. Dynamic Categories & Countries (Single Source of Truth)
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData.categories) && catData.categories.length > 0) {
          setCategories(catData.categories);
          try {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(catData.categories));
          } catch (e) {}
        }
        if (Array.isArray(catData.countries) && catData.countries.length > 0) {
          setCountries(catData.countries);
          try {
            localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(catData.countries));
          } catch (e) {}
        }
      }

      // 6. Stats
      await refreshStats();
    } catch (err) {
      console.error("Error refreshing CRM data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auth Modal controls
  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      showToast({
        type: "info",
        title: "Signed Out",
        message: "You have been logged out of LeadFlow CRM.",
      });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.href = "/login";
    }
  };

  // Add Lead
  const addLead = async (
    leadData: Omit<Lead, "id" | "dateAdded" | "activities">
  ): Promise<string> => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: leadData.businessName,
          ceoName: leadData.ceoName,
          industry: leadData.niche,
          location: leadData.location,
          website: leadData.website,
          websiteStatus: leadData.websiteStatus,
          email: leadData.email,
          whatsapp: leadData.whatsapp,
          phone: leadData.phone,
          linkedin: leadData.linkedin,
          instagram: leadData.instagram,
          facebook: leadData.facebook,
          twitter: leadData.twitter,
          leadStatus: leadData.status,
          leadScore: leadData.leadScore,
          notes: leadData.notes,
          avatarColor: leadData.avatarColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead.");
      }

      if (data.lead) {
        setLeads((prev) => [data.lead, ...prev]);
      }
      refreshStats();

      showToast({
        type: "success",
        title: "Lead Added Successfully",
        message: `${leadData.businessName} saved to your CRM.`,
      });

      return data.lead?.id || "lead-" + Date.now();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Add Lead",
        message: err.message,
      });
      return "";
    }
  };

  // Update Lead
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      // Optimistic update
      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead))
      );

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: updates.businessName,
          ceoName: updates.ceoName,
          industry: updates.niche,
          location: updates.location,
          website: updates.website,
          websiteStatus: updates.websiteStatus,
          email: updates.email,
          whatsapp: updates.whatsapp,
          phone: updates.phone,
          linkedin: updates.linkedin,
          instagram: updates.instagram,
          facebook: updates.facebook,
          twitter: updates.twitter,
          leadStatus: updates.status,
          leadScore: updates.leadScore,
          notes: updates.notes,
          avatarColor: updates.avatarColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update lead.");
      }

      if (data.lead) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? data.lead : lead))
        );
      }
      refreshStats();

      showToast({
        type: "info",
        title: "Lead Updated",
        message: "Changes saved to database.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      });
    }
  };

  // Delete Lead
  const deleteLead = async (id: string) => {
    try {
      const leadToDelete = leads.find((l) => l.id === id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setFollowUps((prev) => prev.filter((fu) => fu.leadId !== id));

      if (activeLeadDetails.leadId === id) {
        setActiveLeadDetails({ isOpen: false });
      }

      const res = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete lead.");
      }

      refreshStats();

      showToast({
        type: "warning",
        title: "Lead Removed",
        message: `${leadToDelete?.businessName || "Lead"} has been deleted from your CRM.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
      refreshData();
    }
  };

  // Add Lead from Map
  const addLeadFromMap = async (business: MapBusiness) => {
    const exists = leads.some(
      (l) =>
        l.businessName.toLowerCase() === business.name.toLowerCase() &&
        l.location.toLowerCase() === business.location.toLowerCase()
    );

    if (exists) {
      showToast({
        type: "info",
        title: "Already in Leads",
        message: `${business.name} is already in your CRM list.`,
      });
      return;
    }

    const newLeadPayload: Omit<Lead, "id" | "dateAdded" | "activities"> = {
      businessName: business.name,
      ceoName: business.ceoName || undefined,
      niche: business.niche || business.category,
      location: business.location,
      website: business.website || undefined,
      websiteStatus: business.websiteStatus,
      leadScore: Math.floor(Math.random() * 20) + 80,
      email: business.email || undefined,
      whatsapp: business.whatsapp || undefined,
      phone: business.phone || undefined,
      linkedin: business.linkedin || undefined,
      instagram: business.instagram || undefined,
      facebook: business.facebook || undefined,
      twitter: business.twitter || undefined,
      status: "New",
      notes: `Imported via Lead Finder discovery in ${business.location}. ${business.websiteAnalysis || ""}`,
      avatarColor: "bg-indigo-600",
    };

    await addLead(newLeadPayload);

    setMapBusinesses((prev) =>
      prev.map((b) => (b.id === business.id ? { ...b, alreadyAdded: true } : b))
    );
  };

  // Update Status
  const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
    await updateLead(id, { status: newStatus });
  };

  // Log Activity
  const logActivity = async (
    leadId: string,
    activityData: Omit<ActivityItem, "id">
  ) => {
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          channel: activityData.channel,
          message: activityData.fullMessage || activityData.messagePreview || "Outreach message prepared",
          status: activityData.status ? activityData.status.toUpperCase() : "PREPARED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record activity.");
      }

      if (data.activity) {
        setLeads((prev) =>
          prev.map((lead) => {
            if (lead.id === leadId) {
              return {
                ...lead,
                lastContact: activityData.date,
                status: lead.status === "New" ? "Contacted" : lead.status,
                activities: [data.activity, ...lead.activities],
              };
            }
            return lead;
          })
        );
      }
      refreshStats();
    } catch (err: any) {
      console.error("Failed to log activity:", err);
    }
  };

  // Delete Activity
  const deleteActivity = async (leadId: string, activityId: string) => {
    try {
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id === leadId) {
            return {
              ...lead,
              activities: lead.activities.filter((a) => a.id !== activityId),
            };
          }
          return lead;
        })
      );

      const res = await fetch(`/api/outreach/${activityId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete activity.");
      }

      showToast({
        type: "info",
        title: "Activity Removed",
        message: "Activity removed from timeline.",
      });
      refreshStats();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
    }
  };

  // Send Email via Server-Side SMTP
  const sendEmailSmtp = async (params: {
    leadId: string;
    recipient: string;
    subject: string;
    message: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to send email via SMTP.");
      }

      if (data.activity) {
        setLeads((prev) =>
          prev.map((lead) => {
            if (lead.id === params.leadId) {
              return {
                ...lead,
                lastContact: new Date().toISOString().split("T")[0],
                status: lead.status === "New" ? "Contacted" : lead.status,
                activities: [data.activity, ...lead.activities],
              };
            }
            return lead;
          })
        );
      }
      refreshStats();

      showToast({
        type: "success",
        title: "Email Delivered via SMTP! ✉️",
        message: `Successfully sent to ${params.recipient}.`,
        duration: 4500,
      });

      return true;
    } catch (err: any) {
      showToast({
        type: "error",
        title: "SMTP Sending Failed",
        message: err.message,
        duration: 6000,
      });
      return false;
    }
  };

  // Add Follow-Up
  const addFollowUp = async (item: Omit<FollowUpItem, "id">) => {
    try {
      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: item.leadId,
          channel: item.channel,
          message: item.originalMessagePreview,
          notes: item.notes,
          scheduledAt: item.dueDate,
          dueTime: item.dueTime,
          priority: item.priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule follow-up.");
      }

      if (data.followUp) {
        setFollowUps((prev) => [data.followUp, ...prev]);
      }
      refreshStats();

      showToast({
        type: "success",
        title: "Follow-up Scheduled",
        message: `Task for ${item.businessName} added for ${item.dueDate}.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Schedule",
        message: err.message,
      });
    }
  };

  // Update Follow-up
  const updateFollowUp = async (id: string, updates: Partial<FollowUpItem>) => {
    try {
      setFollowUps((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );

      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: updates.channel,
          message: updates.originalMessagePreview,
          notes: updates.notes,
          scheduledAt: updates.dueDate,
          dueTime: updates.dueTime,
          priority: updates.priority,
          status: updates.status?.toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update follow-up.");
      }

      if (data.followUp) {
        setFollowUps((prev) =>
          prev.map((item) => (item.id === id ? data.followUp : item))
        );
      }
      refreshStats();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      });
    }
  };

  // Complete Follow-up
  const completeFollowUp = async (id: string) => {
    try {
      const target = followUps.find((fu) => fu.id === id);
      if (!target) return;

      setFollowUps((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "completed",
                completedAt: new Date().toISOString().split("T")[0],
              }
            : item
        )
      );

      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete follow-up.");
      }

      refreshStats();

      showToast({
        type: "success",
        title: "Follow-up Completed! ✅",
        message: `Task for ${target.businessName} marked as finished.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Complete",
        message: err.message,
      });
    }
  };

  // Delete Follow-up
  const deleteFollowUp = async (id: string) => {
    try {
      setFollowUps((prev) => prev.filter((item) => item.id !== id));

      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete follow-up.");
      }

      refreshStats();

      showToast({
        type: "info",
        title: "Follow-up Removed",
        message: "Task has been removed from your list.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
    }
  };

  // Reschedule Follow-up
  const rescheduleFollowUp = async (
    id: string,
    newDate: string,
    newTime?: string
  ) => {
    try {
      const isToday = newDate === new Date().toISOString().split("T")[0];
      const isPast = newDate < new Date().toISOString().split("T")[0];

      setFollowUps((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              dueDate: newDate,
              dueTime: newTime || item.dueTime,
              status: isToday ? "today" : isPast ? "overdue" : "upcoming",
            };
          }
          return item;
        })
      );

      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: newDate,
          dueTime: newTime,
          status: "PENDING",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reschedule follow-up.");
      }

      refreshStats();

      showToast({
        type: "info",
        title: "Follow-up Rescheduled",
        message: `Rescheduled to ${newDate} ${newTime ? `at ${newTime}` : ""}.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Reschedule Failed",
        message: err.message,
      });
    }
  };

  // Save Message Template
  const saveTemplate = async (
    template: Partial<MessageTemplate> & { name: string; body: string }
  ) => {
    try {
      const isEdit = !!template.id && !template.id.startsWith("tpl-");
      const url = isEdit ? `/api/templates/${template.id}` : "/api/templates";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          category: template.category || "GENERAL",
          subject: template.subject,
          message: template.body,
          channels: template.channels,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save template.");
      }

      if (data.template) {
        setTemplates((prev) => {
          const idx = prev.findIndex((t) => t.id === data.template.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = data.template;
            return copy;
          }
          return [...prev, data.template];
        });
      }

      showToast({
        type: "success",
        title: "Template Saved",
        message: `Template '${template.name}' saved to database.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Save Template",
        message: err.message,
      });
    }
  };

  // Delete Template
  const deleteTemplate = async (id: string) => {
    try {
      setTemplates((prev) => prev.filter((t) => t.id !== id));

      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete template.");
      }

      showToast({
        type: "info",
        title: "Template Deleted",
        message: "Template has been removed.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
    }
  };

  // Update SMTP Settings
  const updateSmtpConfig = async (config: Partial<SmtpConfig>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: config.host,
          smtpPort: Number(config.port),
          smtpUsername: config.username,
          smtpPassword: config.password,
          fromName: config.fromName,
          fromEmail: config.fromEmail,
          secure: config.secure,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save SMTP settings.");
      }

      setSmtpConfig((prev) => ({
        ...prev,
        host: data.smtp?.smtpHost || prev.host,
        port: String(data.smtp?.smtpPort || prev.port),
        username: data.smtp?.smtpUsername || prev.username,
        fromName: data.smtp?.fromName || prev.fromName,
        fromEmail: data.smtp?.fromEmail || prev.fromEmail,
        secure: data.smtp?.secure ?? prev.secure,
        isVerified: data.smtp?.isVerified ?? prev.isVerified,
        lastTested: data.smtp?.lastTested,
      }));

      showToast({
        type: "success",
        title: "SMTP Configuration Saved",
        message: "Outbound email settings updated in database.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Update SMTP",
        message: err.message,
      });
    }
  };

  // Test SMTP Connection
  const testSmtpConnection = async (
    config?: Partial<SmtpConfig>
  ): Promise<boolean> => {
    try {
      const payload = config
        ? {
            smtpHost: config.host,
            smtpPort: config.port ? Number(config.port) : undefined,
            smtpUsername: config.username,
            smtpPassword: config.password,
          }
        : {};

      const res = await fetch("/api/settings/smtp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || "SMTP test failed.");
      }

      setSmtpConfig((prev) => ({
        ...prev,
        isVerified: true,
        lastTested: data.lastTested || new Date().toISOString(),
      }));

      showToast({
        type: "success",
        title: "SMTP Verified! 🚀",
        message: "Successfully connected to your outbound mail server.",
      });

      return true;
    } catch (err: any) {
      showToast({
        type: "error",
        title: "SMTP Test Failed",
        message: err.message,
        duration: 6000,
      });
      return false;
    }
  };

  // Update Profile
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    try {
      setUserProfile((prev) => ({ ...prev, ...profile }));

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          agencyName: profile.agencyName,
          role: profile.role,
          timezone: profile.timezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      if (data.profile) {
        setUserProfile((prev) => ({ ...prev, ...data.profile }));
      }

      showToast({
        type: "success",
        title: "Profile Saved",
        message: "Agency profile information updated.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Update Profile",
        message: err.message,
      });
    }
  };

  // Dynamic Categories & Target Countries Actions (Single Source of Truth)
  const updateCategories = async (newCategories: string[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(newCategories));
    } catch (e) {}
    try {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: newCategories }),
      });
      refreshStats();
    } catch (err) {
      console.error("Failed to sync categories with backend:", err);
    }
  };

  const updateCountries = async (newCountries: string[]) => {
    setCountries(newCountries);
    try {
      localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(newCountries));
    } catch (e) {}
    try {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countries: newCountries }),
      });
    } catch (err) {
      console.error("Failed to sync countries with backend:", err);
    }
  };

  const addCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [trimmed, ...categories];
    await updateCategories(updated);
  };

  const removeCategory = async (name: string) => {
    const updated = categories.filter((c) => c.toLowerCase() !== name.trim().toLowerCase());
    await updateCategories(updated);
  };

  const resetCategories = async () => {
    await updateCategories(DEFAULT_BUSINESS_CATEGORIES);
  };

  // Modals
  const openOutreach = (lead: Lead, channel?: Channel, defaultMessage?: string) => {
    let chosenChannel = channel;
    if (!chosenChannel) {
      if (lead.email) chosenChannel = "email";
      else if (lead.whatsapp || lead.phone) chosenChannel = "whatsapp";
      else if (lead.linkedin) chosenChannel = "linkedin";
      else if (lead.instagram) chosenChannel = "instagram";
      else if (lead.facebook) chosenChannel = "facebook";
      else if (lead.twitter) chosenChannel = "twitter";
      else chosenChannel = "email";
    }
    setActiveOutreach({
      isOpen: true,
      lead,
      channel: chosenChannel,
      defaultMessage,
    });
  };

  const closeOutreach = () => {
    setActiveOutreach({ isOpen: false });
  };

  const openLeadDetails = (leadId: string) => {
    setActiveLeadDetails({ isOpen: true, leadId });
  };

  const closeLeadDetails = () => {
    setActiveLeadDetails({ isOpen: false });
  };

  const openAddLead = (
    initialData?: Partial<Lead>,
    mode: "add" | "edit" = "add",
    editLeadId?: string
  ) => {
    setActiveAddLead({ isOpen: true, initialData, mode, editLeadId });
  };

  const closeAddLead = () => {
    setActiveAddLead({ isOpen: false, mode: "add" });
  };

  const openDeleteConfirm = (leadId: string, businessName: string) => {
    setActiveDeleteConfirm({ isOpen: true, leadId, businessName });
  };

  const closeDeleteConfirm = () => {
    setActiveDeleteConfirm({ isOpen: false });
  };

  const openReschedule = (followUpId: string, leadName: string, currentDate: string) => {
    setActiveReschedule({ isOpen: true, followUpId, leadName, currentDate });
  };

  const closeReschedule = () => {
    setActiveReschedule({ isOpen: false });
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        followUps,
        templates,
        mapBusinesses,
        smtpConfig,
        userProfile,
        stats,
        categories,
        countries,
        isLoading,
        isAuthenticated,
        authModalOpen,
        activeOutreach,
        activeLeadDetails,
        activeAddLead,
        activeDeleteConfirm,
        activeReschedule,
        addLead,
        updateLead,
        deleteLead,
        addLeadFromMap,
        updateLeadStatus,
        logActivity,
        deleteActivity,
        sendEmailSmtp,
        addFollowUp,
        updateFollowUp,
        completeFollowUp,
        deleteFollowUp,
        rescheduleFollowUp,
        updateCategories,
        updateCountries,
        addCategory,
        removeCategory,
        resetCategories,
        saveTemplate,
        deleteTemplate,
        updateSmtpConfig,
        testSmtpConnection,
        updateUserProfile,
        refreshData,
        refreshStats,
        openAuthModal,
        closeAuthModal,
        logout,
        openOutreach,
        closeOutreach,
        openLeadDetails,
        closeLeadDetails,
        openAddLead,
        closeAddLead,
        openDeleteConfirm,
        closeDeleteConfirm,
        openReschedule,
        closeReschedule,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
}
