/**
 * Yoco South Africa Payment Gateway Integration
 * 
 * Supports:
 * - 🍏 Apple Pay (Native iOS / Safari)
 * - 📱 Google Pay (Native Android / Chrome)
 * - 💳 Credit & Debit Cards (Visa & Mastercard with 3D Secure)
 * - ⚡ Yoco Instant EFT & Capitec Pay
 * 
 * Documentation: https://developer.yoco.com
 */

export interface CreateYocoCheckoutParams {
  amountCents: number;
  currency?: string;
  cancelUrl: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface YocoCheckoutResponse {
  id: string;
  redirectUrl: string;
  status: string;
  isMock?: boolean;
}

const YOCO_API_BASE = "https://payments.yoco.com/api";

/**
 * Creates a Yoco Hosted Checkout session.
 * If YOCO_SECRET_KEY is not configured yet (e.g. while domain verification is pending),
 * returns a safe simulated checkout URL for testing.
 */
export async function createYocoCheckout(
  params: CreateYocoCheckoutParams
): Promise<YocoCheckoutResponse> {
  const secretKey = process.env.YOCO_SECRET_KEY;

  // Clean metadata values to strings or numbers (Yoco requires clean key-value pairs)
  const cleanMetadata: Record<string, string> = {};
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      if (v !== undefined && v !== null) {
        cleanMetadata[k] = String(v);
      }
    }
  }

  // If secret key is not provided yet or is in placeholder mode
  if (!secretKey || secretKey.startsWith("sk_placeholder_") || secretKey === "dummy") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("YOCO_SECRET_KEY is not configured in production.");
    }
    // Return simulated sandbox response in local dev/test
    const mockId = `mock_ch_${Date.now()}`;
    const successWithMock = new URL(params.successUrl);
    successWithMock.searchParams.set("yoco_mock", "true");
    successWithMock.searchParams.set("checkoutId", mockId);

    return {
      id: mockId,
      redirectUrl: successWithMock.toString(),
      status: "created",
      isMock: true,
    };
  }

  const res = await fetch(`${YOCO_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(params.amountCents),
      currency: params.currency || "ZAR",
      cancelUrl: params.cancelUrl,
      successUrl: params.successUrl,
      failureUrl: params.failureUrl,
      metadata: cleanMetadata,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorJson: any = null;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // not json
    }
    const message =
      errorJson?.message ||
      errorJson?.error ||
      `Yoco Checkout creation failed with status ${res.status}: ${errorText}`;
    throw new Error(message);
  }

  const data = (await res.json()) as {
    id: string;
    redirectUrl: string;
    status: string;
  };

  return {
    id: data.id,
    redirectUrl: data.redirectUrl,
    status: data.status,
    isMock: false,
  };
}
