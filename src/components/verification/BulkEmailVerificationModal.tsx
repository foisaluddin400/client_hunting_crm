"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lead, EmailVerificationResult } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  X,
  MailCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Check,
  Play,
} from "lucide-react";

interface BulkEmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  leads: Lead[];
  onComplete: () => Promise<void> | void;
}

export function BulkEmailVerificationModal({
  isOpen,
  onClose,
  selectedLeadIds,
  leads,
  onComplete,
}: BulkEmailVerificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [counts, setCounts] = useState({
    valid: 0,
    invalid: 0,
    risky: 0,
    unknown: 0,
  });

  const abortRef = useRef(false);

  // Leads matching selected IDs
  const targetLeads = React.useMemo(() => {
    return leads.filter((l) => selectedLeadIds.includes(l.id));
  }, [leads, selectedLeadIds]);

  const total = targetLeads.length;

  useEffect(() => {
    if (isOpen) {
      abortRef.current = false;
      setIsProcessing(false);
      setIsFinished(false);
      setProcessedCount(0);
      setCounts({ valid: 0, invalid: 0, risky: 0, unknown: 0 });
    }
  }, [isOpen, selectedLeadIds]);

  if (!isOpen) return null;

  const startVerification = async () => {
    setIsProcessing(true);
    setIsFinished(false);
    setProcessedCount(0);
    setCounts({ valid: 0, invalid: 0, risky: 0, unknown: 0 });
    abortRef.current = false;

    const concurrency = 3;
    let index = 0;
    let completed = 0;
    const currentCounts = { valid: 0, invalid: 0, risky: 0, unknown: 0 };

    const worker = async () => {
      while (index < targetLeads.length && !abortRef.current) {
        const currentIndex = index++;
        const lead = targetLeads[currentIndex];

        if (!lead.email || !lead.email.trim()) {
          currentCounts.invalid++;
          completed++;
          setProcessedCount(completed);
          setCounts({ ...currentCounts });
          continue;
        }

        try {
          const res = await fetch("/api/verify/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: lead.email,
              leadId: lead.id,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const status = data.result?.status;
            if (status === "valid") currentCounts.valid++;
            else if (status === "invalid") currentCounts.invalid++;
            else if (status === "risky") currentCounts.risky++;
            else currentCounts.unknown++;
          } else {
            currentCounts.unknown++;
          }
        } catch {
          currentCounts.unknown++;
        }

        completed++;
        setProcessedCount(completed);
        setCounts({ ...currentCounts });

        // Small yield to let React render and prevent any main thread hitching
        await new Promise((r) => setTimeout(r, 40));
      }
    };

    // Run parallel workers with controlled concurrency
    const workers = Array.from({ length: Math.min(concurrency, targetLeads.length) }, () =>
      worker()
    );

    await Promise.all(workers);

    setIsProcessing(false);
    setIsFinished(true);

    // Refresh context data
    try {
      await onComplete();
    } catch {
      // ignore
    }
  };

  const progressPercent = total > 0 ? Math.round((processedCount / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MailCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bulk Email Verification</h3>
              <p className="text-[11px] text-slate-500">
                Verifying {total} selected {total === 1 ? "lead" : "leads"}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {isProcessing || isFinished ? (
            <div className="space-y-4">
              {/* Progress Title and Counter */}
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2 text-slate-700">
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  <span>{isProcessing ? "Verifying emails..." : "Verification complete!"}</span>
                </div>
                <div className="font-mono text-sm text-slate-900 font-bold">
                  {processedCount}/{total} ({progressPercent}%)
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Results Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                {/* Valid */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Valid</span>
                  </div>
                  <span className="text-emerald-900 font-bold text-sm">{counts.valid}</span>
                </div>

                {/* Invalid */}
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold font-sans">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Invalid</span>
                  </div>
                  <span className="text-rose-900 font-bold text-sm">{counts.invalid}</span>
                </div>

                {/* Risky */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Risky</span>
                  </div>
                  <span className="text-amber-900 font-bold text-sm">{counts.risky}</span>
                </div>

                {/* Unknown */}
                <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-orange-800 font-bold font-sans">
                    <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
                    <span>Unknown</span>
                  </div>
                  <span className="text-orange-900 font-bold text-sm">{counts.unknown}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                <MailCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900">
                  Ready to verify {total} {total === 1 ? "email" : "emails"}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Controlled background concurrency. Checks syntax, DNS, MX, SPF, DMARC, and disposable lists for each prospect without stopping on errors.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {isProcessing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                abortRef.current = true;
              }}
            >
              Stop
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              {isFinished ? "Close" : "Cancel"}
            </Button>
          )}

          {!isProcessing && !isFinished ? (
            <Button
              variant="primary"
              size="sm"
              onClick={startVerification}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Start Verification
            </Button>
          ) : isFinished ? (
            <Button variant="primary" size="sm" onClick={onClose} leftIcon={<Check className="w-3.5 h-3.5" />}>
              Done
            </Button>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium animate-pulse">
              Processing batch...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
