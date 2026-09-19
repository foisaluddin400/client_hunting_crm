"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WebsiteAuditItem, AuditCheckItem } from "@/lib/types";
import { copyToClipboard } from "@/lib/utils";
import { formatDateTime } from "@/lib/date-utils";
import { useToast } from "@/lib/context/toast-context";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Copy,
  RotateCcw,
  Sparkles,
  Zap,
  Smartphone,
  Gauge,
  Layout,
  Check,
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileText,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface AuditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: WebsiteAuditItem | null;
  businessName: string;
  website?: string;
  category?: string;
  location?: string;
  onReAudit?: () => void;
  onRunChatGpt?: () => void;
  isAuditing?: boolean;
}

export function AuditDetailsModal({
  isOpen,
  onClose,
  audit,
  businessName,
  website,
  category,
  location,
  onReAudit,
  onRunChatGpt,
  isAuditing = false,
}: AuditDetailsModalProps) {
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<"all" | "passed" | "improvement" | "failed">("all");
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = async () => {
    if (!audit?.clientSummary) return;
    const ok = await copyToClipboard(audit.clientSummary);
    if (ok) {
      setCopiedSummary(true);
      showToast({
        type: "success",
        title: "Copied to Clipboard!",
        message: "Client-ready audit summary copied.",
      });
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Passed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case "Needs improvement":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "Failed":
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Passed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Passed
          </span>
        );
      case "Needs improvement":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            ⚠ Needs Improvement
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ❌ Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            N/A
          </span>
        );
    }
  };

  const checks = audit?.checks || [];
  const passedCount = checks.filter((c) => c.status === "Passed").length;
  const improvementCount = checks.filter((c) => c.status === "Needs improvement").length;
  const failedCount = checks.filter((c) => c.status === "Failed").length;

  const filteredChecks = checks.filter((c) => {
    if (activeFilter === "passed") return c.status === "Passed";
    if (activeFilter === "improvement") return c.status === "Needs improvement";
    if (activeFilter === "failed") return c.status === "Failed";
    return true;
  });

  const overallScore = audit?.overallScore ?? 0;
  const scoreColor =
    overallScore >= 80
      ? "text-emerald-600"
      : overallScore >= 60
      ? "text-indigo-600"
      : overallScore >= 40
      ? "text-amber-600"
      : "text-rose-600";

  const scoreBg =
    overallScore >= 80
      ? "bg-emerald-50 border-emerald-200"
      : overallScore >= 60
      ? "bg-indigo-50 border-indigo-200"
      : overallScore >= 40
      ? "bg-amber-50 border-amber-200"
      : "bg-rose-50 border-rose-200";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="truncate">Website Audit Report • {businessName}</span>
        </div>
      }
      description={
        <span className="flex items-center gap-2 text-xs">
          <span>{category || "Business"} in {location || "Location"}</span>
          {website && (
            <>
              <span>•</span>
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>{website.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </span>
      }
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Overall Score Card & Sub-scores */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-xs ${scoreBg}`}
              >
                <span className={`text-2xl font-black ${scoreColor}`}>
                  {overallScore}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  / 100
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Overall Audit Health Score
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreBg} ${scoreColor}`}
                  >
                    {overallScore >= 80
                      ? "Healthy"
                      : overallScore >= 60
                      ? "Opportunity Found"
                      : "Action Required"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluated {checks.length} deterministic on-page technical factors, performance metrics, and conversion signals.
                </p>
                {audit?.updatedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Last audited: {formatDateTime(audit.updatedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Re-run & ChatGPT Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {onRunChatGpt && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRunChatGpt}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                  className="text-xs font-bold bg-white"
                >
                  ChatGPT Audit
                </Button>
              )}

              {onReAudit && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onReAudit}
                  isLoading={isAuditing}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Re-run Audit
                </Button>
              )}
            </div>
          </div>

          {/* Sub-scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60">
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Page Speed</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {audit?.scores?.pageSpeed ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Mobile Health</span>
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {audit?.scores?.mobile ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Lighthouse</span>
                <Gauge className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {audit?.scores?.lighthouse ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">UX / Design</span>
                <Layout className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {audit?.scores?.uxTechnicalDesign ?? 0}<span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Problems Found */}
        {audit?.problems && audit.problems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Problems Found ({audit.problems.length})</span>
            </h4>
            <div className="space-y-2">
              {audit.problems.map((prob) => (
                <div
                  key={prob.id}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    prob.severity === "high"
                      ? "bg-rose-50/50 border-rose-200 text-rose-950"
                      : prob.severity === "medium"
                      ? "bg-amber-50/50 border-amber-200 text-amber-950"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 mt-0.5 ${
                      prob.severity === "high"
                        ? "bg-rose-100 text-rose-800"
                        : prob.severity === "medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {prob.severity}
                  </span>
                  <div>
                    <p className="text-xs font-bold">{prob.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{prob.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Technical Checks with Status Filter */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Technical Audit Checklist ({checks.length})
            </h4>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeFilter === "all"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All ({checks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("failed")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeFilter === "failed"
                    ? "bg-rose-600 text-white font-bold"
                    : "text-rose-600 hover:bg-rose-50"
                }`}
              >
                <span>Failed</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                  {failedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("improvement")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeFilter === "improvement"
                    ? "bg-amber-600 text-white font-bold"
                    : "text-amber-600 hover:bg-amber-50"
                }`}
              >
                <span>Needs Improvement</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {improvementCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("passed")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeFilter === "passed"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <span>Passed</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {passedCount}
                </span>
              </button>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs">
            {filteredChecks.map((item) => {
              const isExpanded = expandedCheckId === item.id;
              return (
                <div key={item.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedCheckId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {item.label}
                          </span>
                          {getStatusBadge(item.status)}
                          {item.value && (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.value}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
                      title={isExpanded ? "Collapse" : "Why it matters"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Why it Matters Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 pl-6 text-xs text-slate-600 space-y-1 animate-in fade-in duration-150">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                        Why this matters for your client:
                      </span>
                      <p className="leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-medium text-slate-700">
                        {item.whyItMatters}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Recommended Technical Improvements */}
        {audit?.recommendedImprovements && audit.recommendedImprovements.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Recommended Fixes ({audit.recommendedImprovements.length})</span>
            </h4>
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              {audit.recommendedImprovements.map((fix, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-indigo-950 font-medium">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{fix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Recommended Conversion Features */}
        {audit?.recommendedFeatures && audit.recommendedFeatures.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Recommended Conversion Features</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {audit.recommendedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 text-xs text-purple-950 flex items-start gap-2 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Business-Specific Recommendations */}
        {audit?.businessRecommendations && audit.businessRecommendations.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>{category || "Industry"}-Specific Recommendations</span>
            </h4>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              {audit.businessRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950 font-medium">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    ★
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 6: Client-Ready Cold Outreach Summary */}
        {audit?.clientSummary && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Client-Ready Outreach Pitch Summary</span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                leftIcon={copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                className="text-xs font-bold bg-white"
              >
                {copiedSummary ? "Copied!" : "Copy Summary"}
              </Button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-sans leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-sm">
              {audit.clientSummary}
            </pre>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close Report
        </Button>

        <div className="flex items-center gap-2">
          {audit?.clientSummary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              leftIcon={copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              {copiedSummary ? "Copied" : "Copy Client Pitch"}
            </Button>
          )}

          {onRunChatGpt && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRunChatGpt}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-sm"
            >
              ChatGPT Deep Dive
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
