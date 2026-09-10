"use client";

import React, { useState, useId } from "react";
import { encryptVaultPayload } from "@/lib/crypto/export/vaultCrypto";

export interface SimulationParametersPayload {
  deliveryMode: "hcl" | "ttfd";
  doseMg: number;
  omega3Index: number;
  saturationPercentage: number;
  isOmegaGateSatisfied: boolean;
  isStoichiometricSaturationActive: boolean;
  [key: string]: unknown;
}

export interface BiomarkerTrajectorySnapshot {
  id: string;
  name: string;
  baseline: number;
  target: number;
  unit: string;
  status: string;
  weeksToNormalization?: number;
  [key: string]: unknown;
}

export interface SessionPreferencesPayload {
  theme: string;
  contrastMode: string;
  telemetryQuarantined: boolean;
  clientTimezone: string;
  exportedAt: string;
  [key: string]: unknown;
}

export interface EncryptedExportButtonProps {
  simulationParameters?: Partial<SimulationParametersPayload>;
  biomarkerTrajectories?: BiomarkerTrajectorySnapshot[];
  sessionPreferences?: Partial<SessionPreferencesPayload>;
  customPayload?: unknown;
  buttonLabel?: string;
  className?: string;
  onExportSuccess?: (filename: string) => void;
  onExportError?: (error: Error) => void;
}

const DEFAULT_SIMULATION_PARAMETERS: SimulationParametersPayload = {
  deliveryMode: "ttfd",
  doseMg: 300,
  omega3Index: 8.5,
  saturationPercentage: 88,
  isOmegaGateSatisfied: true,
  isStoichiometricSaturationActive: true,
};

const DEFAULT_BIOMARKER_TRAJECTORIES: BiomarkerTrajectorySnapshot[] = [
  {
    id: "holoTC",
    name: "Holotranscobalamin (Active B12)",
    baseline: 42,
    target: 125,
    unit: "pmol/L",
    status: "optimal",
    weeksToNormalization: 6,
  },
  {
    id: "tdp",
    name: "Thiamine Diphosphate (Active B1)",
    baseline: 98,
    target: 195,
    unit: "nmol/L",
    status: "optimal",
    weeksToNormalization: 4,
  },
  {
    id: "homocysteine",
    name: "Total Plasma Homocysteine",
    baseline: 14.8,
    target: 7.2,
    unit: "umol/L",
    status: "optimal",
    weeksToNormalization: 8,
  },
  {
    id: "omega3Index",
    name: "Erythrocyte Omega-3 Index",
    baseline: 5.2,
    target: 9.4,
    unit: "%",
    status: "optimal",
    weeksToNormalization: 12,
  },
  {
    id: "rbcMagnesium",
    name: "RBC Magnesium",
    baseline: 4.8,
    target: 6.4,
    unit: "mg/dL",
    status: "optimal",
    weeksToNormalization: 6,
  },
];

/**
 * EncryptedExportButton
 * 
 * Luxury Champagne Gold export button and passphrase dialog.
 * Packages simulation parameters, biomarker trajectories, and session preferences
 * into a zero-knowledge in-browser AES-GCM-256 encrypted .edgevault file.
 */
export function EncryptedExportButton({
  simulationParameters,
  biomarkerTrajectories,
  sessionPreferences,
  customPayload,
  buttonLabel = "Export Encrypted Vault Dossier (.edgevault)",
  className = "",
  onExportSuccess,
  onExportError,
}: EncryptedExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFilename, setSuccessFilename] = useState<string | null>(null);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);

  const titleId = useId();
  const descId = useId();
  const passId = useId();
  const confirmPassId = useId();

  // Reset dialog state when opening/closing
  const handleOpen = () => {
    setPassphrase("");
    setConfirmPassphrase("");
    setErrorMessage(null);
    setSuccessFilename(null);
    setShowPayloadPreview(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isEncrypting) return;
    setPassphrase("");
    setConfirmPassphrase("");
    setErrorMessage(null);
    setSuccessFilename(null);
    setIsOpen(false);
  };

  // Evaluate passphrase strength
  const getPassphraseStrength = (pass: string): { label: string; score: number; color: string } => {
    if (!pass) return { label: "Empty", score: 0, color: "bg-neutral-800" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 14) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: "Fragile (Too Short)", score: 20, color: "bg-red-500" };
    if (score <= 2) return { label: "Moderate", score: 45, color: "bg-amber-500" };
    if (score <= 3) return { label: "Strong", score: 70, color: "bg-yellow-400" };
    if (score <= 4) return { label: "Very Strong", score: 85, color: "bg-emerald-400" };
    return { label: "Cryptographic Grade", score: 100, color: "bg-[#D4AF37]" };
  };

  const strength = getPassphraseStrength(passphrase);

  // Formulate the complete dossier payload
  const buildDossierPackage = () => {
    const finalSimParams: SimulationParametersPayload = {
      ...DEFAULT_SIMULATION_PARAMETERS,
      ...simulationParameters,
    };

    const finalTrajectories = biomarkerTrajectories || DEFAULT_BIOMARKER_TRAJECTORIES;

    const finalSessionPrefs: SessionPreferencesPayload = {
      theme: "editorial-dark",
      contrastMode: "high-contrast-optimal",
      telemetryQuarantined: true,
      clientTimezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "UTC",
      exportedAt: new Date().toISOString(),
      ...sessionPreferences,
    };

    return {
      vaultVersion: "1.0.0",
      securityHeader: {
        cipher: "AES-GCM-256",
        keyDerivation: "PBKDF2-SHA256-100K",
        zeroKnowledgeAttestation: "VERIFIED_CLIENT_SIDE_ONLY",
        zeroEphiQuarantine: true,
      },
      exportedAt: new Date().toISOString(),
      simulationParameters: finalSimParams,
      biomarkerTrajectories: finalTrajectories,
      sessionPreferences: finalSessionPrefs,
      customPayload: customPayload ?? null,
    };
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passphrase || passphrase.length < 8) {
      setErrorMessage("Passphrase must be at least 8 characters long for adequate entropy.");
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setErrorMessage("Passphrase confirmation does not match.");
      return;
    }

    setIsEncrypting(true);

    try {
      const packageData = buildDossierPackage();
      
      // Perform client-side zero-knowledge encryption
      const armoredVaultString = await encryptVaultPayload(packageData, passphrase);

      // Create timestamped filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `clinical-vault-dossier-${timestamp}.edgevault`;

      // Trigger client-side file download via Blob and URL.createObjectURL
      const blob = new Blob([armoredVaultString], {
        type: "application/x-edgevault;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);

      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = objectUrl;
      downloadAnchor.download = filename;
      downloadAnchor.style.display = "none";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      // Cleanup DOM and object URL
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(objectUrl);

      // Security: Clear passphrases from React state immediately
      setPassphrase("");
      setConfirmPassphrase("");
      setSuccessFilename(filename);

      if (onExportSuccess) {
        onExportSuccess(filename);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrorMessage(`Encryption failed: ${error.message}`);
      if (onExportError) {
        onExportError(error);
      }
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <>
      {/* Luxury Champagne Gold Export Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-surface-midnight hover:bg-canvas-obsidian border border-[#D4AF37]/60 hover:border-[#D4AF37] text-[#D4AF37] hover:text-[#F3E5AB] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner hover:shadow-[0_0_22px_rgba(212,175,55,0.35)] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-black ${className}`}
      >
        <svg
          className="w-4 h-4 text-[#D4AF37] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>{buttonLabel}</span>
      </button>

      {/* Modal Passphrase Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === "Escape") handleClose();
          }}
        >
          <div className="relative w-full max-w-lg bg-[#0C101A] border border-[#D4AF37]/50 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.18)] p-6 sm:p-8 space-y-6 text-neutral-200">
            {/* Top decorative Champagne Gold border glow */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            {/* Dialog Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span>Zero-Knowledge &bull; Client-Side Vault</span>
                </div>
                <h2 id={titleId} className="text-xl sm:text-2xl font-serif text-white font-normal">
                  Encrypted Dossier Packaging
                </h2>
                <p id={descId} className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Generate an in-browser AES-GCM-256 encrypted <code className="text-[#D4AF37]">.edgevault</code> dossier.
                  PBKDF2 key derivation (100k iterations) and cryptographic envelope packaging occur 100% on your device.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isEncrypting}
                aria-label="Close dialog"
                className="text-neutral-500 hover:text-neutral-300 p-1.5 rounded-lg border border-transparent hover:border-neutral-700 transition-colors focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zero-Knowledge Security Callout */}
            <div className="p-3.5 rounded-xl bg-[#121826]/80 border border-[#D4AF37]/20 font-mono text-[11px] text-neutral-300 space-y-1">
              <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Zero Server Persistence Guarantee</span>
              </div>
              <p className="text-neutral-400 font-sans text-xs leading-normal">
                Neither your passphrase nor unencrypted data will ever leave your browser. Without this passphrase,
                the encrypted file cannot be decrypted by anyone, including clinic personnel.
              </p>
            </div>

            {/* Success State */}
            {successFilename ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 font-mono text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dossier Encrypted &amp; Downloaded</span>
                </div>
                <p className="text-neutral-300 font-sans text-xs">
                  Your encrypted file <span className="font-mono text-[#D4AF37]">{successFilename}</span> has been saved to your downloads folder.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Passphrase Form */
              <form onSubmit={handleExport} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono">
                    {errorMessage}
                  </div>
                )}

                {/* Master Passphrase Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor={passId} className="block font-mono text-xs text-neutral-300">
                      Master Encryption Passphrase <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-mono text-[#D4AF37] hover:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id={passId}
                    type={showPassword ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    disabled={isEncrypting}
                    placeholder="Enter at least 8 secure characters..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-neutral-700 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white text-sm placeholder:text-neutral-600 font-mono outline-none transition-all"
                  />

                  {/* Passphrase Strength Bar */}
                  {passphrase.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                        <span>Entropy: {strength.label}</span>
                        <span>{passphrase.length} characters</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Passphrase Input */}
                <div className="space-y-1.5">
                  <label htmlFor={confirmPassId} className="block font-mono text-xs text-neutral-300">
                    Confirm Master Passphrase <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={confirmPassId}
                    type={showPassword ? "text" : "password"}
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    disabled={isEncrypting}
                    placeholder="Re-type passphrase to confirm..."
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-black/60 border text-white text-sm placeholder:text-neutral-600 font-mono outline-none transition-all ${
                      confirmPassphrase && confirmPassphrase !== passphrase
                        ? "border-red-500/70 focus:border-red-400"
                        : "border-neutral-700 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    }`}
                  />
                  {confirmPassphrase && confirmPassphrase !== passphrase && (
                    <p className="text-[11px] font-mono text-red-400">Passphrases do not match.</p>
                  )}
                </div>

                {/* Dossier Content Summary Dropdown */}
                <div className="pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowPayloadPreview(!showPayloadPreview)}
                    className="flex items-center justify-between w-full text-xs font-mono text-neutral-400 hover:text-[#D4AF37] transition-colors py-1"
                  >
                    <span>Inspect Payload Manifest (3 modules)</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showPayloadPreview ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showPayloadPreview && (
                    <div className="mt-2 p-3 rounded-lg bg-black/50 border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1.5 max-h-36 overflow-y-auto">
                      <div className="text-neutral-300 font-semibold">&bull; Simulation Parameters:</div>
                      <div className="pl-3 text-neutral-500">
                        Mode: {simulationParameters?.deliveryMode ?? DEFAULT_SIMULATION_PARAMETERS.deliveryMode} | Dose: {simulationParameters?.doseMg ?? DEFAULT_SIMULATION_PARAMETERS.doseMg}mg | Saturation: {simulationParameters?.saturationPercentage ?? DEFAULT_SIMULATION_PARAMETERS.saturationPercentage}%
                      </div>
                      <div className="text-neutral-300 font-semibold">&bull; Biomarker Trajectories:</div>
                      <div className="pl-3 text-neutral-500">
                        {(biomarkerTrajectories || DEFAULT_BIOMARKER_TRAJECTORIES).length} trajectory markers (HoloTC, TDP, Homocysteine, Ω-3, RBC Mg)
                      </div>
                      <div className="text-neutral-300 font-semibold">&bull; Session Preferences:</div>
                      <div className="pl-3 text-neutral-500">
                        Theme, contrast tokens, zero-knowledge verification timestamp
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isEncrypting}
                    className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 font-mono text-xs transition-colors focus:outline-none"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isEncrypting ||
                      passphrase.length < 8 ||
                      passphrase !== confirmPassphrase
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:from-[#E5C158] hover:to-[#B8860B] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {isEncrypting ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Encrypting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Encrypt &amp; Download</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default EncryptedExportButton;
