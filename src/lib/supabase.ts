import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Checks whether live Supabase credentials are configured in the environment.
 * When false, PullThru seamlessly operates in Hybrid Demo Mode with persistent seeded data.
 */
export function isSupabaseConfigured(): boolean {
  if (process.env.NODE_ENV === "test" || process.env.IS_PULLTHRU_TEST === "true") {
    return false;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-project-ref") &&
      key.length > 20
  );
}

/**
 * Returns the public/anon Supabase client if configured, or `null` in Hybrid Demo Mode.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}

/**
 * Returns the server-side Supabase Service Role client if configured,
 * or `null` in Hybrid Demo Mode when `SUPABASE_SERVICE_ROLE_KEY` is not provided.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    !serviceKey ||
    serviceKey.includes("your-service-role-key") ||
    serviceKey.length <= 20
  ) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}
