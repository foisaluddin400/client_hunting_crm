import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Lead } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string, timeString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const dateFormatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return timeString ? `${dateFormatted}, ${timeString}` : dateFormatted;
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
    if (diffDays >= 7 && diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function replaceTemplateVariables(
  template: string,
  data: {
    businessName?: string;
    ceoName?: string;
    niche?: string;
    location?: string;
    senderName?: string;
    agencyName?: string;
  }
): string {
  return template
    .replace(/\{business_name\}/g, data.businessName || "your business")
    .replace(/\{business\}/g, data.businessName || "your business")
    .replace(/\{ceo_name\}/g, data.ceoName || "there")
    .replace(/\{name\}/g, data.ceoName || "there")
    .replace(/\{niche\}/g, data.niche || "your industry")
    .replace(/\{location\}/g, data.location || "your area")
    .replace(/\{city\}/g, data.location ? data.location.split(",")[0].trim() : "your city")
    .replace(/\{sender_name\}/g, data.senderName || "Alex Morgan")
    .replace(/\{agency_name\}/g, data.agencyName || "Apex Growth Studio");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-supported contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
}

export function exportLeadsToCSV(leads: Lead[], filename = "leadflow-crm-leads.csv") {
  if (!leads || leads.length === 0) return;

  const headers = [
    "Business Name",
    "CEO / Founder",
    "Niche",
    "Location",
    "Website",
    "Website Status",
    "Email",
    "WhatsApp / Phone",
    "LinkedIn",
    "Instagram",
    "Facebook",
    "Twitter / X",
    "Lead Status",
    "Lead Score",
    "Last Contact",
    "Date Added",
  ];

  const escapeCSV = (str: string | undefined | null) => {
    if (!str) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = leads.map((lead) => [
    escapeCSV(lead.businessName),
    escapeCSV(lead.ceoName),
    escapeCSV(lead.niche),
    escapeCSV(lead.location),
    escapeCSV(lead.website),
    escapeCSV(lead.websiteStatus),
    escapeCSV(lead.email),
    escapeCSV(lead.whatsapp || lead.phone),
    escapeCSV(lead.linkedin),
    escapeCSV(lead.instagram),
    escapeCSV(lead.facebook),
    escapeCSV(lead.twitter),
    escapeCSV(lead.status),
    escapeCSV(lead.leadScore?.toString()),
    escapeCSV(lead.lastContact),
    escapeCSV(lead.dateAdded),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
