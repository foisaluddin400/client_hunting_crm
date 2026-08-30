"use client";

import React, { useState } from "react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SmtpSettings } from "@/components/settings/SmtpSettings";
import { TemplateSettings } from "@/components/settings/TemplateSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { Tabs } from "@/components/ui/Tabs";
import { User, Server, FileText, Lock } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("smtp");

  const tabs = [
    {
      id: "smtp",
      label: "Email / SMTP Server",
      icon: <Server className="w-4 h-4" />,
    },
    {
      id: "profile",
      label: "Agency Profile",
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "templates",
      label: "Outreach Templates",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "security",
      label: "Security & Password",
      icon: <Lock className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Settings & Integrations
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure your outbound SMTP credentials, agency profile, security, and default outreach templates
        </p>
      </div>

      {/* Tabs Switcher */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
        variant="underline"
      />

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === "smtp" && <SmtpSettings />}
        {activeTab === "profile" && <ProfileSettings />}
        {activeTab === "templates" && <TemplateSettings />}
        {activeTab === "security" && <SecuritySettings />}
      </div>
    </div>
  );
}
