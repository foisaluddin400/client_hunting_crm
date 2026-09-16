"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { MessageTemplate, DEFAULT_WEBSITE_AUDIT_PROMPT } from "@/lib/types";
import { normalizeCategory } from "@/lib/transformers";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  Mail,
  Bot,
  Globe,
  Layers,
  Repeat,
} from "lucide-react";

export const OUTREACH_CATEGORIES = [
  "No Website",
  "Website Redesign",
  "SEO Improvement",
  "Booking System",
  "Custom Website",
  "Mobile App",
  "General Introduction",
] as const;

export function TemplateSettings() {
  const {
    templates,
    saveTemplate,
    deleteTemplate,
    websiteAuditPrompt,
    saveWebsiteAuditPrompt,
  } = useCRM();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"outreach" | "followup" | "audit">("outreach");

  // Outreach category selection (one of the 7)
  const [activeCategory, setActiveCategory] = useState<string>("No Website");

  // Filter templates by normalized category
  const outreachTemplates = useMemo(() => {
    return templates.filter((t) => {
      const norm = normalizeCategory(t.category);
      return norm !== "Follow-up";
    });
  }, [templates]);

  const categoryTemplates = useMemo(() => {
    return outreachTemplates.filter(
      (t) => normalizeCategory(t.category) === activeCategory
    );
  }, [outreachTemplates, activeCategory]);

  const followUpTemplates = useMemo(() => {
    return templates.filter(
      (t) => normalizeCategory(t.category) === "Follow-up"
    );
  }, [templates]);

  // Selected template state
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Sync selected template when active tab / category changes
  useEffect(() => {
    if (activeTab === "outreach") {
      if (categoryTemplates.length > 0) {
        // If current selected template is in this category, keep it
        const stillInCat = categoryTemplates.find((t) => t.id === selectedTemplate?.id);
        const tpl = stillInCat || categoryTemplates[0];
        setSelectedTemplate(tpl);
        setEditedName(tpl.name || "");
        setEditedSubject(tpl.subject || "");
        setEditedBody(tpl.body || "");
      } else {
        setSelectedTemplate(null);
        setEditedName("");
        setEditedSubject("");
        setEditedBody("");
      }
    } else if (activeTab === "followup") {
      if (followUpTemplates.length > 0) {
        const stillInFollowup = followUpTemplates.find((t) => t.id === selectedTemplate?.id);
        const tpl = stillInFollowup || followUpTemplates[0];
        setSelectedTemplate(tpl);
        setEditedName(tpl.name || "");
        setEditedSubject(tpl.subject || "");
        setEditedBody(tpl.body || "");
      } else {
        setSelectedTemplate(null);
        setEditedName("");
        setEditedSubject("");
        setEditedBody("");
      }
    }
  }, [activeTab, activeCategory, categoryTemplates, followUpTemplates]);

  const handleSelectTemplate = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setEditedName(tpl.name || "");
    setEditedSubject(tpl.subject || "");
    setEditedBody(tpl.body || "");
  };

  const handleAddNewTemplate = (category: string) => {
    const isFollowUpCat = category === "Follow-up";
    const existingCount = isFollowUpCat
      ? followUpTemplates.length
      : categoryTemplates.length;
    const newTitle = `${category} - Template ${existingCount + 1}`;

    const newDraft: MessageTemplate = {
      id: `draft-${Date.now()}`,
      name: newTitle,
      category,
      subject: `New ${category} Outreach regarding {business_name}`,
      body: `Hi {ceo_name},\n\nI noticed {business_name} in {location}...\n\nBest regards,\n{sender_name}`,
      channels: ["email", "whatsapp", "linkedin"],
    };

    setSelectedTemplate(newDraft);
    setEditedName(newDraft.name);
    setEditedSubject(newDraft.subject || "");
    setEditedBody(newDraft.body);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim() || !editedBody.trim()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Template title and message content are required.",
      });
      return;
    }

    const currentCat = activeTab === "followup" ? "Follow-up" : activeCategory;
    const isNew = !selectedTemplate?.id || selectedTemplate.id.startsWith("draft-");

    setIsSavingTemplate(true);
    try {
      await saveTemplate({
        id: isNew ? undefined : selectedTemplate?.id,
        name: editedName.trim(),
        category: currentCat,
        subject: editedSubject.trim() || undefined,
        body: editedBody.trim(),
        channels: selectedTemplate?.channels || ["email", "whatsapp", "linkedin"],
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    if (id && !id.startsWith("draft-")) {
      await deleteTemplate(id);
    }
    setSelectedTemplate(null);
  };

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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("outreach")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "outreach"
              ? "bg-indigo-600 text-white shadow-xs font-bold"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Outreach Templates ({outreachTemplates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("followup")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "followup"
              ? "bg-indigo-600 text-white shadow-xs font-bold"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Follow-up Outreach Templates ({followUpTemplates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "audit"
              ? "bg-indigo-600 text-white shadow-xs font-bold"
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

      {/* Tab 1: Outreach Templates (7 categories with multiple templates) */}
      {activeTab === "outreach" && (
        <div className="space-y-4">
          {/* 7 Categories Pill Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
            {OUTREACH_CATEGORIES.map((cat) => {
              const count = outreachTemplates.filter(
                (t) => normalizeCategory(t.category) === cat
              ).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-indigo-900 shadow-2xs font-bold border border-indigo-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Template Master-Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template List Sidebar (Left) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {activeCategory} ({categoryTemplates.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNewTemplate(activeCategory)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  Add Template
                </Button>
              </div>

              <div className="space-y-2">
                {categoryTemplates.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs font-medium text-slate-500">
                      No templates under &quot;{activeCategory}&quot; yet.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddNewTemplate(activeCategory)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Create First Template
                    </Button>
                  </div>
                ) : (
                  categoryTemplates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 shadow-2xs text-indigo-950 font-bold"
                            : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate">{tpl.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal shrink-0">
                            {tpl.subject ? "Subject set" : "No subject"}
                          </span>
                        </div>
                        {tpl.subject && (
                          <p className="text-[11px] text-slate-500 font-normal truncate">
                            {tpl.subject}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Supported Dynamic Variables */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dynamic Variables:</span>
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
              {selectedTemplate ? (
                <form
                  onSubmit={handleSaveTemplate}
                  className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {selectedTemplate.id.startsWith("draft-")
                          ? "New Template"
                          : `Edit "${selectedTemplate.name}"`}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Category: <strong className="text-slate-800">{activeCategory}</strong>
                      </p>
                    </div>
                    {selectedTemplate.id && !selectedTemplate.id.startsWith("draft-") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                        className="text-rose-600 hover:bg-rose-50 text-xs"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </Button>
                    )}
                  </div>

                  <Input
                    label="Template Title / Angle *"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="e.g. Quick Mockup Pitch, Pain-Point Focus, Short Inbound..."
                    required
                  />

                  <Input
                    label="Email Subject Line (For Email Outreach)"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    placeholder="e.g. Quick question regarding {business_name}'s web presence"
                  />

                  <Textarea
                    label="Template Message Content *"
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={12}
                    className="font-mono text-xs leading-relaxed"
                    placeholder="Write your template message here..."
                    required
                  />

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectTemplate(selectedTemplate)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSavingTemplate}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Save Template Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    No Template Selected
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a template from the list on the left to edit its Subject and Message, or create a new template for {activeCategory}.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddNewTemplate(activeCategory)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add New {activeCategory} Template
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Follow-up Outreach Templates */}
      {activeTab === "followup" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
            <Repeat className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-amber-950">
                Follow-up Outreach Templates
              </h4>
              <p className="text-amber-800 leading-relaxed">
                Configure multi-touch follow-up templates here. These templates appear automatically in the Follow-ups route when you continue outreach to an existing lead.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Follow-up Templates List Sidebar (Left) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Follow-up Templates ({followUpTemplates.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNewTemplate("Follow-up")}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Add Follow-up
                </Button>
              </div>

              <div className="space-y-2">
                {followUpTemplates.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs font-medium text-slate-500">
                      No follow-up templates created yet.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddNewTemplate("Follow-up")}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Create First Follow-up Template
                    </Button>
                  </div>
                ) : (
                  followUpTemplates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          isSelected
                            ? "bg-amber-50 border-amber-300 shadow-2xs text-amber-950 font-bold"
                            : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate">{tpl.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold shrink-0">
                            Follow-up
                          </span>
                        </div>
                        {tpl.subject && (
                          <p className="text-[11px] text-slate-500 font-normal truncate">
                            {tpl.subject}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Supported Dynamic Variables */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dynamic Variables:</span>
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-amber-800">
                  <span>&#123;business_name&#125;</span>
                  <span>&#123;ceo_name&#125;</span>
                  <span>&#123;niche&#125;</span>
                  <span>&#123;city&#125;</span>
                  <span>&#123;sender_name&#125;</span>
                  <span>&#123;agency_name&#125;</span>
                </div>
              </div>
            </div>

            {/* Follow-up Template Editor (Right) */}
            <div className="lg:col-span-8">
              {selectedTemplate ? (
                <form
                  onSubmit={handleSaveTemplate}
                  className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {selectedTemplate.id.startsWith("draft-")
                          ? "New Follow-up Template"
                          : `Edit "${selectedTemplate.name}"`}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Category: <strong className="text-amber-800">Follow-up Outreach</strong>
                      </p>
                    </div>
                    {selectedTemplate.id && !selectedTemplate.id.startsWith("draft-") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                        className="text-rose-600 hover:bg-rose-50 text-xs"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </Button>
                    )}
                  </div>

                  <Input
                    label="Follow-up Title / Touchpoint *"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="e.g. Follow-up #1: Friendly Check-in, Follow-up #2: Added Value..."
                    required
                  />

                  <Input
                    label="Email Subject Line (For Follow-up Email)"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    placeholder="e.g. Following up regarding {business_name}"
                  />

                  <Textarea
                    label="Follow-up Message Content *"
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={12}
                    className="font-mono text-xs leading-relaxed"
                    placeholder="Write your follow-up message..."
                    required
                  />

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectTemplate(selectedTemplate)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSavingTemplate}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      className="bg-amber-600 hover:bg-amber-500 font-bold"
                    >
                      Save Follow-up Template
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <Repeat className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    No Follow-up Template Selected
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a follow-up template from the list on the left to edit, or create a new follow-up touchpoint.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddNewTemplate("Follow-up")}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="bg-amber-600 hover:bg-amber-500 font-bold"
                  >
                    Add Follow-up Template
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Website Audit Prompt (Unchanged) */}
      {activeTab === "audit" && (
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
      )}
    </div>
  );
}
