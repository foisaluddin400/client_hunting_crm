import React, { useState, useEffect } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { MessageTemplate, DEFAULT_WEBSITE_AUDIT_PROMPT } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Copy,
  Info,
  Mail,
  Bot,
  Globe,
} from "lucide-react";

export function TemplateSettings() {
  const {
    templates,
    saveTemplate,
    websiteAuditPrompt,
    saveWebsiteAuditPrompt,
  } = useCRM();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"outreach" | "audit">("outreach");

  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(
    templates[0]
  );
  const [editedSubject, setEditedSubject] = useState(selectedTemplate?.subject || "");
  const [editedBody, setEditedBody] = useState(selectedTemplate?.body || "");

  // Audit prompt state
  const [auditPromptInput, setAuditPromptInput] = useState(
    websiteAuditPrompt || DEFAULT_WEBSITE_AUDIT_PROMPT
  );
  const [isSavingAudit, setIsSavingAudit] = useState(false);

  useEffect(() => {
    if (websiteAuditPrompt) {
      setAuditPromptInput(websiteAuditPrompt);
    }
  }, [websiteAuditPrompt]);

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

  const handleSaveAuditPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAudit(true);
    try {
      await saveWebsiteAuditPrompt(auditPromptInput);
    } finally {
      setIsSavingAudit(false);
    }
  };

  const handleInsertToken = (token: string) => {
    setAuditPromptInput((prev) => prev + " " + token);
    showToast({
      type: "info",
      title: "Variable Added",
      message: `Inserted ${token} into prompt.`,
    });
  };

  const handleResetAuditPrompt = () => {
    setAuditPromptInput(DEFAULT_WEBSITE_AUDIT_PROMPT);
    showToast({
      type: "info",
      title: "Reset to Default",
      message: "Restored the standard ChatGPT Website Audit prompt.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("outreach")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "outreach"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Outreach Templates ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "audit"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Website Audit Prompt</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-100 font-bold">
            ChatGPT
          </span>
        </button>
      </div>

      {activeTab === "audit" ? (
        /* Website Audit Prompt Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Guide / Tokens Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl border border-indigo-100/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>ChatGPT Audit Prompt</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you click <strong>ChatGPT Audit</strong> on any lead with a website, this prompt is automatically filled with the lead&apos;s data, copied to your clipboard, and opened in ChatGPT.
              </p>
            </div>

            {/* Dynamic Variables Cheatsheet */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Click to Insert Variable</span>
              </h5>
              <div className="space-y-2">
                {[
                  { token: "{{businessName}}", desc: "Lead's business name" },
                  { token: "{{website}}", desc: "Website URL (auto-included)" },
                  { token: "{{category}}", desc: "Industry / Niche category" },
                  { token: "{{location}}", desc: "City / Geographic location" },
                ].map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => handleInsertToken(item.token)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
                  >
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {item.token}
                    </span>
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-800 transition-colors">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Note: The website URL is always guaranteed to be included even if omitted in your prompt text.
              </p>
            </div>
          </div>

          {/* Right Prompt Editor */}
          <div className="lg:col-span-8">
            <form
              onSubmit={handleSaveAuditPrompt}
              className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Website Audit Prompt Editor
                  </h4>
                  <p className="text-xs text-slate-500">
                    Custom instructions sent to ChatGPT when evaluating lead websites
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Auto-Injected URL
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Audit Prompt Template
                </label>
                <Textarea
                  value={auditPromptInput}
                  onChange={(e) => setAuditPromptInput(e.target.value)}
                  rows={14}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Enter your customized audit prompt..."
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAuditPrompt}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset to Default
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingAudit}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  {isSavingAudit ? "Saving..." : "Save Audit Prompt"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Outreach Templates Tab */
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
      )}
    </div>
  );
}
