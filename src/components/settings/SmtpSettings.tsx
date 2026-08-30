"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Server,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

export function SmtpSettings() {
  const { smtpConfig, updateSmtpConfig, testSmtpConnection } = useCRM();
  const { showToast } = useToast();

  const [host, setHost] = useState(smtpConfig.host);
  const [port, setPort] = useState(smtpConfig.port);
  const [username, setUsername] = useState(smtpConfig.username);
  const [password, setPassword] = useState(smtpConfig.password);
  const [fromName, setFromName] = useState(smtpConfig.fromName);
  const [fromEmail, setFromEmail] = useState(smtpConfig.fromEmail);
  const [secure, setSecure] = useState(smtpConfig.secure);

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHost(smtpConfig.host);
    setPort(smtpConfig.port);
    setUsername(smtpConfig.username);
    setFromName(smtpConfig.fromName);
    setFromEmail(smtpConfig.fromEmail);
    setSecure(smtpConfig.secure);
  }, [smtpConfig]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const success = await testSmtpConnection({
      host,
      port,
      username,
      password: password || undefined,
    });

    setIsTesting(false);
    if (success) {
      setTestResult({
        success: true,
        message: `Connected successfully to ${host}:${port}. TLS verification succeeded.`,
      });
    } else {
      setTestResult({
        success: false,
        message: `Connection to ${host}:${port} failed. Please verify your host, port, username, and password.`,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSmtpConfig({
      host,
      port,
      username,
      password: password || undefined,
      fromName,
      fromEmail,
      secure,
    });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Security Info Alert Box */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-900">
            Secure SMTP Server Configuration
          </h4>
          <p className="text-amber-800 leading-relaxed">
            Your SMTP host credentials are securely encrypted on the server using AES-256 and used exclusively for sending outbound outreach emails directly from your agency domain.
          </p>
        </div>
      </div>

      {/* Main SMTP Configuration Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Email / SMTP Server Details
            </h4>
          </div>
          {smtpConfig.isVerified && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS Verified</span>
            </span>
          )}
        </div>

        {/* Host & Port */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="SMTP Host *"
              placeholder="e.g. smtp.sendgrid.net or smtp.gmail.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="SMTP Port *"
              placeholder="587 or 465"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Username & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SMTP Username / API Key *"
            placeholder="e.g. apikey or user@domain.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div>
            <Input
              label="SMTP Password / Secret *"
              type={showPassword ? "text" : "password"}
              placeholder={smtpConfig.hasSmtpPassword ? "•••••••••••••••• (Saved)" : "••••••••••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              helperText={smtpConfig.hasSmtpPassword ? "Leave blank to keep existing encrypted password" : undefined}
            />
          </div>
        </div>

        {/* From Name & From Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <Input
            label="Sender From Name *"
            placeholder="e.g. Alex Morgan | Apex Studio"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            required
          />

          <Input
            label="Sender From Email *"
            type="email"
            placeholder="e.g. alex@apexgrowth.io"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            required
          />
        </div>

        {/* SSL/TLS Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">Enforce SSL / STARTTLS</span>
            <p className="text-slate-500 text-[11px]">
              Encrypt all outgoing socket transmissions with TLS 1.3
            </p>
          </div>
          <input
            type="checkbox"
            checked={secure}
            onChange={(e) => setSecure(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-rose-50 border-rose-200 text-rose-950"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold">
                {testResult.success ? "Connection Verification Succeeded" : "Connection Failed"}
              </span>
              <p className="opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleTestConnection}
            isLoading={isTesting}
            leftIcon={<Zap className="w-4 h-4 text-amber-500" />}
          >
            Test Configuration
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="font-bold shadow-sm"
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </form>
  );
}
