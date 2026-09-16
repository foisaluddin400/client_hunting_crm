"use client";

import React, { useState } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Shield,
} from "lucide-react";

export function SmtpSettings() {
  const { senderGmails, addSenderGmail, deleteSenderGmail } = useCRM();
  const [newGmail, setNewGmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = newGmail.trim().toLowerCase();

    if (!trimmed) {
      setErrorMsg("Please enter a Gmail address.");
      return;
    }

    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsAdding(true);
    const success = await addSenderGmail(trimmed);
    setIsAdding(false);

    if (success) {
      setNewGmail("");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Information Alert Box */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-indigo-950">
            Sender Gmail Accounts
          </h4>
          <p className="text-indigo-800 leading-relaxed">
            Add your Gmail addresses below. When you initiate an email outreach from the Leads table, you will be able to select which Gmail to send from. That selected Gmail will be saved with the lead and locked for all subsequent follow-ups.
          </p>
        </div>
      </div>

      {/* Add Gmail Form Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Add Sender Gmail
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {senderGmails.length} {senderGmails.length === 1 ? "account" : "accounts"} configured
          </span>
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <Input
                label="Gmail Address *"
                placeholder="e.g. yourbusiness@gmail.com or sales@agency.com"
                value={newGmail}
                onChange={(e) => {
                  setNewGmail(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                type="email"
                autoComplete="email"
              />
              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {errorMsg}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isAdding}
              disabled={isAdding || !newGmail.trim()}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-5 shrink-0"
            >
              Add Gmail
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            You can add personal Gmail addresses, Google Workspace emails, or business accounts used for outreach.
          </p>
        </form>
      </div>

      {/* Configured Gmails List */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h4 className="text-sm font-bold text-slate-900">
            Configured Gmail Addresses
          </h4>
          <span className="text-xs font-semibold text-slate-500">
            Selectable in Leads Email Popup
          </span>
        </div>

        {senderGmails.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 space-y-2">
            <Mail className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No Gmail accounts added yet
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Add your first sender Gmail address above so you can select it when sending email outreach to leads.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {senderGmails.map((gmail, index) => (
              <div
                key={gmail}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {gmail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        Active Sender
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-full border border-indigo-100">
                          Primary Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSenderGmail(gmail)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove Gmail address"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const GmailSettings = SmtpSettings;
