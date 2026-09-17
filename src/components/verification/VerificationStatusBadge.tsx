"use client";

import React from "react";
import { VerificationStatus } from "@/lib/types";
import { Tooltip } from "@/components/ui/Tooltip";

interface VerificationStatusBadgeProps {
  status?: VerificationStatus | null;
  checkedAt?: string | Date | null;
  onClick?: (e: React.MouseEvent) => void;
  size?: "xs" | "sm" | "md";
  className?: string;
  type?: "email" | "phone";
}

function formatTimeAgo(dateInput?: string | Date | null): string {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "just now";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getStatusConfig(status?: VerificationStatus | null) {
  switch (status) {
    case "valid":
      return {
        label: "Valid",
        dotColor: "bg-emerald-500",
        borderColor: "border-emerald-300",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        emoji: "🟢",
      };
    case "invalid":
      return {
        label: "Invalid",
        dotColor: "bg-rose-500",
        borderColor: "border-rose-300",
        bgColor: "bg-rose-50",
        textColor: "text-rose-700",
        emoji: "🔴",
      };
    case "risky":
      return {
        label: "Risky",
        dotColor: "bg-amber-500",
        borderColor: "border-amber-300",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        emoji: "🟡",
      };
    case "unknown":
      return {
        label: "Unknown",
        dotColor: "bg-orange-500",
        borderColor: "border-orange-300",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        emoji: "🟠",
      };
    case "not_checked":
    default:
      return {
        label: "Not Checked",
        dotColor: "bg-slate-300",
        borderColor: "border-slate-200",
        bgColor: "bg-slate-50",
        textColor: "text-slate-500",
        emoji: "⚪",
      };
  }
}

export function VerificationStatusBadge({
  status = "not_checked",
  checkedAt,
  onClick,
  size = "sm",
  className = "",
  type = "email",
}: VerificationStatusBadgeProps) {
  const config = getStatusConfig(status);
  const timeAgo = formatTimeAgo(checkedAt);

  const tooltipText =
    status && status !== "not_checked" && checkedAt
      ? `${config.label} — Last checked ${timeAgo}`
      : `${config.label} — Click to verify`;

  const dotSize =
    size === "xs" ? "w-2 h-2" : size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <Tooltip content={tooltipText}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Verification status: ${config.label}`}
        className={`inline-flex items-center justify-center p-0.5 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer ${className}`}
      >
        <span
          className={`${dotSize} rounded-full ${config.dotColor} ring-1 ring-white shadow-2xs inline-block`}
        />
      </button>
    </Tooltip>
  );
}
