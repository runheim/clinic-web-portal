"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface LoginFormProps {
  onSuccess?: (role: string) => void;
  defaultEmail?: string;
  className?: string;
}

export default function LoginForm({
  onSuccess,
  defaultEmail = "",
  className = "",
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Passcode must be at least 6 characters.");
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus("VERIFYING TLS 1.3 CLIENT TOKEN...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsAuthenticating(false);
        setErrorMessage(data.error || "Invalid credentials");
        setAuthStatus(null);
        return;
      }

      setAuthStatus("INITIALIZING ZERO-ePHI VAULT ENCLAVE...");
      onSuccess?.(data.role);

      setTimeout(() => {
        router.push(data.redirectUrl || "/vault");
      }, 500);
    } catch {
      setIsAuthenticating(false);
      setErrorMessage("Authentication service unavailable.");
      setAuthStatus(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs text-center"
        >
          {errorMessage}
        </div>
      )}

      {/* Input 1: Email Address */}
      <div className="space-y-2 text-left">
        <label
          htmlFor="login-email"
          className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
        >
          Clinical Communication Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@executive-domain.com"
          className="w-full px-4 py-3 rounded-lg bg-canvas-obsidian border border-border-midnight text-text-surface font-mono text-xs placeholder:text-text-surface-muted/40 focus:outline-none focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold/40 transition-all"
        />
      </div>

      {/* Input 2: Password with Show/Hide Toggle */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="block font-mono text-[11px] uppercase tracking-wider text-text-surface-muted"
          >
            Passcode / Token
          </label>
          <span className="font-mono text-[10px] text-vitality-sage">
            TLS 1.3 SECURE
          </span>
        </div>
        <div className="relative flex items-center">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="••••••••••••"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 p-1 text-slate-400 hover:text-[#D4AF37] focus:outline-none transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            data-testid="toggle-passcode-visibility"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isAuthenticating}
        className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-[#120e00] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] disabled:opacity-75 cursor-pointer"
      >
        {isAuthenticating ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-[#120e00] border-t-transparent rounded-full animate-spin" />
            <span>Authenticating Session...</span>
          </>
        ) : (
          <>
            <span>Sign In to Portal</span>
            <span>&rarr;</span>
          </>
        )}
      </button>

      {authStatus && (
        <div
          role="status"
          className="p-2.5 rounded bg-canvas-obsidian border border-vitality-sage/40 text-vitality-sage text-center font-mono text-[10px] animate-pulse"
        >
          {authStatus}
        </div>
      )}
    </form>
  );
}
