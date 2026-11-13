import crypto from "crypto";

export type TelemetryErrorType =
  | "window_error"
  | "unhandled_rejection"
  | "react_error_boundary"
  | "api_error"
  | "manual_bug_report"
  | "funnel_step";

export interface TelemetryReportInput {
  type?: TelemetryErrorType;
  message: string;
  stack?: string | null;
  route?: string | null;
  clientPlatform?: string | null;
  viewport?: string | null;
  connectionType?: string | null;
  recentLogs?: string[];
  notes?: string | null;
}

export interface TelemetryEventRecord {
  id: string;
  reference: string;
  type: TelemetryErrorType;
  message: string;
  stack: string | null;
  route: string;
  clientPlatform: string;
  viewport: string;
  connectionType: string;
  recentLogs: string[];
  notes: string | null;
  created_at: string;
}

const VALID_TYPES = new Set<TelemetryErrorType>([
  "window_error",
  "unhandled_rejection",
  "react_error_boundary",
  "api_error",
  "manual_bug_report",
  "funnel_step",
]);

/**
 * Strictly scrubs all South African PII, bank accounts, payment cards, emails,
 * and secret tokens (hostToken, swapToken, Bearer) for POPIA/GDPR compliance.
 */
export function sanitizeTelemetryString(raw: unknown, maxLen = 500): string {
  if (raw === null || raw === undefined) return "";
  const str = typeof raw === "string" ? raw : String(raw);
  if (!str) return "";

  return str
    // Redact query/header secret tokens (hostToken, swapToken, host_secret_token, Bearer)
    .replace(
      /(hostToken|swapToken|host_secret_token|swap_token|Authorization|Bearer)([=:\s]+)[A-Za-z0-9_\-.]+/gi,
      "$1$2[REDACTED_TOKEN]"
    )
    // Redact email addresses
    .replace(
      /\b([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      "$1***@$2"
    )
    // Mask SA mobile numbers (082 123 4567 or +27821234567 -> 082 *** 4567)
    .replace(
      /(?:0|\+27)[678]\d[\s-]?\d{3}[\s-]?\d{4}/g,
      (match) => {
        const digits = match.replace(/\D/g, "");
        return digits.slice(0, 3) + " *** " + digits.slice(-4);
      }
    )
    // Mask 16-digit payment cards
    .replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, "XXXX-XXXX-XXXX-XXXX")
    // Mask 9 to 12 digit SA bank account numbers
    .replace(/\b\d{9,12}\b/g, (match) => "******" + match.slice(-4))
    .trim()
    .slice(0, maxLen);
}

export function sanitizeTelemetryPayload(
  input: TelemetryReportInput
): TelemetryEventRecord {
  const rawType = input.type && VALID_TYPES.has(input.type) ? input.type : "window_error";
  const message =
    sanitizeTelemetryString(input.message, 300) || "Unknown client error";
  const stack = input.stack
    ? sanitizeTelemetryString(input.stack, 800)
    : null;
  const route =
    sanitizeTelemetryString(input.route || "/", 120) || "/";
  const clientPlatform =
    sanitizeTelemetryString(input.clientPlatform || "Unknown Browser", 80) ||
    "Unknown Browser";
  const viewport =
    sanitizeTelemetryString(input.viewport || "unknown", 40) || "unknown";
  const connectionType =
    sanitizeTelemetryString(input.connectionType || "4g/wifi", 30) || "4g/wifi";
  const recentLogs = Array.isArray(input.recentLogs)
    ? input.recentLogs
        .slice(0, 3)
        .map((l) => sanitizeTelemetryString(l, 240))
        .filter(Boolean)
    : [];
  const notes = input.notes
    ? sanitizeTelemetryString(input.notes, 300)
    : null;

  const ts = Date.now();
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomBytes === "function"
      ? crypto.randomBytes(3).toString("hex")
      : Math.random().toString(36).slice(2, 8);

  const isFunnel = rawType === "funnel_step";

  return {
    id: `${isFunnel ? "fnl" : "err"}-${ts}-${suffix}`,
    reference: `${isFunnel ? "FUNNEL_TELEMETRY" : "ERR_TELEMETRY"}_${ts}_${suffix}`,
    type: rawType,
    message,
    stack,
    route,
    clientPlatform,
    viewport,
    connectionType,
    recentLogs,
    notes,
    created_at: new Date(ts).toISOString(),
  };
}

// Client-side deduplication & session cap state
const reportedSignatures = new Map<string, number>();
const reportedFunnelSteps = new Set<string>();
let sessionReportCount = 0;
const MAX_REPORTS_PER_SESSION = 5;
const MAX_FUNNEL_STEPS_PER_SESSION = 15;
const DEDUPE_WINDOW_MS = 60_000;

export function resetClientTelemetryLimiterForTests(): void {
  reportedSignatures.clear();
  reportedFunnelSteps.clear();
  sessionReportCount = 0;
}

/**
 * Checks whether a funnel milestone should be recorded in this session
 * (separate from the error cap so funnel analytics never suppress crash reports).
 */
export function shouldReportFunnelStep(stepKey: string, route = "/create"): boolean {
  if (reportedFunnelSteps.size >= MAX_FUNNEL_STEPS_PER_SESSION) {
    return false;
  }
  const sig = `funnel:${route}:${stepKey.slice(0, 80)}`;
  if (reportedFunnelSteps.has(sig)) {
    return false;
  }
  reportedFunnelSteps.add(sig);
  return true;
}

/**
 * Checks whether a client error signature should be reported or suppressed
 * (prevents infinite error loops from flooding the telemetry endpoint).
 */
export function shouldReportClientError(
  type: TelemetryErrorType,
  message: string,
  route = "/"
): boolean {
  if (sessionReportCount >= MAX_REPORTS_PER_SESSION) {
    return false;
  }
  const sig = `${type}:${route}:${message.slice(0, 120)}`;
  const now = Date.now();
  const lastTime = reportedSignatures.get(sig);
  if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
    return false;
  }
  reportedSignatures.set(sig, now);
  sessionReportCount += 1;
  return true;
}

/**
 * Silently sends a sanitized error report to /api/telemetry in the background.
 * Never throws or interrupts user flow.
 */
export async function reportClientError(
  input: TelemetryReportInput
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const type = input.type || "window_error";
    const route = input.route || window.location?.pathname || "/";
    const cleanMsg = sanitizeTelemetryString(input.message, 300);
    if (!cleanMsg) return false;

    if (!shouldReportClientError(type, cleanMsg, route)) {
      return false;
    }

    const nav = window.navigator as Navigator & {
      connection?: { effectiveType?: string };
    };
    const ua = nav?.userAgent || "";
    const clientPlatform =
      input.clientPlatform ||
      (ua.includes("iPhone") || ua.includes("iPad")
        ? "iOS Safari / WebKit"
        : ua.includes("Android")
        ? "Android Chrome / App"
        : "Desktop Browser");
    const viewport =
      input.viewport ||
      `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio || 1}x`;
    const connectionType =
      input.connectionType || nav?.connection?.effectiveType || "4g/wifi";

    const payload: TelemetryReportInput = {
      type,
      message: cleanMsg,
      stack: input.stack ? sanitizeTelemetryString(input.stack, 800) : null,
      route,
      clientPlatform,
      viewport,
      connectionType,
      recentLogs: input.recentLogs || [],
      notes: input.notes ? sanitizeTelemetryString(input.notes, 300) : null,
    };

    const res = await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Silently logs an anonymous conversion funnel step (e.g. create_step_1_view,
 * create_preset_select, create_step_2_view, create_step_3_view, create_publish_success).
 */
export async function reportFunnelStep(
  stepName: string,
  notes?: string | null,
  route = "/create"
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const cleanStep = sanitizeTelemetryString(stepName, 120);
    if (!cleanStep) return false;
    const effectiveRoute = route || window.location?.pathname || "/create";
    if (!shouldReportFunnelStep(cleanStep, effectiveRoute)) {
      return false;
    }

    const nav = window.navigator as Navigator & {
      connection?: { effectiveType?: string };
    };
    const ua = nav?.userAgent || "";
    const clientPlatform =
      ua.includes("iPhone") || ua.includes("iPad")
        ? "iOS Safari / WebKit"
        : ua.includes("Android")
        ? "Android Chrome / App"
        : "Desktop Browser";
    const viewport = `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio || 1}x`;
    const connectionType = nav?.connection?.effectiveType || "4g/wifi";

    const payload: TelemetryReportInput = {
      type: "funnel_step",
      message: cleanStep,
      route: effectiveRoute,
      clientPlatform,
      viewport,
      connectionType,
      notes: notes ? sanitizeTelemetryString(notes, 200) : null,
    };

    const res = await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
