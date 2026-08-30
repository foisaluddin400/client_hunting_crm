"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Zap, Mail, KeyRound, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    resetToken?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request.");
      }

      setSuccessInfo({
        message: data.message || "Reset link generated.",
        resetToken: data.resetToken,
      });
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
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

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
          Forgot Your Password?
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Enter your registered email address and we will generate a secure reset link.
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

          {/* Success Banner / Step 2 */}
          {successInfo ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Reset Request Verified</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {successInfo.message}
                </p>
              </div>

              {successInfo.resetToken && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs text-slate-600 font-medium">
                    You can proceed immediately to choose a new password:
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() =>
                      router.push(
                        `/reset-password?token=${encodeURIComponent(
                          successInfo.resetToken || ""
                        )}`
                      )
                    }
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full font-bold shadow-md shadow-indigo-500/20"
                  >
                    Reset Password Now
                  </Button>
                </div>
              )}

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@leadflowcrm.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
                autoFocus
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  className="w-full font-bold shadow-md shadow-indigo-500/20"
                >
                  Generate Password Reset
                </Button>
              </div>

              {/* Back to Login */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
