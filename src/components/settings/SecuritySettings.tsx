"use client";

import React, { useState } from "react";
import { useToast } from "@/lib/context/toast-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, ShieldCheck, Key, Check } from "lucide-react";

export function SecuritySettings() {
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setSuccessMessage("Your password has been changed successfully.");
      showToast({
        type: "success",
        title: "Password Updated 🔒",
        message: "Your account password has been updated securely.",
      });

      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Security Status Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900">Security & Authentication</h4>
          <p className="text-xs text-slate-500">
            Keep your LeadFlow workspace and connected SMTP credentials secure with a strong password.
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900">Change Password</h4>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed animate-in fade-in duration-150">
            {errorMessage}
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold leading-relaxed animate-in fade-in duration-150">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Current Password *"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password *"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              helperText="Minimum 6 characters"
              required
            />

            <Input
              label="Confirm New Password *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
            className="font-bold shadow-sm"
          >
            Update Password
          </Button>
        </div>
      </div>
    </form>
  );
}
