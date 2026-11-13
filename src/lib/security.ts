import { NextRequest, NextResponse } from "next/server";

interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Extracts a normalized client identifier from incoming headers.
 * In test mode without explicit IP headers, returns null unless forceRateLimit is enabled.
 */
export function getClientIdentifier(req: NextRequest): string | null {
  const forwarded =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-test-client-ip");

  if (forwarded) {
    return forwarded;
  }

  // In unit test suites that do not send IP headers, avoid cross-test rate-limit collisions
  if (
    process.env.IS_PULLTHRU_TEST === "true" &&
    req.headers.get("x-enforce-rate-limit") !== "true"
  ) {
    return null;
  }

  return "local-client";
}

/**
 * Sliding-window rate limiter with suspicious-activity logging (Checks #08 & #12).
 * Returns a 429 NextResponse when rate limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(
  req: NextRequest,
  bucketName: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): NextResponse | null {
  const clientId = getClientIdentifier(req);
  if (!clientId) {
    return null;
  }

  const key = `${bucketName}:${clientId}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = rateLimitStore.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((entry.timestamps[0] + windowMs - now) / 1000)
    );
    console.warn(
      `[SECURITY ALERT] Rate limit exceeded for bucket="${bucketName}" client="${clientId}" (${entry.timestamps.length}/${maxRequests} in ${windowMs}ms)`
    );
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a moment and try again.",
        retryAfterSeconds: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
        },
      }
    );
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  // Periodic cleanup to keep memory bounded
  if (rateLimitStore.size > 2000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.timestamps.every((t) => t <= cutoff)) {
        rateLimitStore.delete(k);
      }
    }
  }

  return null;
}

const ALLOWED_PRODUCTION_HOSTS = new Set([
  "pullthru.co.za",
  "www.pullthru.co.za",
  "pullthru-sa.arvinbechan.workers.dev",
  "localhost:3000",
  "127.0.0.1:3000",
]);

/**
 * Verifies Origin / Referer on state-mutating browser requests to prevent CSRF
 * and unauthorized cross-origin POST/PATCH mutations (Checks #13 & #16).
 */
export function enforceSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Non-browser or same-origin requests without Origin header are allowed
    return null;
  }

  try {
    const parsedOrigin = new URL(origin);
    const reqHost = req.headers.get("host") || req.nextUrl.host;

    if (
      parsedOrigin.host === reqHost ||
      ALLOWED_PRODUCTION_HOSTS.has(parsedOrigin.host.toLowerCase())
    ) {
      return null;
    }

    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (configuredAppUrl) {
      try {
        const parsedApp = new URL(configuredAppUrl);
        if (parsedOrigin.host === parsedApp.host) {
          return null;
        }
      } catch {
        // Ignore malformed env
      }
    }

    console.warn(
      `[SECURITY ALERT] Blocked cross-origin state mutation from origin="${origin}" to "${req.nextUrl.pathname}"`
    );
    return NextResponse.json(
      {
        error: "Forbidden: Cross-origin request blocked by CSRF & CORS security policy.",
      },
      { status: 403 }
    );
  } catch {
    return NextResponse.json(
      { error: "Forbidden: Malformed Origin header." },
      { status: 403 }
    );
  }
}

/**
 * Sanitizes unexpected exception messages so production 500 responses never leak
 * raw PostgreSQL / Supabase schema names, stack traces, or internal paths (Check #20).
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }
  const msg = error.message || fallbackMessage;

  // Never leak raw SQL, schema cache, stack traces, or file system paths in API responses
  if (
    /schema cache|relation ".*" does not exist|syntax error at or near|violates .* constraint|pgrst|supabase|postgres|ECONNREFUSED|ENOENT|at Object\./i.test(
      msg
    )
  ) {
    console.error("[INTERNAL ERROR SANITIZED]", msg);
    return fallbackMessage;
  }

  if (process.env.NODE_ENV === "production" && msg.length > 220) {
    console.error("[PRODUCTION ERROR TRUNCATED]", msg);
    return fallbackMessage;
  }

  return msg;
}

/**
 * Helper for tests to reset rate limit state between test cases.
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
