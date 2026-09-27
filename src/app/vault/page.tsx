"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { BookingModal } from "@/components/marketing/BookingModal";

export const inPortalServices = [
  {
    name: "Deep TMS (Neuroplasticity, Mood, Executive Performance & Insomnia)",
    category: "Targeted Neuromodulation",
    detail: "10 Hz Theta-Burst DLPFC recalibration paired with Ca-AKG epigenetic priming.",
    coverage: "Eligible for commercial health insurance coverage with private protocol tiers.",
  },
  {
    name: "Expanded Dementia & MCI Therapies (including Alzheimer's anti-amyloid navigation)",
    category: "Neuro-Cognitive Trajectory",
    detail: "Longitudinal blood-brain barrier monitoring, p-Tau217 tracking, and emerging anti-amyloid clinical coordination.",
    coverage: "Physician clinical consultations and diagnostic evaluations billable to insurance.",
  },
  {
    name: "Testosterone Pellet Implantation & Endocrine BHRT",
    category: "Precision Endocrinology",
    detail: "Subcutaneous bioidentical hormone pellet kinetics and androgen receptor balancing.",
    coverage: "Evaluation and comprehensive laboratory panels billable to insurance.",
  },
  {
    name: "Clinical Intravenous (IV) Infusion & Micronutrient Therapy",
    category: "Cellular Bioenergetics",
    detail: "Targeted stoichiometric coenzyme formulas, high-potency glutathione, and peripheral nerve infusions.",
    coverage: "Physician consultation insurance eligible; compound infusion fees apply.",
  },
  {
    name: "BTL Emsella Pelvic Floor & Autonomic Vagal Restoration",
    category: "HIFEM Autonomic Remodeling",
    detail: "2.5 Tesla supramaximal pelvic diaphragm remodeling restoring vagal reserve and parasympathetic braking.",
    coverage: "Specialized in-clinic neuromodulation protocol series.",
  },
  {
    name: "Regenerative & Anti-Aging Peptides (Epitalon, BPC-157, GHK-Cu)",
    category: "Cellular Bioregulators",
    detail: "Subcutaneous cyclical bioregulators targeting pineal melatonin nadir, vascular tight junctions, and cellular repair.",
    coverage: "Physician oversight and compounding pharmacy coordination.",
  },
  {
    name: "Dual & Tri-Agonist GLP-1 Weight Management",
    category: "Metabolic Medicine",
    detail: "Next-generation incretin receptor therapy paired with essential amino acid kinetic pacing to prevent sarcopenia.",
    coverage: "Initial physician intake and metabolic laboratory work billable to insurance.",
  },
  {
    name: "Red Light Therapy & Transcranial Photobiomodulation",
    category: "Mitochondrial Optics",
    detail: "Dual-wavelength (810nm / 1064nm) pulsed near-infrared light targeting Cytochrome c Oxidase Unit IV.",
    coverage: "Integrated restorative clinical protocol.",
  },
  {
    name: "Bespoke Vitamin, Peripheral Nerve & Mitochondrial Formulations",
    category: "Neuro-Mitochondrial",
    detail: "Active coenzyme forms (5-MTHF, Methyl-B12, P-5-P) bypassing MTHFR and transsulfuration bottlenecks.",
    coverage: "Personalized pharmaceutical compounding oversight.",
  },
  {
    name: "Mitochondrial, NAD+ & BDNF Amplification Protocols",
    category: "Intracellular Resuscitation",
    detail: "Direct replenishment of intracellular NAD+ corridors (40–100 μM) and TrkB neurogenesis activation.",
    coverage: "Physician-monitored stoichiometric protocol series.",
  },
];

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export interface VaultInnerProps {
  initialAuthenticated?: boolean;
  initialEmail?: string | null;
  initialRole?: "admin" | "client";
}

export const VaultInner: React.FC<VaultInnerProps> = ({
  initialAuthenticated = false,
  initialEmail = null,
  initialRole = "client",
}) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [memberEmail, setMemberEmail] = useState<string | null>(initialEmail);
  const [memberRole, setMemberRole] = useState<"admin" | "client">(
    initialRole ||
      (initialEmail?.toLowerCase().includes("admin") || initialEmail?.toLowerCase().includes("owner")
        ? "admin"
        : "client")
  );

  // Form inputs (Email + Password only)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Administrative Client Provisioning State
  const [provEmail, setProvEmail] = useState("");
  const [provPassword, setProvPassword] = useState("");
  const [provName, setProvName] = useState("");
  const [provError, setProvError] = useState<string | null>(null);
  const [provSpruceMsg, setProvSpruceMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Security & Password Settings State
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check existing session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setMemberEmail(data.email);
          const emailLower = (data.email || "").toLowerCase();
          const role =
            data.role === "admin" || emailLower.includes("admin") || emailLower.includes("owner")
              ? "admin"
              : "client";
          setMemberRole(role);
        }
      })
      .catch(() => {});
  }, []);

  // Email & Password Submit Handler
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setIsAuthenticated(true);
      setMemberEmail(data.email);
      const emailLower = (data.email || "").toLowerCase();
      const role =
        data.role === "admin" || emailLower.includes("admin") || emailLower.includes("owner")
          ? "admin"
          : "client";
      setMemberRole(role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to authenticate.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProvisionClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvError(null);
    setProvSpruceMsg(null);
    setCopied(false);

    if (!provEmail || !provPassword) {
      setProvError("Please provide both email and temporary password.");
      return;
    }

    if (provPassword.length < 8) {
      setProvError("Password must be at least 8 characters.");
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await fetch("/api/auth/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: provEmail,
          password: provPassword,
          role: "client",
          clientName: provName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision user.");
      }

      setProvSpruceMsg(data.spruceMessage);
      setProvEmail("");
      setProvPassword("");
      setProvName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to provision user.";
      setProvError(msg);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);
    setChangePassSuccess(null);

    if (newPassword.length < 8) {
      setChangePassError("New password must be at least 8 characters in length.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePassError("New passwords do not match.");
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setChangePassSuccess("Password updated successfully.");
      setCurrPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      setChangePassError(
        err instanceof Error ? err.message : "Failed to update password."
      );
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setMemberEmail(null);
  };

  // ---------------------------------------------------------------------------
  // 1. GATEWAY: Standardized Email + Password Only (No WebAuthn, No Public Signup)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] flex flex-col justify-center items-center px-6 relative overflow-hidden font-body selection:bg-champagne-gold selection:text-text-on-gold">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full bg-[#121826]/95 border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl relative z-10 space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#0B0F19] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)] text-2xl">
            ✦
          </div>

          <div className="text-center space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              Cognitive Edge Clinical Portal
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-white font-normal">
              Member Enclave Access
            </h1>
            <p className="font-body text-xs text-slate-400">
              Access service menus, retainer billing, and Cal.com scheduling.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Standardized Email & Password Authentication Form */}
          <form onSubmit={handlePasswordAuth} className="space-y-4 pt-2">
            <div className="space-y-1 text-left">
              <label className="font-mono text-[11px] text-slate-300 block">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[11px] text-slate-300 block">
                  Password
                </label>
                <span className="font-mono text-[10px] text-slate-500">Min 6 characters</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-4 pr-11 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none transition-colors ${
                    showPassword ? "" : "tracking-widest"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="toggle-password-visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </form>

          {/* Informational Notice: Staff Provisioned Only */}
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-center space-y-1.5">
            <p className="font-mono text-[11px] text-slate-300 leading-relaxed">
              Access Restricted: Client portal credentials are created and provisioned exclusively by Cognitive Edge Clinic staff. Contact your coordinator to initiate access.
            </p>
          </div>

          {/* Spruce Health Emergency / Help Channel on Login Screen */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
              Need Password Assistance or Initial Credentials?
            </span>
            <div className="flex items-center justify-center gap-3 font-mono text-xs">
              <a
                href="sms:+17433330880?&body=Request%20credentials%20for%20member%20portal"
                className="text-[#D4AF37] hover:text-[#E6C65C] underline underline-offset-4 flex items-center gap-1"
              >
                <span>Spruce SMS (+1 743-333-0880)</span>
              </a>
              <span className="text-slate-600">&bull;</span>
              <a
                href="https://spruce.care/yourpractice"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline underline-offset-4"
              >
                Spruce App
              </a>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-center">
            Protected Hub &bull; Zero-ePHI Architecture &bull; No patient medical records on web server
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. UNLOCKED MEMBER PORTAL: Exact Sequential Section Hierarchy
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] flex flex-col justify-between p-6 lg:p-12 relative font-body selection:bg-champagne-gold selection:text-text-on-gold">
      {/* Header Bar */}
      <header className="space-y-4 border-b border-[#D4AF37]/20 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="group">
              <span className="font-display text-xl tracking-wider text-[#D4AF37] font-semibold group-hover:text-[#E6C65C] transition-colors">
                COGNITIVE EDGE CLINIC
              </span>
            </Link>
            <span className="text-xs font-mono text-slate-500">/</span>
            <span className="font-mono text-xs text-slate-300 uppercase tracking-widest">
              Member Portal &amp; Clinical Suite
            </span>
          </div>

          <div className="flex items-center gap-3">
            {memberRole === "admin" && (
              <Link
                href="/vault/admin"
                className="px-3 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0F19] font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <span>✦ Staff Desk</span>
              </Link>
            )}
            <div className="flex items-center gap-2 bg-[#121826] border border-[#D4AF37]/20 px-3.5 py-1.5 rounded-full text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                {memberEmail || "Active Member Session"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="font-mono text-[11px] text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid: Sequential Hierarchy */}
      <main className="max-w-6xl w-full mx-auto my-10 space-y-8">
        {/* =====================================================================
            ADMINISTRATIVE CLIENT PROVISIONING (Visible ONLY when user.role === 'admin')
           ===================================================================== */}
        {memberRole === "admin" && (
          <section className="bg-[#121826] border-2 border-[#D4AF37]/50 rounded-xl p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                  <span>✦</span>
                  <span>Administrative Client Provisioning</span>
                </div>
                <h2 className="font-display text-2xl text-white">
                  Staff Credential Dispatch Desk
                </h2>
                <p className="font-body text-xs text-slate-400">
                  Provision new patient credentials to Netlify Blobs with one-click Spruce message formatting.
                </p>
              </div>
              <Link
                href="/vault/admin"
                className="self-start sm:self-auto font-mono text-xs text-[#D4AF37] hover:underline"
              >
                Open Full Desk →
              </Link>
            </div>

            {provError && (
              <div className="p-3 rounded bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs">
                {provError}
              </div>
            )}

            <form onSubmit={handleProvisionClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 text-left">
                  <label className="font-mono text-[11px] text-slate-300 block">
                    Client Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[11px] text-slate-300 block">
                      Temporary Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setProvPassword(generateSecurePassword())}
                      className="text-[10px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Generate ⚅
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={provPassword}
                    onChange={(e) => setProvPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="font-mono text-[11px] text-slate-300 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProvisioning}
                className="py-3 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
              >
                {isProvisioning ? "Provisioning..." : "Provision Client Account"}
              </button>
            </form>

            {provSpruceMsg && (
              <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#D4AF37]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-semibold">
                    ✓ Account Provisioned (Netlify Blobs)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(provSpruceMsg);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className="px-3 py-1 rounded bg-[#121826] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs hover:bg-[#1a2336] cursor-pointer"
                  >
                    {copied ? "✓ Copied!" : "Copy Spruce Message"}
                  </button>
                </div>
                <div className="p-3 rounded bg-[#121826] font-mono text-xs text-slate-300 select-all leading-relaxed">
                  {provSpruceMsg}
                </div>
              </div>
            )}
          </section>
        )}

        {/* =====================================================================
            TOP ROW: Communication Hub & Concierge Engine
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Communication Hub: Spruce Health Channels (lg:col-span-6) */}
          <section className="lg:col-span-6 bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 flex flex-col justify-between shadow-2xl space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold px-2.5 py-1 rounded bg-[#0B0F19] border border-[#D4AF37]/30">
                  Communication Hub
                </span>
                <span className="font-mono text-[10px] text-emerald-400">HIPAA Encrypted</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl text-white">Spruce Health Channels</h2>
                <p className="font-body text-xs text-slate-400 leading-relaxed">
                  Connect directly with Dr. David Andreas Runheim and clinical staff without public web forms.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="sms:+17433330880?&body=Care%20coordination%20inquiry"
                  className="w-full p-4 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37] flex items-center justify-between transition-all group"
                >
                  <div className="text-left">
                    <span className="font-mono text-xs text-[#D4AF37] block font-semibold">
                      Care Desk Direct SMS
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      +1 (743) 333-0880
                    </span>
                  </div>
                  <span className="text-[#D4AF37] text-xs font-mono group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </a>

                <a
                  href="https://spruce.care/yourpractice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37] flex items-center justify-between transition-all group"
                >
                  <div className="text-left">
                    <span className="font-mono text-xs text-[#D4AF37] block font-semibold">
                      Spruce Patient Web App
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Asynchronous messaging &amp; care coordination
                    </span>
                  </div>
                  <span className="text-[#D4AF37] text-xs font-mono group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Powered by Spruce Health BAA &bull; Zero messaging records stored locally
            </div>
          </section>

          {/* Concierge Engine: Scheduling & Retainer Management (lg:col-span-6) */}
          <section className="lg:col-span-6 bg-[#121826] border border-[#D4AF37]/30 rounded-xl p-8 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Concierge Engine
                </span>
                <span className="font-mono text-[10px] text-slate-400">PCI-DSS Level 1</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl text-white">
                  Scheduling &amp; Retainer Management
                </h2>
                <p className="font-body text-xs text-slate-400 leading-relaxed">
                  Book clinical reviews and manage itemized Superbills with ICD-10 diagnostic codes and retainer subscriptions securely.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
                >
                  <span>Book via Cal.com Scheduling Desk</span>
                  <span>&rarr;</span>
                </button>

                <a
                  href="https://billing.stripe.com/p/session/test_portal_session_cognitive_edge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-lg bg-[#0B0F19] hover:bg-slate-900 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>Stripe Customer &amp; Invoicing Portal</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Appointments sync directly to our clinical master calendar with zero duplicate intake questionnaires.
            </div>
          </section>
        </div>

        {/* =====================================================================
            FOLLOWING ROW: Clinical Services & Protocols (Full-Width)
           ===================================================================== */}
        <section className="bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Hybrid Insurance & Fee Model Statement Banner */}
          <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#D4AF37]/40 space-y-2 shadow-inner">
            <div className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] font-semibold flex items-center gap-2">
              <span>✦</span>
              <span>Billing &amp; Insurance Notice &bull; Billing &amp; Coverage Transparency</span>
            </div>
            <p className="font-body text-xs sm:text-sm text-slate-200 leading-relaxed">
              We utilize a hybrid payment model. Clients may choose to utilize their commercial health insurance for physician clinic appointments, diagnostic evaluations, and eligible laboratory assessments, alongside private-tier wellness and restorative protocols.
            </p>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>Clinical Services &amp; Protocols</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-white">
                Comprehensive Clinical Modality Catalog
              </h2>
            </div>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider hidden sm:block">
              Physician Directed
            </span>
          </div>

          {/* Comprehensive In-Portal Service Menu Expansion (All 10 Modalities) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {inPortalServices.map((service, index) => (
              <div
                key={index}
                className="p-5 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37]/40 transition-colors space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
                    <span>{service.category}</span>
                    <span className="text-slate-500">0{index + 1}</span>
                  </div>
                  <h3 className="font-display text-base text-white leading-snug">
                    {service.name}
                  </h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    {service.detail}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 font-mono text-[10.5px] text-vitality-sage">
                  {service.coverage}
                </div>
              </div>
            ))}
          </div>

          {/* eClinicalWorks External Gateway Bridge */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-body text-xs text-slate-400">
              Certified medical encounter notes, pathology panels, and formal medical charts reside in our certified records enclave.
            </p>
            <a
              href="https://mycwXX.eclinicalworks.com/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 py-3 px-5 rounded-lg bg-[#0B0F19] hover:bg-slate-900 border border-slate-700 hover:border-[#D4AF37] text-slate-200 font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>Launch eClinicalWorks Patient Portal</span>
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>

        {/* =====================================================================
            FOLLOWING ROW: Security & Password Settings
           ===================================================================== */}
        <section className="bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>Security Enclave</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-white">
                Update Portal Password
              </h2>
            </div>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider hidden sm:block">
              Zero-ePHI Standard
            </span>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
            {changePassError && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs">
                {changePassError}
              </div>
            )}
            {changePassSuccess && (
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono text-xs">
                {changePassSuccess}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
                Current Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCurrPass ? "text" : "password"}
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 pr-12 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrPass((prev) => !prev)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  aria-label={showCurrPass ? "Hide current password" : "Show current password"}
                >
                  {showCurrPass ? (
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

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
                  New Password
                </label>
                <span className="font-mono text-[10px] text-slate-500">Min 8 characters</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 pr-12 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((prev) => !prev)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-[#D4AF37] focus:outline-none transition-colors"
                  aria-label={showNewPass ? "Hide new password" : "Show new password"}
                >
                  {showNewPass ? (
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

            <div className="space-y-1.5 text-left">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
                Confirm New Password
              </label>
              <input
                type={showNewPass ? "text" : "password"}
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-3 font-mono tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="py-3 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            >
              {isChangingPass ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center font-mono text-[10px] text-slate-500 pt-6 border-t border-slate-800">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ZERO-ePHI QUARANTINE ARCHITECTURE &bull; WINSTON-SALEM, NC
      </footer>

      {/* On-Domain Cal.com Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center font-mono text-xs text-[#D4AF37]">
          INITIALIZING CONCIERGE ENCLAVE...
        </div>
      }
    >
      <VaultInner />
    </Suspense>
  );
}
