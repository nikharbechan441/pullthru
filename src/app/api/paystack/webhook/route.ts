import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getOrderByReference,
  markOrderPaidAndCreateRsvp,
  requestOrProcessRefund,
  getEventBySlug,
} from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = (req.headers.get("x-paystack-signature") || "").trim();
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (
      !secret &&
      (process.env.NODE_ENV === "production" || process.env.IS_PULLTHRU_TEST !== "true")
    ) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY not configured on server." },
        { status: 500 }
      );
    }
    const secretToUse = secret || "sk_test_pullthru_demo_secret";

    const expectedSignature = crypto
      .createHmac("sha512", secretToUse)
      .update(rawBody)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid Paystack webhook signature." },
        { status: 401 }
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON webhook body." },
        { status: 400 }
      );
    }

    const event = payload.event as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    if (event === "charge.success" && data?.reference) {
      const reference = String(data.reference);
      const metadata = (data.metadata as Record<string, unknown>) || {};

      const existingOrder = await getOrderByReference(reference);
      if (!existingOrder) {
        return NextResponse.json(
          { received: true, status: "order_not_found", reference },
          { status: 200 }
        );
      }

      if (data.status && data.status !== "success") {
        return NextResponse.json(
          { received: true, status: "ignored_non_success", reference },
          { status: 200 }
        );
      }

      if (data.currency && String(data.currency).toUpperCase() !== "ZAR") {
        return NextResponse.json(
          { error: "Webhook currency mismatch: expected ZAR.", reference },
          { status: 400 }
        );
      }

      if (
        data.amount !== undefined &&
        data.amount !== null &&
        (!Number.isFinite(Number(data.amount)) ||
          Number(data.amount) < existingOrder.total_charged_cents)
      ) {
        return NextResponse.json(
          {
            error: "Webhook amount mismatch: charged amount is less than order total.",
            reference,
          },
          { status: 400 }
        );
      }

      const VALID_CHANNELS = [
        "capitec_pay",
        "eft",
        "apple_pay",
        "card",
        "cash_manual",
      ];
      const resolvedChannel = VALID_CHANNELS.includes(
        String(metadata.payment_channel || "")
      )
        ? (metadata.payment_channel as typeof existingOrder.payment_channel)
        : existingOrder.payment_channel;

      const wasAlreadyPaid = existingOrder.status === "paid";

      const result = await markOrderPaidAndCreateRsvp(reference, {
        badge_label:
          (metadata.badge_label as string | undefined) || "🍻 Here for the Gees",
        comment: (metadata.comment as string | undefined) || undefined,
        claimed_item_id:
          (metadata.claimed_item_id as string | null | undefined) || null,
        custom_answer:
          (metadata.custom_answer as string | null | undefined) || null,
        is_anonymous_on_wall: Boolean(metadata.is_anonymous_on_wall),
        payment_channel: resolvedChannel,
        settling_rsvp_id:
          (metadata.settling_rsvp_id as string | null | undefined) || null,
      });

      return NextResponse.json(
        {
          received: true,
          status: wasAlreadyPaid ? "already_settled" : "settled_and_locked",
          idempotent: wasAlreadyPaid,
          reference,
          rsvp_id: result?.rsvp?.id || null,
        },
        { status: 200 }
      );
    }

    if (
      (event === "charge.dispute.create" || event === "refund.processed") &&
      data
    ) {
      const txObj = (data.transaction as Record<string, unknown>) || data;
      const reference = String(
        txObj.reference || data.transaction_reference || data.reference || ""
      );
      if (reference) {
        const existingOrder = await getOrderByReference(reference);
        if (existingOrder) {
          await requestOrProcessRefund({
            eventId: existingOrder.event_id,
            ref: reference,
            reason:
              event === "charge.dispute.create"
                ? "Bank chargeback / dispute received via Paystack webhook"
                : "Paystack refund processed",
            isDisputeReport: event === "charge.dispute.create",
            isWebhookEvent: true,
          });
        }
      }
      return NextResponse.json(
        { received: true, status: event, reference },
        { status: 200 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Webhook processing error.",
      },
      { status: 500 }
    );
  }
}
