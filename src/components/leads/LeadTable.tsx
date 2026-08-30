"use client";

import React, { useState } from "react";
import { Lead, Channel, LeadStatus } from "@/lib/types";
import { useCRM } from "@/lib/context/crm-context";
import { LeadStatusBadge, WebsiteStatusBadge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { Pagination } from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportLeadsToCSV } from "@/lib/utils";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LeadTableProps {
  leads: Lead[];
  isLoading?: boolean;
}

export function LeadTable({ leads, isLoading = false }: LeadTableProps) {
  const {
    openLeadDetails,
    openOutreach,
    openAddLead,
    openDeleteConfirm,
    updateLeadStatus,
    deleteLead,
  } = useCRM();

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
                <th className="p-4 text-center">Outreach Channels</th>
                <th className="p-4">Lead Status</th>
                <th className="p-4">Last Contact</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={8} />
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
                        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.location}</span>
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
                          <option value="Replied">Replied</option>
                          <option value="Interested">Interested 🔥</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Meeting">Meeting 📅</option>
                          <option value="Proposal">Proposal</option>
                          <option value="Won">Won 🎉</option>
                          <option value="Lost">Lost</option>
                        </select>
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
                  <td colSpan={8} className="p-0">
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
    </div>
  );
}
