"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { User, Building2, Mail, Check } from "lucide-react";

export function ProfileSettings() {
  const { userProfile, updateUserProfile } = useCRM();

  const [name, setName] = useState(userProfile.name);
  const [agencyName, setAgencyName] = useState(userProfile.agencyName);
  const [email, setEmail] = useState(userProfile.email);
  const [role, setRole] = useState(userProfile.role);
  const [timezone, setTimezone] = useState(userProfile.timezone);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(userProfile.name);
    setAgencyName(userProfile.agencyName);
    setEmail(userProfile.email);
    setRole(userProfile.role);
    setTimezone(userProfile.timezone);
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserProfile({
      name,
      agencyName,
      email,
      role,
      timezone,
    });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Avatar Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
          />
          <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-900">{name}</h4>
          <p className="text-xs text-slate-500">{agencyName} • {role}</p>
          <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 inline-block">
            Pro Agency Plan
          </span>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-3">
          Agency & Sender Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Agency / Studio Name *"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Primary Work Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Role / Title"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Lead Hunter & Web Consultant"
          />
        </div>

        <div>
          <Select
            label="Operating Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="America/Chicago (CST)">America/Chicago (CST) - UTC-6</option>
            <option value="America/New_York (EST)">America/New_York (EST) - UTC-5</option>
            <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST) - UTC-8</option>
            <option value="Europe/London (GMT)">Europe/London (GMT) - UTC+0</option>
            <option value="Europe/Paris (CET)">Europe/Paris (CET) - UTC+1</option>
            <option value="Asia/Dubai (GST)">Asia/Dubai (GST) - UTC+4</option>
            <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT) - UTC+8</option>
          </Select>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Check className="w-4 h-4" />}
            className="font-bold shadow-sm"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
