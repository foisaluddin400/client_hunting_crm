"use client";

import React, { useState } from "react";
import { PhoneVerificationResult } from "@/lib/types";
import { getStatusConfig } from "./VerificationStatusBadge";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Phone,
  MessageSquare,
  Globe,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  leadId?: string;
  finderId?: string;
  initialResult?: PhoneVerificationResult | null;
  onVerificationComplete?: (result: PhoneVerificationResult) => void;
}

function formatCheckedDate(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  phone,
  leadId,
  finderId,
  initialResult,
  onVerificationComplete,
}: PhoneVerificationModalProps) {
  const [result, setResult] = useState<PhoneVerificationResult | null>(initialResult || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
    }
  }, [initialResult]);

  if (!isOpen) return null;

  const statusConfig = getStatusConfig(result?.status || "not_checked");
  const isChecked = Boolean(result && result.status !== "not_checked");

  const handleVerify = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/verify/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          leadId,
          finderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify phone");
      }

      setResult(data.result);
      if (onVerificationComplete) {
        onVerificationComplete(data.result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Phone Verification</h3>
              <p className="text-[11px] text-slate-500">Free open-source telecom format & carrier analysis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Phone and Status Header Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-mono text-sm font-bold text-slate-900 truncate" title={phone}>
              {result?.internationalFormat || phone}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Status:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
              >
                <span>{statusConfig.emoji}</span>
                <span>{statusConfig.label}</span>
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Checklist of Free Verification Parameters */}
          {result ? (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Verification Details
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/70 overflow-hidden bg-white">
                {/* 1. Format */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Valid Number Format</span>
                  {result.valid ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid Format
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Invalid Format
                    </span>
                  )}
                </div>

                {/* 2. Country Code */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Country Code</span>
                  {result.countryCode ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {result.countryCode} ({result.regionCode})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      Not detected
                    </span>
                  )}
                </div>

                {/* 3. Country Name */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Country</span>
                  <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> {result.country}
                  </span>
                </div>

                {/* 4. Possible Number */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Possible Number</span>
                  {result.possible ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Possible Length & Prefix
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Impossible
                    </span>
                  )}
                </div>

                {/* 5. Line / Number Type */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Line Type</span>
                  <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                    {result.numberType}
                  </span>
                </div>

                {/* 6. WhatsApp Status */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">WhatsApp</span>
                  {result.whatsappStatus === "yes" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <MessageSquare className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : result.whatsappStatus === "no" ? (
                    <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                      No
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-orange-600 font-semibold"
                      title="Reliable WhatsApp verification requires paid WhatsApp Business API (showing Unknown per rules)"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 7. National Format */}
                {result.nationalFormat && (
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-700 font-medium">National Format</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {result.nationalFormat}
                    </span>
                  </div>
                )}
              </div>

              {/* Explanations note */}
              {result.details && (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{result.details}</span>
                </div>
              )}

              {/* Footer Metadata */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Format: <strong className="text-slate-700">{result.numberType}</strong>
                </span>
                <span>
                  Last Checked:{" "}
                  <strong className="text-slate-700">{formatCheckedDate(result.checkedAt)}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 space-y-2">
              <Phone className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-xs">This phone number has not been verified yet.</p>
              <p className="text-[11px] text-slate-400">
                Click below to run a 100% free format, country, and line-type inspection.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleVerify}
            isLoading={isLoading}
            leftIcon={!isLoading && <RotateCcw className="w-3.5 h-3.5" />}
          >
            {isChecked ? "Verify Again" : "Verify"}
          </Button>
        </div>
      </div>
    </div>
  );
}
