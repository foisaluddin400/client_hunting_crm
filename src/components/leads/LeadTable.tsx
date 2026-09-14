"use client";

import React, { useState } from "react";
import { Lead, Channel, LeadStatus, WebsiteAuditItem } from "@/lib/types";
import { useCRM } from "@/lib/context/crm-context";
import { LeadStatusBadge, WebsiteStatusBadge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { Pagination } from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportLeadsToCSV } from "@/lib/utils";
import { AuditDetailsModal } from "./AuditDetailsModal";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import {
  Mail,
  MessageSquare,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  MapPin,
  Sparkles,
  Users,
  Download,
  CheckSquare,
  Square,
  ChevronDown,
  Bot,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LeadTableProps {
  leads: Lead[];
  isLoading?: boolean;
}

function formatLeadDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getScoreBadgeStyle(score?: number) {
  if (score === undefined || score === null) return "bg-slate-100 text-slate-700 border-slate-200";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export function LeadTable({ leads, isLoading = false }: LeadTableProps) {
  const {
    openLeadDetails,
    openOutreach,
    openAddLead,
    openDeleteConfirm,
    updateLeadStatus,
    deleteLead,
    runChatGptAudit,
    runAutomaticAudit,
  } = useCRM();

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Website Audit Details Modal state
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditLead, setSelectedAuditLead] = useState<Lead | null>(null);
  const [currentAudit, setCurrentAudit] = useState<WebsiteAuditItem | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const handleOpenAuditModal = async (lead: Lead) => {
    setSelectedAuditLead(lead);
    setAuditModalOpen(true);
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/audit?leadId=${lead.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.audit) {
          setCurrentAudit(data.audit);
        } else {
          setCurrentAudit(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch lead audit details:", err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleReAuditModal = async () => {
    if (!selectedAuditLead) return;
    setIsLoadingAudit(true);
    const audit = await runAutomaticAudit(selectedAuditLead.id, true);
    if (audit) {
      setCurrentAudit(audit);
    }
    setIsLoadingAudit(false);
  };

  const handleRunChatGptModal = () => {
    if (!selectedAuditLead) return;
    runChatGptAudit(selectedAuditLead);
  };

  const handleDirectAutoAudit = async (lead: Lead) => {
    await runAutomaticAudit(lead.id, false);
  };

  // Multi-select helpers
  const isAllSelected =
    leads.length > 0 && selectedLeadIds.length === leads.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Pagination calculation
  const totalPages = Math.ceil(leads.length / pageSize) || 1;
  const paginatedLeads = leads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportSelected = () => {
    const selected = leads.filter((l) => selectedLeadIds.includes(l.id));
    exportLeadsToCSV(selected.length > 0 ? selected : leads);
  };

  const handleBatchDelete = () => {
    if (selectedLeadIds.length === 0) return;
    if (confirm(`Delete ${selectedLeadIds.length} selected leads?`)) {
      selectedLeadIds.forEach((id) => deleteLead(id));
      setSelectedLeadIds([]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Batch Actions Bar (When items selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-indigo-900 font-bold">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
              {selectedLeadIds.length}
            </span>
            <span>Leads Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="bg-white"
            >
              Export ({selectedLeadIds.length})
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleBatchDelete}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Select all leads"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Business & Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Website Status</th>
                <th className="p-4">Website Audit</th>
                <th className="p-4 text-center">Outreach Channels</th>
                <th className="p-4">Lead Status</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Last Contact</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={10} />
                ))
              ) : paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectLead(lead.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Business & CEO Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl ${
                              lead.avatarColor || "bg-indigo-600"
                            } text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                          >
                            {lead.businessName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openLeadDetails(lead.id)}
                              className="font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors text-left block text-sm"
                            >
                              {lead.businessName}
                            </button>
                            <span className="text-[11px] text-slate-500 font-medium truncate block">
                              {lead.ceoName ? lead.ceoName : "Decision maker not set"} •{" "}
                              <span className="text-slate-400">{lead.niche}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-4 text-slate-600">
                        <div className="space-y-0.5 truncate max-w-[150px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.location}</span>
                          </div>
                          {lead.googleMapsUrl && (
                            <a
                              href={lead.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium pl-5"
                            >
                              <span>View on Maps</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Website & Status */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <WebsiteStatusBadge status={lead.websiteStatus} size="sm" />
                          {lead.website ? (
                            <a
                              href={
                                lead.website.startsWith("http")
                                  ? lead.website
                                  : `https://${lead.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                            >
                              <span className="truncate">
                                {lead.website.replace(/^https?:\/\//, "")}
                              </span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-rose-500 font-medium block">
                              No web address
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Website Audit (ChatGPT & Automatic Engine) */}
                      <td className="p-4">
                        {lead.website ? (
                          <div className="space-y-1.5 min-w-[130px]">
                            <div className="flex items-center gap-1.5">
                              {lead.auditStatus === "AUDITING" ? (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold animate-pulse">
                                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                                  <span>Auditing...</span>
                                </div>
                              ) : lead.auditStatus === "COMPLETED" && lead.auditScore !== undefined ? (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${getScoreBadgeStyle(
                                      lead.auditScore
                                    )}`}
                                  >
                                    {lead.auditScore}/100
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAuditModal(lead)}
                                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <span>Details</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : lead.auditStatus === "FAILED" ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Failed
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectAutoAudit(lead)}
                                    className="text-[11px] text-indigo-600 hover:underline font-medium"
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDirectAutoAudit(lead)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>Auto Audit</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => runChatGptAudit(lead)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors shadow-2xs"
                                title="Prepare prompt and open in ChatGPT"
                              >
                                <Bot className="w-3 h-3 text-indigo-600" />
                                <span>ChatGPT</span>
                              </button>

                              {lead.auditStatus === "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => handleDirectAutoAudit(lead)}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                  title="Re-run automatic audit"
                                >
                                  Re-run
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Contact Channel Action Icons */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Email */}
                          {lead.email ? (
                            <Tooltip content={`Send Email (${lead.email})`}>
                              <button
                                type="button"
                                onClick={() => openOutreach(lead, "email")}
                                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all shadow-2xs"
                                aria-label="Send Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="p-1.5 text-slate-200 cursor-not-allowed">
                              <Mail className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* WhatsApp */}
                          {lead.whatsapp || lead.phone ? (
                            <Tooltip
                              content={`Open WhatsApp (${
                                lead.whatsapp || lead.phone
                              })`}
                            >
                              <button
                                type="button"
                                onClick={() => openOutreach(lead, "whatsapp")}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-[#25D366] hover:text-white border border-emerald-200 transition-all shadow-2xs"
                                aria-label="Open WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="p-1.5 text-slate-200 cursor-not-allowed">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* LinkedIn */}
                          {lead.linkedin ? (
                            <Tooltip content="Open LinkedIn">
                              <button
                                type="button"
                                onClick={() => openOutreach(lead, "linkedin")}
                                className="p-1.5 rounded-lg bg-sky-50 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white border border-sky-200 transition-all shadow-2xs"
                                aria-label="Open LinkedIn"
                              >
                                <LinkedinIcon className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="p-1.5 text-slate-200 cursor-not-allowed">
                              <LinkedinIcon className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Instagram */}
                          {lead.instagram ? (
                            <Tooltip content="Open Instagram DM">
                              <button
                                type="button"
                                onClick={() => openOutreach(lead, "instagram")}
                                className="p-1.5 rounded-lg bg-pink-50 text-[#E1306C] hover:bg-[#E1306C] hover:text-white border border-pink-200 transition-all shadow-2xs"
                                aria-label="Open Instagram"
                              >
                                <InstagramIcon className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="p-1.5 text-slate-200 cursor-not-allowed">
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Facebook */}
                          {lead.facebook ? (
                            <Tooltip content="Open Facebook">
                              <button
                                type="button"
                                onClick={() => openOutreach(lead, "facebook")}
                                className="p-1.5 rounded-lg bg-blue-50 text-[#1877F2] hover:bg-[#1877F2] hover:text-white border border-blue-200 transition-all shadow-2xs"
                                aria-label="Open Facebook"
                              >
                                <FacebookIcon className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="p-1.5 text-slate-200 cursor-not-allowed">
                              <FacebookIcon className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Twitter / X */}
                          {lead.twitter ? (
                            <Tooltip content="Open Twitter/X DM">
                              <button
                                type="button"
                                onClick={() => openOutreach(lead, "twitter")}
                                className="p-1.5 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-black hover:text-white border border-zinc-200 transition-all shadow-2xs"
                                aria-label="Open Twitter/X"
                              >
                                <TwitterXIcon className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="p-1.5 text-slate-200 cursor-not-allowed">
                              <TwitterXIcon className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lead Status Inline Selector */}
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLeadStatus(lead.id, e.target.value as LeadStatus)
                          }
                          className="text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="New">New</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Connected">Connected 🤝</option>
                          <option value="Replied">Replied</option>
                          <option value="Interested">Interested 🔥</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Meeting">Meeting 📅</option>
                          <option value="Proposal">Proposal</option>
                          <option value="Won">Won 🎉</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      {/* Date & Time */}
                      <td className="p-4 text-slate-600 text-[11px] whitespace-nowrap">
                        <span className="font-medium text-slate-700">
                          {formatLeadDateTime(lead.foundAt || lead.dateAdded)}
                        </span>
                      </td>

                      {/* Last Contact */}
                      <td className="p-4 text-slate-500 text-[11px]">
                        {lead.lastContact ? lead.lastContact : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="View Lead Profile & History">
                            <button
                              type="button"
                              onClick={() => openLeadDetails(lead.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              aria-label="View Lead Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Edit Lead">
                            <button
                              type="button"
                              onClick={() => openAddLead(lead, "edit", lead.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              aria-label="Edit Lead"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Delete Lead">
                            <button
                              type="button"
                              onClick={() =>
                                openDeleteConfirm(lead.id, lead.businessName)
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              aria-label="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-0">
                    <EmptyState
                      icon={<Users className="w-6 h-6 text-indigo-600" />}
                      title="No leads match your criteria"
                      description="Try clearing some filters or search for another term, or add a new business to your CRM."
                      actionLabel="Add New Lead"
                      onAction={() => openAddLead()}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={leads.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Website Audit Details Modal */}
      {selectedAuditLead && (
        <AuditDetailsModal
          isOpen={auditModalOpen}
          onClose={() => {
            setAuditModalOpen(false);
            setSelectedAuditLead(null);
          }}
          audit={currentAudit}
          businessName={selectedAuditLead.businessName}
          website={selectedAuditLead.website}
          category={selectedAuditLead.niche}
          location={selectedAuditLead.location}
          onReAudit={handleReAuditModal}
          onRunChatGpt={handleRunChatGptModal}
          isAuditing={isLoadingAudit}
        />
      )}
    </div>
  );
}
