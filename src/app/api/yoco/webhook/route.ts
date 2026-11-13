import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markOrderPaidAndCreateRsvp, getOrderByReference, updateEvent, getEventBySlug } from "@/lib/store";

function verifyYocoSignature(
  rawBody: string,
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const tsSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(tsSeconds)) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsSeconds) > 300) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(cleanSecret, "base64");
  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const expectedBuf = Buffer.from(expectedSig, "utf8");

  const signatures = webhookSignature.split(" ");
  for (const versionedSig of signatures) {
    const [, sig] = versionedSig.split(",");
    if (sig) {
      const sigBuf = Buffer.from(sig, "utf8");
      if (
        sigBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(sigBuf, expectedBuf)
      ) {
        return true;
      }
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

    if (
      !webhookSecret ||
      !verifyYocoSignature(
        rawBody,
        webhookId,
        webhookTimestamp,
        webhookSignature,
        webhookSecret
      )
    ) {
      return NextResponse.json(
        { error: "Invalid or missing Yoco webhook signature" },
        { status: 401 }
      );
    }

    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = eventPayload?.type || eventPayload?.event;
    const payload = eventPayload?.payload || eventPayload?.data || {};
    const metadata = payload?.metadata || {};

    // Only process successful payment events
    if (eventType === "payment.succeeded" || eventType === "checkout.succeeded") {
      if (payload?.currency && String(payload.currency).toUpperCase() !== "ZAR") {
        return NextResponse.json(
          { error: "Invalid currency: only ZAR supported" },
          { status: 400 }
        );
      }

      const orderRef = metadata?.orderRef || metadata?.reference;
      const type = metadata?.type;

      if (type === "host_pass" && metadata?.slug) {
        const minPassCents = metadata?.passType === "club" ? 7900 : 2900;
        if (payload?.amount === undefined || Number(payload.amount) < minPassCents) {
          return NextResponse.json(
            { error: "Underpaid or missing host pass amount" },
            { status: 400 }
          );
        }
        const slug = String(metadata.slug);
        const eventResult = await getEventBySlug(slug);
        if (eventResult && eventResult.event) {
          await updateEvent(eventResult.event.slug, {
            is_pro_boosted: true,
            pro_boost_reference: String(
              payload?.id || metadata?.checkoutId || `YOCO_PASS_${Date.now()}`
            ),
          });
        }
        return NextResponse.json({ received: true, host_pass_activated: true });
      }

      if (orderRef) {
        const order = await getOrderByReference(String(orderRef));
        if (order && order.status !== "paid") {
          if (
            payload?.amount === undefined ||
            Number(payload.amount) < order.total_charged_cents
          ) {
            return NextResponse.json(
              { error: "Underpaid or missing order amount" },
              { status: 400 }
            );
          }
          await markOrderPaidAndCreateRsvp(String(orderRef));
          return NextResponse.json({ received: true, rsvp_unlocked: true });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[YOCO WEBHOOK ERROR]", err);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
