import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  validateSaBankAccount,
  determineSettlementSchedule,
  SA_BANKS,
} from "@/lib/compliance";
import { getEventBySlug, updateEvent } from "@/lib/store";
import { EventMode } from "@/types/database";
import {
  enforceRateLimit,
  enforceSameOrigin,
  sanitizeErrorMessage,
} from "@/lib/security";

const SEED_HOST_TOKENS = new Set([
  "host-secret-tariq-fives",
  "host-secret-riaan-braai",
  "host-secret-mbali-pot",
  "host-secret-chloe-boat",
  "host-secret-sbu-run",
]);

function verifyHostToken(
  supplied: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!supplied || !expected) return false;
  if (
    process.env.NODE_ENV === "production" &&
    SEED_HOST_TOKENS.has(String(supplied).trim())
  ) {
    return false;
  }
  const a = Buffer.from(String(supplied), "utf8");
  const b = Buffer.from(String(expected), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET() {
  return NextResponse.json({ banks: SA_BANKS });
}

export async function POST(req: NextRequest) {
  try {
    const originErr = enforceSameOrigin(req);
    if (originErr) return originErr;

    const rateErr = enforceRateLimit(req, "paystack:subaccount", 10, 60_000);
    if (rateErr) return rateErr;

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const {
      hostName,
      bankCode,
      accountNumber,
      slug,
      mode = "fixed",
      priceZar = 0,
      maxSpots = null,
      targetPotZar = null,
    } = body as {
      hostName?: string;
      bankCode?: string;
      accountNumber?: string;
      slug?: string;
      mode?: EventMode;
      priceZar?: number;
      maxSpots?: number | null;
      targetPotZar?: number | null;
    };

    if (
      !hostName ||
      typeof hostName !== "string" ||
      !hostName.trim() ||
      !bankCode ||
      !accountNumber
    ) {
      return NextResponse.json(
        { error: "Please provide host name, South African bank, and account number." },
        { status: 400 }
      );
    }

    const trimmedHostName = hostName.trim().slice(0, 80);
    let existingEvent = null;

    if (slug) {
      const existingData = await getEventBySlug(String(slug).trim());
      if (!existingData) {
        return NextResponse.json(
          { error: "Event not found." },
          { status: 404 }
        );
      }
      existingEvent = existingData.event;

      const suppliedHostToken =
        (body.host_token as string | undefined) ||
        (body.hostSecretToken as string | undefined) ||
        req.headers.get("x-host-token");
      if (
        !verifyHostToken(suppliedHostToken, existingData.event.host_secret_token)
      ) {
        return NextResponse.json(
          { error: "Unauthorized: Valid host secret token required for this event." },
          { status: 403 }
        );
      }

      const hasPaidRsvps = existingData.rsvps.some(
        (r) => r.status === "locked_paid" || r.status === "cash_logged"
      );
      if (existingData.event.paystack_subaccount_code && hasPaidRsvps) {
        return NextResponse.json(
          {
            error:
              "Anti-Hijack Lock: Cannot overwrite the linked SA bank subaccount once paid guest contributions have already been locked on this event.",
          },
          { status: 403 }
        );
      }
    }

    const validation = validateSaBankAccount(bankCode, accountNumber);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid South African bank account details." },
        { status: 400 }
      );
    }

    // Never trust client-supplied trustTier; enforce tier_0_new for unverified hosts
    // When slug is supplied, always compute settlement schedule from the stored event's pool parameters
    const scheduleInfo = determineSettlementSchedule({
      trustTier: "tier_0_new",
      mode: existingEvent ? existingEvent.mode : mode,
      priceZar: existingEvent ? existingEvent.price_zar : Number(priceZar) || 0,
      maxSpots: existingEvent
        ? existingEvent.max_spots
        : maxSpots
        ? Number(maxSpots)
        : null,
      targetPotZar: existingEvent
        ? existingEvent.target_pot_zar
        : targetPotZar
        ? Number(targetPotZar)
        : null,
      tiers: existingEvent ? existingEvent.tiers : undefined,
    });

    const bankObj = validation.bank || SA_BANKS.find((b) => b.code === bankCode);
    const shortBankName = bankObj?.shortName || bankObj?.name || "SA Bank";
    const cleanAcc = String(accountNumber).replace(/\D/g, "");
    const account_last4 = validation.last4 || cleanAcc.slice(-4);
    const bank_name = `${shortBankName} (•••• ${account_last4})`;

    const subaccount_code = `ACCT_za_${shortBankName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}_${account_last4}`;
    const responseMode: "live" | "demo_verified" = "demo_verified";

    if (slug) {
      await updateEvent(String(slug).trim(), {
        paystack_subaccount_code: subaccount_code,
        host_bank_name: bank_name,
        settlement_schedule: scheduleInfo.schedule,
      });
    }

    return NextResponse.json({
      subaccount_code,
      bank_name,
      account_last4,
      settlement_schedule: scheduleInfo.schedule,
      explanation: scheduleInfo.explanation,
      mode: responseMode,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(err, "Failed to create Paystack subaccount."),
      },
      { status: 500 }
    );
  }
}
