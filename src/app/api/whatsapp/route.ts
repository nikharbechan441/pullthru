import { NextRequest, NextResponse } from "next/server";
import { createEvent } from "@/lib/store";
import { parseWhatsAppCommand } from "@/lib/whatsapp";
import {
  validateEventCompliance,
  determineSettlementSchedule,
  MAX_SINGLE_CONTRIBUTION_ZAR,
} from "@/lib/compliance";
import { enforceRateLimit, sanitizeErrorMessage } from "@/lib/security";

// POST /api/whatsapp - Webhook & interactive command receiver
export async function POST(request: NextRequest) {
  try {
    const rateErr = enforceRateLimit(request, "whatsapp:bot", 20, 60_000);
    if (rateErr) return rateErr;
    // Production Security Guard: Require WhatsApp bot secret header or bearer token
    if (process.env.NODE_ENV === "production") {
      const secret = process.env.WHATSAPP_BOT_SECRET;
      const authHeader =
        request.headers.get("x-pullthru-bot-secret") ||
        request.headers.get("authorization");
      const urlSecret = request.nextUrl.searchParams.get("secret");
      if (
        !secret ||
        (authHeader !== secret &&
          authHeader !== `Bearer ${secret}` &&
          urlSecret !== secret)
      ) {
        return NextResponse.json(
          { error: "Unauthorized WhatsApp Bot webhook invocation." },
          { status: 401 }
        );
      }
    }

    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const message = body.message || body.text || "";
    const hostPhone = body.from || body.phone || "";
    const hostName = body.sender_name || body.name || "WhatsApp Host";

    const parsed = parseWhatsAppCommand(message);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Could not parse WhatsApp command. Use format: /pullthru [vibe] R[price] [spots]spots. Example: /pullthru 5aside R100 10spots",
          usage: "/pullthru 5aside R100 10spots",
        },
        { status: 400 }
      );
    }

    const compliance = validateEventCompliance(parsed.title, message);
    if (!compliance.compliant) {
      return NextResponse.json(
        { error: compliance.reason, statute: compliance.statute },
        { status: 400 }
      );
    }

    const eventMode = parsed.price_zar === 0 ? "free" : "fixed";
    if (
      eventMode === "fixed" &&
      (parsed.price_zar < 50 || parsed.price_zar > MAX_SINGLE_CONTRIBUTION_ZAR)
    ) {
      return NextResponse.json(
        {
          error: `Paid WhatsApp events must have a spot price between R50 and R${MAX_SINGLE_CONTRIBUTION_ZAR}.`,
        },
        { status: 400 }
      );
    }

    const settlement = determineSettlementSchedule({
      mode: eventMode,
      priceZar: parsed.price_zar,
      maxSpots: parsed.max_spots,
      trustTier: "tier_0_new",
    });

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${parsed.vibe.toLowerCase()}-${Date.now().toString().slice(-4)}-${randomSuffix}`;

    const event = await createEvent({
      profile_id: `wa-${hostPhone.replace(/\D/g, "")}`,
      host_name: hostName,
      host_phone: hostPhone,
      slug,
      mode: eventMode,
      category_vibe: parsed.category_vibe,
      title: parsed.title,
      description: `Created via WhatsApp Bot command: "${message}". Drop link to lock squad!`,
      price_zar: parsed.price_zar,
      max_spots: parsed.max_spots,
      event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      location_name: "Location shared in WhatsApp group",
      settlement_schedule: settlement.schedule,
    });

    const hostLink = `/e/${event.slug}?hostToken=${event.host_secret_token}`;
    const guestLink = `/e/${event.slug}`;
    const replyText = `🇿🇦 *PullThru Event Ready in 1s!*\n\n*${event.title}*\n💰 R${event.price_zar}/spot • 👥 ${event.max_spots} spots max\n\n👉 *Drop this link in your WhatsApp group:*\nhttps://pullthru.co.za${guestLink}\n\n👑 *Your private host controls:*\nhttps://pullthru.co.za${hostLink}`;

    return NextResponse.json(
      {
        success: true,
        command_parsed: parsed,
        event,
        guest_url: guestLink,
        host_url: hostLink,
        whatsapp_reply: replyText,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = sanitizeErrorMessage(
      error,
      "Failed to process WhatsApp command."
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
