"use client";

import React, { useState } from "react";
import { EmailVerificationResult, VerificationStatus } from "@/lib/types";
import { getStatusConfig } from "./VerificationStatusBadge";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
  Mail,
  ShieldCheck,
  Server,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  leadId?: string;
  finderId?: string;
  initialResult?: EmailVerificationResult | null;
  onVerificationComplete?: (result: EmailVerificationResult) => void;
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

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  leadId,
  finderId,
  initialResult,
  onVerificationComplete,
}: EmailVerificationModalProps) {
  const [result, setResult] = useState<EmailVerificationResult | null>(initialResult || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if initialResult changes
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
      const res = await fetch("/api/verify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          leadId,
          finderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify email");
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
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Email Verification</h3>
              <p className="text-[11px] text-slate-500">Real-time free DNS & mail server inspection</p>
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
          {/* Email and Status Header Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-mono text-sm font-bold text-slate-900 truncate" title={email}>
              {email}
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
                Verification Checks
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/70 overflow-hidden bg-white">
                {/* 1. Syntax */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Syntax Format</span>
                  {result.syntaxValid ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Invalid
                    </span>
                  )}
                </div>

                {/* 2. Domain Existence */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Domain Existence</span>
                  {result.domainExists === true ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : result.domainExists === false ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Not Found
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 3. MX Record */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">MX Record</span>
                  {result.mxRecord === true ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                    </span>
                  ) : result.mxRecord === false ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 4. Mail Server Availability */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Mail Server</span>
                  {result.mailServer === true ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reachable
                    </span>
                  ) : result.mailServer === false ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Unreachable
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-orange-600 font-semibold"
                      title="Port 25 blocked or network connection timed out (safe free check)"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 5. SPF Record */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">SPF Record</span>
                  {result.spf === true ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Present
                    </span>
                  ) : result.spf === false ? (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      Not Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 6. DMARC */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">DMARC Record</span>
                  {result.dmarc === true ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Present
                    </span>
                  ) : result.dmarc === false ? (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      Not Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 7. Disposable Check */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Disposable Email</span>
                  {result.disposable ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Disposable / Temp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Clean (Not Disposable)
                    </span>
                  )}
                </div>

                {/* 8. Domain Type */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Domain Type</span>
                  {result.freeProvider ? (
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      Public Webmail (Gmail/Yahoo/etc.)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Business Domain
                    </span>
                  )}
                </div>

                {/* 9. Role-Based */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Role-Based Account</span>
                  {result.roleBased ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Yes (Role/Generic)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Individual Account
                    </span>
                  )}
                </div>

                {/* 10. SMTP Handshake */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">SMTP Handshake</span>
                  {result.smtpStatus === "available" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Responded OK
                    </span>
                  ) : result.smtpStatus === "rejected" ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Blocked / Refused
                    </span>
                  ) : result.smtpStatus === "inconclusive" ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Greylisted / Rate-limit
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-orange-600 font-semibold"
                      title="Outbound port 25 is restricted by host network"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>

                {/* 11. Catch-All */}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-700 font-medium">Catch-All Detection</span>
                  {result.catchAll === true ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Yes (Catch-All Domain)
                    </span>
                  ) : result.catchAll === false ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disabled / Specific
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5" /> Unknown
                    </span>
                  )}
                </div>
              </div>

              {/* Explanations note */}
              {result.details && (
                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{result.details}</span>
                </div>
              )}

              {/* Footer Metadata */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Email Type: <strong className="text-slate-700">{result.emailType}</strong>
                </span>
                <span>
                  Last Checked:{" "}
                  <strong className="text-slate-700">{formatCheckedDate(result.checkedAt)}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-xs">This email address has not been verified yet.</p>
              <p className="text-[11px] text-slate-400">
                Click below to run a 100% free DNS, MX, SPF, DMARC, and disposable check.
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
