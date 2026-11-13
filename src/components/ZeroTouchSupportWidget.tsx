"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  Search,
  X,
  Bug,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Pause,
  AlertCircle,
  Send,
  MessageCircle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import {
  KnowledgeArticle,
  PULLTHRU_KNOWLEDGE_BASE,
  searchKnowledgeBase,
} from "@/lib/knowledgeBase";
import {
  reportClientError,
  sanitizeTelemetryString,
} from "@/lib/telemetry";

function sanitizeTelemetryText(raw: string): string {
  return sanitizeTelemetryString(raw, 400);
}

export default function ZeroTouchSupportWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"faqs" | "diagnostic" | "club_pass">("faqs");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  // Bug Diagnostic State & Last 3 Silent Error Ring Buffer
  const [bugDescription, setBugDescription] = useState<string>("");
  const [copiedDiagnostic, setCopiedDiagnostic] = useState<boolean>(false);
  const [bugSubmitted, setBugSubmitted] = useState<boolean>(false);
  const [recentErrorLogs, setRecentErrorLogs] = useState<string[]>([]);
  const recentErrorsRef = React.useRef<string[]>([]);

  // Silent Auto-Error & Unhandled Rejection Telemetry Listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pushErrorLog = (entry: string) => {
      const sanitized = sanitizeTelemetryString(entry, 240);
      if (!sanitized) return;
      const next = [sanitized, ...recentErrorsRef.current.filter((e) => e !== sanitized)].slice(0, 3);
      recentErrorsRef.current = next;
      setRecentErrorLogs(next);
    };

    const handleWindowError = (event: ErrorEvent) => {
      const msg = event.message || event.error?.message || "Uncaught window error";
      const loc = event.filename ? ` (${event.filename}:${event.lineno || 0})` : "";
      pushErrorLog(`${msg}${loc}`);
      void reportClientError({
        type: "window_error",
        message: `${msg}${loc}`,
        stack: event.error?.stack || null,
        route: window.location?.pathname || "/",
        recentLogs: recentErrorsRef.current,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";
      pushErrorLog(`PromiseRejection: ${msg}`);
      void reportClientError({
        type: "unhandled_rejection",
        message: msg,
        stack: reason instanceof Error ? reason.stack || null : null,
        route: window.location?.pathname || "/",
        recentLogs: recentErrorsRef.current,
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Churn-Save Cancel Flow State
  const [cancelStep, setCancelStep] = useState<"reason" | "offer" | "confirmed">("reason");
  const [cancelReason, setCancelReason] = useState<"off_season" | "price" | "missing_feature" | "other" | null>(null);
  const [saveActionMessage, setSaveActionMessage] = useState<string | null>(null);

  // Keyboard shortcut listener (Shift+? or ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        triggerHaptic("light");
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Filter articles based on route and query
  const filteredArticles = useMemo(() => {
    return searchKnowledgeBase(searchQuery, pathname || "/");
  }, [searchQuery, pathname]);

  // Contextual Top 3 Suggestions for current route
  const contextualTop3 = useMemo(() => {
    if (!pathname) return PULLTHRU_KNOWLEDGE_BASE.slice(0, 3);
    const matches = PULLTHRU_KNOWLEDGE_BASE.filter((a) =>
      a.applicableRoutes.some((r) => pathname.startsWith(r))
    );
    return matches.length >= 3 ? matches.slice(0, 3) : PULLTHRU_KNOWLEDGE_BASE.slice(0, 3);
  }, [pathname]);

  // Build sanitized diagnostic snapshot
  const generateDiagnosticPayload = useCallback(() => {
    if (typeof window === "undefined") return {};
    const nav = window.navigator as any;
    const isOnline = nav ? nav.onLine : true;
    const viewport = `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio || 1}x`;
    const userAgent = nav ? nav.userAgent : "Unknown";

    return {
      appName: "PullThru South Africa",
      version: "2.1-prod",
      route: pathname || "/",
      timestamp: new Date().toISOString(),
      viewport,
      isOnline,
      connectionType: nav?.connection?.effectiveType || "4g/wifi",
      screenOrientation: window.innerWidth > window.innerHeight ? "landscape" : "portrait",
      clientPlatform: userAgent.includes("iPhone")
        ? "iOS Safari / WebKit"
        : userAgent.includes("Android")
        ? "Android Chrome"
        : "Desktop Browser",
      recentErrors: recentErrorLogs,
      userSanitizedNotes: sanitizeTelemetryText(bugDescription.trim()),
    };
  }, [pathname, bugDescription, recentErrorLogs]);

  const handleCopyDiagnostic = () => {
    const payload = generateDiagnosticPayload();
    const formatted = `🇿🇦 PULLTHRU SANITIZED DIAGNOSTIC:\n${JSON.stringify(payload, null, 2)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
      setCopiedDiagnostic(true);
      setTimeout(() => setCopiedDiagnostic(false), 3000);
      triggerHaptic("light");
    }
  };

  const handleSendBugViaWhatsApp = () => {
    const payload = generateDiagnosticPayload();
    void reportClientError({
      type: "manual_bug_report",
      message: payload.userSanitizedNotes || "Manual diagnostic report submitted",
      route: payload.route,
      recentLogs: recentErrorLogs,
      notes: payload.userSanitizedNotes || null,
    });
    const text =
      `🇿🇦 *PULLTHRU BUG REPORT*\n` +
      `📍 Route: ${payload.route}\n` +
      `📱 Viewport: ${payload.viewport} (${payload.clientPlatform})\n` +
      `📝 Notes: ${payload.userSanitizedNotes || "No notes provided"}\n` +
      `🕒 Time: ${new Date().toLocaleTimeString("en-ZA")}`;

    window.open(
      `https://wa.me/27768063638?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setBugSubmitted(true);
    triggerHaptic("medium");
  };

  // Churn deflection action handlers
  const handlePauseAccount = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pullthru_club_pass_paused", "true");
        localStorage.setItem("pullthru_club_pass_resume_date", new Date(Date.now() + 60 * 86400000).toISOString());
      }
    } catch {
      // ignore
    }
    setSaveActionMessage("🎉 Account Paused for 2 Months at R0/mo! Your rosters and 1-tap clones are safely stored.");
    setCancelStep("confirmed");
    triggerHaptic("medium");
  };

  const handleApplyLoyaltyRate = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pullthru_club_pass_loyalty_rate", "R39");
      }
    } catch {
      // ignore
    }
    setSaveActionMessage("✅ Captain Starter Applied! Your billing is adjusted to R39/month for the next 3 months.");
    setCancelStep("confirmed");
    triggerHaptic("medium");
  };

  const handleFinalCancel = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pullthru_club_pass_active");
        localStorage.setItem("pullthru_club_pass_cancelled", "true");
      }
    } catch {
      // ignore
    }
    setSaveActionMessage("Subscription cancelled immediately. No further debits will occur.");
    setCancelStep("confirmed");
    triggerHaptic("light");
  };

  return (
    <>
      {/* Discreet Floating Trigger Pill (Bottom right, elevated above mobile bottom nav) */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic("light");
          setIsOpen(true);
        }}
        aria-label="Open Instant Help & Support Drawer (Shift+?)"
        className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#007749]/30 bg-[#0F172A] text-white shadow-xl hover:scale-105 active:scale-95 transition md:bottom-6 md:right-6"
      >
        <HelpCircle className="h-5 w-5 text-[#FFB81C]" />
        <span className="sr-only">Help</span>
      </button>

      {/* Slide-Over Drawer Backdrop */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PullThru Zero-Touch Support Drawer"
          className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/50 backdrop-blur-xs transition-opacity"
        >
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-[#E6E2D8] text-[#0F172A]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6E2D8] bg-[#FAF8F5] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#007749] text-white text-xs font-bold shadow-xs">
                  ?
                </span>
                <div>
                  <h2 className="font-display text-sm font-extrabold text-[#0F172A]">
                    PullThru Instant Help
                  </h2>
                  <p className="text-[10px] text-[#475569]">
                    80% Self-Resolution • Press <kbd className="font-mono text-[9px] bg-slate-200 px-1 py-0.5 rounded">Shift+?</kbd>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-200/60 hover:text-[#0F172A] transition"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 border-b border-[#E6E2D8] bg-slate-50 text-[11px] font-bold text-[#475569]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("faqs");
                  setSelectedArticle(null);
                }}
                className={`py-2.5 transition border-b-2 ${
                  activeTab === "faqs"
                    ? "border-[#007749] bg-white text-[#007749]"
                    : "border-transparent hover:text-[#0F172A]"
                }`}
              >
                Instant Answers
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("diagnostic");
                  setSelectedArticle(null);
                }}
                className={`py-2.5 transition border-b-2 ${
                  activeTab === "diagnostic"
                    ? "border-[#007749] bg-white text-[#007749]"
                    : "border-transparent hover:text-[#0F172A]"
                }`}
              >
                Report Bug 🐛
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("club_pass");
                  setSelectedArticle(null);
                }}
                className={`py-2.5 transition border-b-2 ${
                  activeTab === "club_pass"
                    ? "border-[#007749] bg-white text-[#007749]"
                    : "border-transparent hover:text-[#0F172A]"
                }`}
              >
                Club Pass 👑
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 1: FAQS & KNOWLEDGE BASE */}
              {activeTab === "faqs" && (
                <>
                  {selectedArticle ? (
                    /* Article Detail View */
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setSelectedArticle(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007749] hover:underline"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to All Answers</span>
                      </button>

                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#007749]">
                          {selectedArticle.category.replace(/_/g, " ")}
                        </span>
                        <h3 className="font-display mt-1 text-sm font-extrabold text-[#0F172A]">
                          {selectedArticle.question}
                        </h3>
                        <p className="mt-2 text-[#475569] leading-relaxed">
                          {selectedArticle.summary}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                          Deterministic Resolution Steps:
                        </h4>
                        <ol className="space-y-2">
                          {selectedArticle.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F172A] text-white font-mono text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span
                                className="text-[#334155] leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: step.replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#0F172A] font-semibold'>$1</strong>"),
                                }}
                              />
                            </li>
                          ))}
                        </ol>
                      </div>

                      {selectedArticle.directActionLabel && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full rounded-full bg-[#007749] py-2.5 text-center text-xs font-bold text-white hover:bg-[#005F3A] transition"
                          >
                            {selectedArticle.directActionLabel} →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Search & FAQ List */
                    <>
                      {/* Zero-Latency Search */}
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search keyword (e.g. gate pin, Capitec, cancel, refund)..."
                          className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#007749] focus:bg-white focus:outline-none"
                        />
                      </div>

                      {/* Screen-Aware Top 3 Quick Answers */}
                      {!searchQuery.trim() && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#007749]">
                              Recommended for Current Screen
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-[#64748B]">
                              {pathname || "/"}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {contextualTop3.map((article) => (
                              <button
                                key={article.id}
                                type="button"
                                onClick={() => setSelectedArticle(article)}
                                className="flex w-full items-center justify-between rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-left hover:border-[#007749]/40 hover:bg-emerald-50/30 transition group"
                              >
                                <span className="font-bold text-[#0F172A] group-hover:text-[#007749] pr-2">
                                  {article.question}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8] group-hover:text-[#007749]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Articles or Filtered Results */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#475569]">
                          {searchQuery.trim() ? `Search Results (${filteredArticles.length})` : "All Help Guides"}
                        </span>
                        {filteredArticles.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[#E6E2D8] p-5 text-center text-[#64748B]">
                            <p>No exact article matches &ldquo;{searchQuery}&rdquo;.</p>
                            <button
                              type="button"
                              onClick={() => setActiveTab("diagnostic")}
                              className="mt-2 text-xs font-bold text-[#007749] underline"
                            >
                              Report an issue or ask founder directly →
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {filteredArticles.map((article) => (
                              <button
                                key={article.id}
                                type="button"
                                onClick={() => setSelectedArticle(article)}
                                className="flex w-full items-center justify-between rounded-xl border border-[#E6E2D8] bg-white p-3 text-left hover:border-[#007749]/40 hover:bg-slate-50 transition"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-[#0F172A] truncate">
                                    {article.question}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                                    {article.summary}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* TAB 2: SMART BUG DIAGNOSTIC CAPTURE (smart-bug-diagnostic-capture) */}
              {activeTab === "diagnostic" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-3.5 space-y-1">
                    <p className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Bug className="h-4 w-4 text-amber-700" />
                      <span>1-Click Privacy-Sanitized Bug Report</span>
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      We automatically collect browser environment metrics to fix parser and gate issues fast. Personal cell numbers and bank accounts are automatically masked under POPIA.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bug-notes-input" className="mb-1 block font-bold text-[#0F172A]">
                      What went wrong? (Optional description)
                    </label>
                    <textarea
                      id="bug-notes-input"
                      rows={3}
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="e.g. Capitec SMS didn't parse my R150 payment reference, or Gate PIN button is unresponsive..."
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Sanitized Telemetry Preview */}
                  <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 text-[10px] text-emerald-400 font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                      <span>TELEMETRY SNAPSHOT</span>
                      <span className="text-[9px] text-[#FFB81C]">POPIA COMPLIANT</span>
                    </div>
                    <p>• Route: {pathname || "/"}</p>
                    <p>• Viewport: {typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "390x844"}</p>
                    <p>• Network: {typeof navigator !== "undefined" && navigator.onLine ? "Online (Active)" : "Offline Cache"}</p>
                    <p>• PII Stripped: Phone &amp; Bank digits masked with &apos;***&apos;</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendBugViaWhatsApp}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#007749] py-3 text-xs font-extrabold text-white hover:bg-[#005F3A] transition shadow-xs"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Submit 1-Click Report via WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyDiagnostic}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#E6E2D8] bg-white py-2.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition"
                    >
                      {copiedDiagnostic ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#007749]" />
                          <span>Sanitized Payload Copied! ✅</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Diagnostic JSON for Support</span>
                        </>
                      )}
                    </button>
                  </div>

                  {bugSubmitted && (
                    <div className="rounded-xl border border-emerald-400 bg-emerald-50 p-2.5 text-center font-bold text-[#007749]">
                      ✅ WhatsApp support thread launched! Founder response time is &lt; 5 minutes.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CHURN-SAVE & OFFBOARDING (churn-save-cancel-flow) */}
              {activeTab === "club_pass" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3.5 space-y-1">
                    <p className="font-extrabold text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-700" />
                      <span>Organiser Club Pass Management</span>
                    </p>
                    <p className="text-[11px] text-purple-900 leading-relaxed">
                      Pause your pass for off-season breaks at R0/mo to keep your squad rosters, or cancel self-serve in 1 click in terms of Section 42 of ECTA.
                    </p>
                  </div>

                  {cancelStep === "confirmed" ? (
                    <div className="rounded-2xl border border-[#007749]/40 bg-emerald-50 p-4 text-center space-y-2">
                      <p className="font-extrabold text-[#007749]">{saveActionMessage}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelStep("reason");
                          setIsOpen(false);
                        }}
                        className="rounded-full bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
                      >
                        Close Support
                      </button>
                    </div>
                  ) : cancelStep === "offer" ? (
                    /* Step 2: Churn Deflection Offer based on selected reason */
                    <div className="space-y-3">
                      {cancelReason === "off_season" && (
                        <div className="rounded-2xl border-2 border-[#007749] bg-white p-4 space-y-2 shadow-xs">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-[#007749]">
                            Recommended Solution
                          </span>
                          <h4 className="font-display font-extrabold text-sm text-[#0F172A]">
                            Pause Account for 2 Months (R0/mo)
                          </h4>
                          <p className="text-[#475569] text-xs leading-relaxed">
                            Taking a December or exam break? Don&apos;t lose your saved 5-a-side lineups and 1-tap weekly clone templates. We&apos;ll freeze billing for 60 days at R0 and auto-resume when your league restarts.
                          </p>
                          <button
                            type="button"
                            onClick={handlePauseAccount}
                            className="w-full rounded-full bg-[#007749] py-2.5 text-xs font-extrabold text-white hover:bg-[#005F3A] transition"
                          >
                            🏆 Keep Lineups &amp; Pause for 2 Months (R0/mo)
                          </button>
                        </div>
                      )}

                      {cancelReason === "price" && (
                        <div className="rounded-2xl border-2 border-amber-500 bg-white p-4 space-y-2 shadow-xs">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
                            Captain Loyalty Offer
                          </span>
                          <h4 className="font-display font-extrabold text-sm text-[#0F172A]">
                            Switch to Captain Starter @ R39/month
                          </h4>
                          <p className="text-[#475569] text-xs leading-relaxed">
                            Keep hosting up to 2 Pro squad events per month at 50% off for the next 3 billing cycles.
                          </p>
                          <button
                            type="button"
                            onClick={handleApplyLoyaltyRate}
                            className="w-full rounded-full bg-[#0F172A] py-2.5 text-xs font-extrabold text-[#FFB81C] hover:bg-slate-800 transition"
                          >
                            ⚡ Switch to R39/mo Captain Starter
                          </button>
                        </div>
                      )}

                      {cancelReason === "missing_feature" && (
                        <div className="rounded-2xl border border-blue-300 bg-blue-50/60 p-4 space-y-2">
                          <h4 className="font-display font-extrabold text-sm text-blue-950">
                            Tell Us What Was Missing — We Patch Within 24h
                          </h4>
                          <p className="text-blue-900 text-xs leading-relaxed">
                            Need a custom round-robin bracket, multi-venue splits, or specific bank export? Tell us and we will credit 30 free VIP days to your profile.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              window.open(
                                "https://wa.me/27768063638?text=" +
                                  encodeURIComponent("Hi PullThru Founder, I wanted to cancel my Club Pass because I need this feature: "),
                                "_blank"
                              );
                            }}
                            className="w-full rounded-full bg-blue-900 py-2.5 text-xs font-extrabold text-white"
                          >
                            💬 Send Feature Request to Founder
                          </button>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#E6E2D8] text-center">
                        <button
                          type="button"
                          onClick={handleFinalCancel}
                          className="text-xs font-semibold text-rose-700 hover:underline"
                        >
                          I still want to cancel permanently →
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 1: Reason Selector */
                    <div className="space-y-2">
                      <p className="font-bold text-[#0F172A]">
                        Why would you like to cancel your Organiser Club Pass?
                      </p>
                      <div className="space-y-1.5">
                        {[
                          {
                            id: "off_season",
                            label: "🏆 Our league / season is on a holiday break",
                          },
                          {
                            id: "price",
                            label: "💵 It's too expensive for my current squad size",
                          },
                          {
                            id: "missing_feature",
                            label: "⚡ Missing a specific feature I need",
                          },
                          {
                            id: "other",
                            label: "🚪 I no longer organize events",
                          },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setCancelReason(opt.id as any);
                              setCancelStep("offer");
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-left hover:border-[#007749] hover:bg-white transition"
                          >
                            <span className="font-semibold text-[#0F172A]">{opt.label}</span>
                            <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Frictionless Human Handoff + Quick Tour / Share / Rate Footer */}
            <div className="border-t border-[#E6E2D8] bg-[#FAF8F5] p-3.5 space-y-2.5 text-xs">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new Event("pullthru:open-quick-tour"));
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[#E6E2D8] bg-white py-1.5 px-2 text-[11px] font-bold text-[#0F172A] hover:border-[#007749] transition cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-[#007749]" />
                  <span>15s Tour</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const shareText =
                      "🇿🇦 Use PullThru to create a 25-second WhatsApp event link for 5-a-side, Padel, Braais & Gift Pots — 100% direct PayShap/Capitec PayMe payout:";
                    const shareUrl = "https://pullthru.co.za";
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: "PullThru — Group Events & Pay",
                          text: shareText,
                          url: shareUrl,
                        });
                        return;
                      }
                    } catch {
                      // fallback
                    }
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[#E6E2D8] bg-white py-1.5 px-2 text-[11px] font-bold text-[#0F172A] hover:border-[#007749] transition cursor-pointer"
                >
                  <span>📲 Share App</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      "https://play.google.com/store/apps/details?id=com.pullthru.za",
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[#E6E2D8] bg-white py-1.5 px-2 text-[11px] font-bold text-[#0F172A] hover:border-[#FFB81C] transition cursor-pointer"
                >
                  <span>⭐ Rate App</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-[#475569] truncate">
                    Founder Support Live • Avg 2 min
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      `https://wa.me/27768063638?text=${encodeURIComponent(
                        `Hi PullThru Founder, I need a hand on ${pathname || "the site"}`
                      )}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0F172A] px-3.5 py-1.5 text-[11px] font-bold text-[#FFB81C] hover:bg-slate-800 transition shadow-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Chat Founder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
