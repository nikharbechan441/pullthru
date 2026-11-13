"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, CheckCircle2, ChevronDown } from "lucide-react";
import { reportClientError, sanitizeTelemetryString } from "@/lib/telemetry";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reported, setReported] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    reportClientError({
      type: "react_error_boundary",
      message: error?.message || "React render boundary exception",
      stack: error?.stack || null,
      notes: error?.digest ? `digest=${error.digest}` : null,
    }).then((ok) => {
      if (ok) setReported(true);
    });
  }, [error]);

  const sanitizedMsg = sanitizeTelemetryString(
    error?.message || "Unexpected rendering error",
    240
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-black text-[#0F172A]">
              Eish! Something tripped up on this screen
            </h1>
            <p className="text-xs text-[#475569]">
              Your squad data and saved events are 100% safe.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#007749] shrink-0 mt-0.5" />
          <span>
            {reported
              ? "Auto-Diagnostic Sent: We've automatically logged a POPIA-sanitized crash report so our team can fix this right away."
              : "Capturing a POPIA-sanitized crash report automatically so our team can fix this."}
          </span>
        </div>

        {/* Collapsible Diagnostic Snapshot */}
        <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-[#475569] hover:text-[#0F172A] cursor-pointer"
          >
            <span>🔍 View Sanitized Diagnostic Snapshot</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
            />
          </button>
          {showDetails && (
            <pre className="border-t border-[#E6E2D8] bg-[#0F172A] p-3 text-[10px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
              {sanitizedMsg}
            </pre>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#007749] py-2.5 px-4 text-xs font-extrabold text-white hover:bg-[#005F3A] transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] py-2.5 px-4 text-xs font-bold text-[#0F172A] hover:bg-[#F3F0EA] transition"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Back Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
