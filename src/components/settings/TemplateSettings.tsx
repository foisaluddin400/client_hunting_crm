"use client";

import React, { useState } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { MessageTemplate } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Copy,
  Info,
} from "lucide-react";

export function TemplateSettings() {
  const { templates, saveTemplate } = useCRM();
  const { showToast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(
    templates[0]
  );
  const [editedSubject, setEditedSubject] = useState(selectedTemplate?.subject || "");
  const [editedBody, setEditedBody] = useState(selectedTemplate?.body || "");

  const handleSelect = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setEditedSubject(tpl.subject || "");
    setEditedBody(tpl.body || "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MessageTemplate = {
      ...selectedTemplate,
      subject: editedSubject,
      body: editedBody,
    };
    saveTemplate(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Template List Sidebar (Left) */}
      <div className="lg:col-span-4 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Outreach Templates ({templates.length})
        </h4>
        <div className="space-y-1.5">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelect(tpl)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-300 shadow-2xs text-indigo-950 font-bold"
                    : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">{tpl.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {tpl.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Variables Token Cheatsheet */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Supported Dynamic Variables:</span>
          </span>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-indigo-700">
            <span>&#123;business_name&#125;</span>
            <span>&#123;ceo_name&#125;</span>
            <span>&#123;niche&#125;</span>
            <span>&#123;city&#125;</span>
            <span>&#123;sender_name&#125;</span>
            <span>&#123;agency_name&#125;</span>
          </div>
        </div>
      </div>

      {/* Template Editor (Right) */}
      <div className="lg:col-span-8">
        <form
          onSubmit={handleSave}
          className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Edit &quot;{selectedTemplate.name}&quot; Template
              </h4>
              <p className="text-xs text-slate-500">
                Category: {selectedTemplate.category}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              Active Template
            </span>
          </div>

          <Input
            label="Email Subject Line (For Email Outreach)"
            value={editedSubject}
            onChange={(e) => setEditedSubject(e.target.value)}
          />

          <Textarea
            label="Template Message Content"
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={12}
            className="font-mono text-xs leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelect(selectedTemplate)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Save Template Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
