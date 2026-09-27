"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Missing or invalid reset token. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to reset password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-[#121826]/95 backdrop-blur-xl border border-border-gold-accent shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden border-t-2 border-t-[#D4AF37]">
      {/* Card Header */}
      <div className="p-8 pb-6 border-b border-border-midnight/80 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-canvas-obsidian border border-border-gold-accent flex items-center justify-center text-champagne-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]">
          <svg className="w-6 h-6 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl text-text-surface font-normal">
          Set New Password
        </h1>

        <p className="font-body text-xs text-text-surface-variant max-w-xs mx-auto leading-relaxed">
          Create a secure, strong password to access your encrypted clinical vault.
        </p>
      </div>

      {/* Form Content */}
      <div className="p-8 space-y-6">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-canvas-obsidian border border-emerald-500/50 space-y-2">
              <div className="text-emerald-400 font-mono text-xs font-semibold">
                ✓ Password Successfully Reset
              </div>
              <p className="font-body text-xs text-slate-300 leading-relaxed">
                Your credentials have been updated in the Zero-ePHI enclave. Redirecting to sign in...
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-[#120e00] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                <span>Sign In Now</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs">
              No authorization token detected in link. Please request a new password reset link.
            </div>
            <Link
              href="/forgot-password"
              className="font-mono text-xs text-champagne-gold hover:underline inline-block pt-2"
            >
              Request New Reset Link &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs text-center"
              >
                {errorMessage}
              </div>
            )}

            {/* Input 1: New Password */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="new-password"
                  className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
                >
                  New Password
                </label>
                <span className="font-mono text-[10px] text-slate-500">Min 8 characters</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Input 2: Confirm New Password */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="confirm-password"
                className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
              >
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-[#120e00] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] disabled:opacity-75 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#120e00] border-t-transparent rounded-full animate-spin" />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-8 py-4 bg-canvas-obsidian/70 border-t border-border-midnight flex items-center justify-between text-[10px] font-mono text-text-surface-muted">
        <span>Zero-ePHI Standard</span>
        <span>BCrypt 10-Round Hash</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between p-6 relative overflow-hidden selection:bg-champagne-gold selection:text-text-on-gold">
      {/* Background Ambient Glow & Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] opacity-20 blur-[140px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.5) 0%, rgba(78,107,94,0.3) 45%, rgba(11,15,25,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-lg tracking-wider text-champagne-gold font-semibold group-hover:text-champagne-gold-light transition-colors">
            COGNITIVE EDGE CLINIC
          </span>
          <span className="text-xs font-mono text-text-surface-muted">/</span>
          <span className="font-mono text-xs text-text-surface-variant uppercase tracking-wider">
            Credential Authorization
          </span>
        </Link>

        <Link
          href="/login"
          className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-champagne-gold transition-colors inline-flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Return to Sign In</span>
        </Link>
      </header>

      {/* Main Content wrapped in Suspense for useSearchParams */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12">
        <Suspense
          fallback={
            <div className="p-8 font-mono text-xs text-[#D4AF37] text-center">
              Verifying Authorization Token...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center font-mono text-[10px] text-text-surface-muted py-4">
        &copy; 2026 COGNITIVE EDGE CLINIC &bull; ENCRYPTED MEMBER ENCLAVE &bull; WINSTON-SALEM, NC
      </footer>
    </div>
  );
}
