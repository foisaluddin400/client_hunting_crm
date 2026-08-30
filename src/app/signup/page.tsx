"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/toast-context";
import { useCRM } from "@/lib/context/crm-context";
import { Zap, Mail, Lock, User, Building, UserPlus, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshData } = useCRM();

  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          agencyName: agencyName.trim() || undefined,
          email: email.trim(),
          password,
          role: role.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      showToast({
        type: "success",
        title: "Account Created! 🎉",
        message: `Welcome to LeadFlow, ${data.user?.name || name}!`,
      });

      await refreshData();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                LeadFlow
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                CRM
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Multi-Channel Outreach & Pipeline
            </span>
          </div>
        </div>

        <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Create Your LeadFlow Account
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Start discovering high-ticket leads and automating outreach across 6 channels.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed animate-in fade-in duration-150">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Full Name *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Agency / Studio"
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Apex Growth"
                leftIcon={<Building className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Role / Title"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead Hunter"
              />
            </div>

            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@apexgrowth.io"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              helperText="Minimum 6 characters"
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="w-full font-bold shadow-md shadow-indigo-500/20"
              >
                Create Account & Launch CRM
              </Button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Sign in instead
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          By signing up, your workspace is seeded with high-converting outreach templates.
        </p>
      </div>
    </div>
  );
}
