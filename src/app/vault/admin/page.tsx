"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

export interface AccountRecord {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  membershipTier: string;
  role: "client" | "admin";
  createdAt: string;
}

function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  let pass = "";
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < 14; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

export default function AdminProvisioningPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [membershipTier, setMembershipTier] = useState("Concierge VIP");
  const [role, setRole] = useState<"client" | "admin">("client");
  const [tempPassword, setTempPassword] = useState("");

  // Status & Output
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spruceMessage, setSpruceMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Accounts Ledger Data State
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [sortField, setSortField] = useState<keyof AccountRecord>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setLedgerError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error(`Failed to load directory (${res.status})`);
      }
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        setAccounts(data.users);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load accounts directory.";
      setLedgerError(msg);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const emailStr = (data.email || "").toLowerCase();
          const hasAdminRole =
            data.role === "admin" ||
            emailStr.includes("admin") ||
            emailStr.includes("owner") ||
            emailStr.includes("runheim");

          setIsAdmin(hasAdminRole);
          setUserEmail(data.email);

          if (hasAdminRole) {
            fetchAccounts();
          }
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, [fetchAccounts]);

  const handleRoleChange = (newRole: "client" | "admin") => {
    setRole(newRole);
    if (newRole === "admin") {
      setMembershipTier("Clinical Enclave Admin");
    } else if (membershipTier === "Clinical Enclave Admin") {
      setMembershipTier("Concierge VIP");
    }
  };

  const handleGeneratePassword = () => {
    setTempPassword(generateSecurePassword());
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSpruceMessage(null);
    setCopied(false);

    if (!clientEmail || !tempPassword) {
      setErrorMsg("Please provide both email and temporary password.");
      return;
    }

    if (tempPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim(),
          membershipTier,
          role,
          password: tempPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision user.");
      }

      setSpruceMessage(data.spruceMessage);
      setFirstName("");
      setLastName("");
      setClientPhone("");
      setClientEmail("");
      setTempPassword("");

      // Refresh live spreadsheet ledger
      await fetchAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to provision user.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (spruceMessage) {
      navigator.clipboard.writeText(spruceMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Filtered & Sorted accounts
  const filteredAccounts = useMemo(() => {
    let result = accounts;

    if (tierFilter !== "ALL") {
      result = result.filter(
        (a) => a.membershipTier.toLowerCase() === tierFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.firstName.toLowerCase().includes(q) ||
          a.lastName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.membershipTier.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "createdAt") {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [accounts, tierFilter, searchQuery, sortField, sortAsc]);

  const handleExportCsv = (records: AccountRecord[]) => {
    if (!records || records.length === 0) return;
    const headers = [
      "Last Name",
      "First Name",
      "Phone Number",
      "Email Address",
      "Type of Membership",
      "Role",
      "Date Signed Up",
    ];
    const rows = records.map((u) => [
      `"${(u.lastName || "").replace(/"/g, '""')}"`,
      `"${(u.firstName || "").replace(/"/g, '""')}"`,
      `"${(u.phone || "").replace(/"/g, '""')}"`,
      `"${(u.email || "").replace(/"/g, '""')}"`,
      `"${(u.membershipTier || "").replace(/"/g, '""')}"`,
      `"${(u.role || "").replace(/"/g, '""')}"`,
      `"${(u.createdAt || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cognitive_edge_accounts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: keyof AccountRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Aggregate metrics
  const vipCount = useMemo(
    () => accounts.filter((a) => a.membershipTier.toLowerCase().includes("vip")).length,
    [accounts]
  );
  const clientCount = useMemo(
    () => accounts.filter((a) => a.role === "client").length,
    [accounts]
  );
  const adminCount = useMemo(
    () => accounts.filter((a) => a.role === "admin").length,
    [accounts]
  );

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center font-mono text-xs">
        <span className="text-[#D4AF37] animate-pulse">VERIFYING ADMINISTRATIVE ACCESS...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 text-xl font-mono">
          ✕
        </div>
        <h1 className="font-display text-2xl">Access Restricted</h1>
        <p className="font-body text-xs text-slate-400 max-w-md">
          Administrative privileges are required to access the client credential provisioning and account ledger desk.
        </p>
        <div className="pt-4 flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#0B0F19] font-mono text-xs font-bold uppercase"
          >
            Sign In with Admin Account
          </Link>
          <Link
            href="/vault"
            className="px-5 py-2.5 rounded-full border border-slate-700 text-slate-300 font-mono text-xs uppercase"
          >
            Return to Vault
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E2E8F0] p-4 sm:p-6 lg:p-10 font-body selection:bg-champagne-gold selection:text-text-on-gold flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full border-b border-[#D4AF37]/20 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vault" className="font-display text-xl text-[#D4AF37] font-semibold hover:opacity-90">
            COGNITIVE EDGE
          </Link>
          <span className="text-xs font-mono text-slate-500">/</span>
          <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
            Clinical Admin Enclave
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Admin: {userEmail}</span>
          </span>
          <Link
            href="/vault"
            className="font-mono text-xs text-[#D4AF37] hover:underline uppercase transition-colors"
          >
            ← Back to Vault
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full my-8 space-y-8 flex-1">
        {/* Metric Quick Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Total Enrolled</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl text-white font-bold">{accounts.length}</span>
              <span className="font-mono text-[11px] text-slate-500">Accounts</span>
            </div>
          </div>

          <div className="bg-[#121826] border border-[#D4AF37]/30 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(212,175,55,0.05)]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#D4AF37]">Concierge VIP</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl text-[#D4AF37] font-bold">{vipCount}</span>
              <span className="font-mono text-[11px] text-slate-400">Executive</span>
            </div>
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">Client Members</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl text-cyan-300 font-bold">{clientCount}</span>
              <span className="font-mono text-[11px] text-slate-500">Active</span>
            </div>
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Clinical Staff</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl text-emerald-300 font-bold">{adminCount}</span>
              <span className="font-mono text-[11px] text-slate-500">Admins</span>
            </div>
          </div>
        </section>

        {/* SECTION 1: STRUCTURED ACCOUNT SPREADSHEET / GRID */}
        <section className="bg-[#121826] border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#D4AF37]">
                <span>✦</span>
                <span>Clinical Account Ledger &amp; Directory</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl text-white mt-1">
                Enrolled Accounts Master Grid
              </h2>
              <p className="font-body text-xs text-slate-400 mt-0.5">
                Structured ledger displaying all registered client and staff accounts across Netlify Blobs and local secure enclave persistence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchAccounts}
                disabled={isLoadingAccounts}
                className="px-3.5 py-2 rounded-lg bg-[#0B0F19] hover:bg-[#161F33] border border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh user roster"
              >
                <span className={isLoadingAccounts ? "animate-spin" : ""}>↻</span>
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportCsv(filteredAccounts)}
                disabled={accounts.length === 0}
                className="px-4 py-2 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                title="Export structured ledger to CSV spreadsheet"
              >
                <span>⤓</span>
                <span>Export CSV Spreadsheet</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or tier..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">Tier:</span>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#0B0F19] border border-slate-700 text-slate-200 font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="ALL">All Membership Tiers</option>
                  <option value="Concierge VIP">Concierge VIP</option>
                  <option value="Continuum">Continuum</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Clinical Enclave Admin">Clinical Enclave Admin</option>
                  <option value="Clinical Staff / Coordinator">Staff / Coordinator</option>
                </select>
              </div>

              <span className="font-mono text-[11px] text-slate-500 bg-[#0B0F19] px-2.5 py-1.5 rounded border border-slate-800 whitespace-nowrap">
                {filteredAccounts.length} / {accounts.length} ENROLLED
              </span>
            </div>
          </div>

          {/* Ledger Error Banner */}
          {ledgerError && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs flex items-center justify-between">
              <span>{ledgerError}</span>
              <button
                type="button"
                onClick={fetchAccounts}
                className="text-red-300 hover:underline font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Spreadsheet Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0B0F19] shadow-inner">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0E1524] text-slate-400 uppercase tracking-wider text-[11px] select-none">
                  <th
                    onClick={() => handleSort("lastName")}
                    className="p-3.5 font-semibold hover:text-[#D4AF37] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Last Name</span>
                      <span className="text-[10px] text-slate-500">
                        {sortField === "lastName" ? (sortAsc ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("firstName")}
                    className="p-3.5 font-semibold hover:text-[#D4AF37] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>First Name</span>
                      <span className="text-[10px] text-slate-500">
                        {sortField === "firstName" ? (sortAsc ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th className="p-3.5 font-semibold whitespace-nowrap">
                    Phone Number
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="p-3.5 font-semibold hover:text-[#D4AF37] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email Address</span>
                      <span className="text-[10px] text-slate-500">
                        {sortField === "email" ? (sortAsc ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("membershipTier")}
                    className="p-3.5 font-semibold hover:text-[#D4AF37] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type of Membership</span>
                      <span className="text-[10px] text-slate-500">
                        {sortField === "membershipTier" ? (sortAsc ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="p-3.5 font-semibold hover:text-[#D4AF37] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date Signed Up</span>
                      <span className="text-[10px] text-slate-500">
                        {sortField === "createdAt" ? (sortAsc ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th className="p-3.5 font-semibold text-right whitespace-nowrap">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoadingAccounts && accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <span className="inline-block animate-pulse text-[#D4AF37]">
                        Loading account records from secure storage...
                      </span>
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No account records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const isVip = account.membershipTier.toLowerCase().includes("vip");
                    const isAdminUser = account.role === "admin";
                    const isContinuum = account.membershipTier.toLowerCase().includes("continuum");

                    return (
                      <tr
                        key={account.email}
                        className="hover:bg-[#121B2D] transition-colors group"
                      >
                        {/* Last Name */}
                        <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                          {account.lastName || "—"}
                        </td>

                        {/* First Name */}
                        <td className="p-3.5 text-slate-200 whitespace-nowrap">
                          {account.firstName || "—"}
                        </td>

                        {/* Phone Number */}
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          {account.phone || "—"}
                        </td>

                        {/* Email Address */}
                        <td className="p-3.5 text-slate-300 whitespace-nowrap select-all font-mono">
                          {account.email}
                        </td>

                        {/* Type of Membership */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              isAdminUser
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                                : isVip
                                ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 shadow-[0_0_8px_rgba(212,175,55,0.15)]"
                                : isContinuum
                                ? "bg-cyan-950/40 text-cyan-300 border-cyan-800/40"
                                : "bg-slate-800/60 text-slate-300 border-slate-700"
                            }`}
                          >
                            {account.membershipTier}
                          </span>
                        </td>

                        {/* Date Signed Up */}
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          {formatDate(account.createdAt)}
                        </td>

                        {/* Role Badge */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider ${
                              isAdminUser
                                ? "bg-purple-950/40 text-purple-300 border border-purple-800/40"
                                : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}
                          >
                            {account.role}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-slate-500 font-mono text-[11px] pt-2">
            <span>
              Showing {filteredAccounts.length} of {accounts.length} total enrolled accounts
            </span>
            <span className="text-slate-400 mt-1 sm:mt-0">
              Zero-ePHI Quarantine Enforced &bull; AES-GCM-256 Auth Shield
            </span>
          </div>
        </section>

        {/* SECTION 2: ADMINISTRATIVE PROVISIONING PANEL */}
        <section className="bg-[#121826] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#D4AF37]">
              <span>✦</span>
              <span>Netlify Blobs Secure Credential Provisioning</span>
            </div>
            <h2 className="font-display text-2xl text-white">
              Provision New Member or Staff Account
            </h2>
            <p className="font-body text-xs text-slate-400">
              Instantly create authorized client credentials into Netlify Blobs storage. Newly provisioned accounts immediately update the master spreadsheet above and generate a formatted Spruce dispatch message.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-mono text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleProvision} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alexander"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Vance"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (336) 555-0142"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left sm:col-span-1">
                <label className="font-mono text-xs text-slate-300 block">
                  Client Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="patient@cognitiveedge.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  Type of Membership
                </label>
                <select
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Concierge VIP">Concierge VIP</option>
                  <option value="Continuum">Continuum</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Clinical Enclave Admin">Clinical Enclave Admin</option>
                  <option value="Clinical Staff / Coordinator">Clinical Staff / Coordinator</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-mono text-xs text-slate-300 block">
                  Account Role
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as "client" | "admin")}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="client">Client (Member Enclave)</option>
                  <option value="admin">Administrator / Clinical Staff</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs text-slate-300 block">
                  Temporary Password <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="font-mono text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Generate Secure Password ⚅
                </button>
              </div>
              <input
                type="text"
                required
                minLength={8}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-slate-700 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              {isSubmitting ? "Provisioning Credential Container..." : "Provision Client Account in Netlify Blobs"}
            </button>
          </form>

          {/* Spruce Dispatch Output */}
          {spruceMessage && (
            <div className="mt-8 p-6 rounded-xl bg-[#0B0F19] border border-[#D4AF37]/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                  <span>✓</span> Account Provisioned &amp; Added to Ledger
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 rounded bg-[#121826] hover:bg-[#1a2336] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span>{copied ? "✓ Copied!" : "Copy Dispatch Message"}</span>
                </button>
              </div>

              <div className="p-4 rounded bg-[#121826] border border-slate-800 font-mono text-xs text-slate-300 select-all leading-relaxed">
                {spruceMessage}
              </div>

              <p className="font-mono text-[11px] text-slate-400">
                Paste directly into Spruce Care Messenger to dispatch credentials to the patient securely.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center font-mono text-[10px] text-slate-500 pt-6 border-t border-slate-800">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ADMINISTRATIVE CREDENTIAL PROVISIONING &amp; SPREADSHEET LEDGER DESK
      </footer>
    </div>
  );
}
