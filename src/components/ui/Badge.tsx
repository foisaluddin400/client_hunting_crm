import React from "react";
import { cn } from "@/lib/utils";
import { WebsiteStatus, LeadStatus, Channel, Priority } from "@/lib/types";
import { TwitterXIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from "./Icons";
import {
  Mail,
  MessageSquare,
  Globe,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
} from "lucide-react";

// Lead Status Badge
export function LeadStatusBadge({
  status,
  className,
  size = "md",
}: {
  status: LeadStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const styles: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
    New: {
      bg: "bg-blue-50 border-blue-200 text-blue-700",
      dot: "bg-blue-500",
      text: "New",
    },
    Qualified: {
      bg: "bg-cyan-50 border-cyan-200 text-cyan-700",
      dot: "bg-cyan-500",
      text: "Qualified",
    },
    Contacted: {
      bg: "bg-indigo-50 border-indigo-200 text-indigo-700",
      dot: "bg-indigo-500",
      text: "Contacted",
    },
    Replied: {
      bg: "bg-purple-50 border-purple-200 text-purple-700",
      dot: "bg-purple-500",
      text: "Replied",
    },
    Interested: {
      bg: "bg-amber-50 border-amber-200 text-amber-700",
      dot: "bg-amber-500",
      text: "Interested 🔥",
    },
    "Follow-up": {
      bg: "bg-orange-50 border-orange-200 text-orange-700",
      dot: "bg-orange-500",
      text: "Follow-up",
    },
    Meeting: {
      bg: "bg-violet-50 border-violet-200 text-violet-700",
      dot: "bg-violet-500",
      text: "Meeting 📅",
    },
    Proposal: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dot: "bg-emerald-500",
      text: "Proposal",
    },
    Won: {
      bg: "bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold",
      dot: "bg-emerald-600 animate-pulse",
      text: "Won 🎉",
    },
    Lost: {
      bg: "bg-slate-100 border-slate-200 text-slate-600",
      dot: "bg-slate-400",
      text: "Lost",
    },
  };

  const current = styles[status] || styles.New;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1.5",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3 py-1.5 text-sm font-medium gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-colors shadow-2xs",
        current.bg,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", current.dot)} />
      <span>{current.text}</span>
    </span>
  );
}

// Website Status Badge
export function WebsiteStatusBadge({
  status,
  className,
  size = "md",
}: {
  status: WebsiteStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const styles: Record<WebsiteStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    "No Website": {
      bg: "bg-rose-50 border-rose-200 text-rose-700 font-medium",
      text: "No Website",
      icon: <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />,
    },
    Redesign: {
      bg: "bg-amber-50 border-amber-200 text-amber-800 font-medium",
      text: "Redesign Needed",
      icon: <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />,
    },
    "SEO Performance": {
      bg: "bg-sky-50 border-sky-200 text-sky-800 font-medium",
      text: "SEO Issues",
      icon: <Globe className="w-3 h-3 text-sky-600 shrink-0" />,
    },
    Other: {
      bg: "bg-slate-100 border-slate-200 text-slate-700 font-medium",
      text: "Other / Good",
      icon: <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />,
    },
  };

  const current = styles[status] || styles.Other;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border shadow-2xs whitespace-nowrap",
        current.bg,
        sizeClasses[size],
        className
      )}
    >
      {current.icon}
      <span>{current.text}</span>
    </span>
  );
}

// Priority Badge
export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const styles: Record<Priority, { bg: string; text: string }> = {
    high: { bg: "bg-rose-50 border-rose-200 text-rose-700", text: "High" },
    medium: { bg: "bg-amber-50 border-amber-200 text-amber-700", text: "Medium" },
    low: { bg: "bg-slate-100 border-slate-200 text-slate-600", text: "Low" },
  };

  const current = styles[priority] || styles.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider text-[10px]",
        current.bg,
        className
      )}
    >
      {current.text}
    </span>
  );
}

// Channel Icon Badge
export function ChannelIcon({
  channel,
  className,
  size = "md",
}: {
  channel: Channel | string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const s = iconSizes[size];

  switch (channel.toLowerCase()) {
    case "email":
      return <Mail className={cn(s, "text-indigo-600", className)} />;
    case "whatsapp":
      return <MessageSquare className={cn(s, "text-emerald-600", className)} />;
    case "linkedin":
      return <LinkedinIcon className={cn(s, "text-[#0A66C2]", className)} />;
    case "instagram":
      return <InstagramIcon className={cn(s, "text-[#E1306C]", className)} />;
    case "facebook":
      return <FacebookIcon className={cn(s, "text-[#1877F2]", className)} />;
    case "twitter":
    case "x":
      return <TwitterXIcon className={cn(s, "text-slate-900", className)} />;
    case "call":
      return <Phone className={cn(s, "text-emerald-600", className)} />;
    case "system":
    default:
      return <Sparkles className={cn(s, "text-slate-500", className)} />;
  }
}
