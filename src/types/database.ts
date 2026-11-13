export type EventMode = "fixed" | "tiered" | "pot" | "free";

export type ProFeeSplitMode = "squad_100" | "split_50_50" | "host_100";

export type TrustTier = "tier_0_new" | "tier_1_trusted";

export type RsvpStatus =
  | "locked_paid"
  | "going_free"
  | "payday_promise"
  | "cash_logged"
  | "refunded";

export type PaymentChannel =
  | "apple_pay"
  | "google_pay"
  | "card"
  | "capitec_pay"
  | "eft"
  | "payshap"
  | "cash_manual";

export interface EventTier {
  id: string;
  label: string;
  description?: string;
  price_zar: number; // 0 allowed for kids/free tier
  max_spots?: number;
}

export interface BringItem {
  id: string;
  label: string; // e.g. "🧊 4x Bags of Ice"
  emoji?: string;
  claimed_by_name?: string | null;
  claimed_rsvp_id?: string | null;
}

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  whatsapp_phone: string;
  avatar_url?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  account_number_last4?: string | null;
  paystack_subaccount_code?: string | null;
  trust_tier: TrustTier;
  is_verified: boolean;
  created_at: string;
}

export interface EventItem {
  id: string;
  profile_id: string;
  host_name: string;
  host_handle: string;
  host_phone: string;
  host_bank_name?: string | null;
  host_account_number?: string | null;
  capitec_payme_url?: string | null;
  bake_pro_boost_into_price?: boolean;
  pro_fee_split_mode?: ProFeeSplitMode;
  is_pro_boosted?: boolean;
  pro_boost_reference?: string | null;
  paystack_subaccount_code?: string | null;
  settlement_schedule: "auto" | "manual";
  slug: string;
  mode: EventMode;
  category_vibe: string; // e.g., "⚽ 5-a-Side / Padel", "🥩 Braai & Potjie", "🎁 Gift / Umgalelo Pot", "🏃 Run Club / Hike"
  title: string;
  description: string;
  price_zar: number; // Default / Fixed price or Suggested contribution in ZAR
  min_pot_contribution_zar?: number;
  target_pot_zar?: number | null;
  tiers: EventTier[];
  bring_items: BringItem[];
  custom_question?: string | null; // e.g. "Any dietary requirements or dress size?"
  hide_amounts_on_wall: boolean; // For teacher gifts / baby showers / umgalelo
  allow_payday_promise: boolean; // Allows "Remind me on the 25th"
  allow_cash_on_arrival?: boolean; // Allows "Pay cash on arrival / at pitch"
  event_date: string;
  location_name: string;
  secret_location_pin?: string | null; // Unlocked after RSVP/Payment
  has_secret_location_pin?: boolean;
  max_spots: number | null;
  venue_name?: string | null;
  venue_deposit_zar?: number | null;
  venue_bank_name?: string | null;
  venue_account_number_last4?: string | null;
  is_active: boolean;
  is_public?: boolean;
  is_cancelled?: boolean;
  payout_frozen?: boolean;
  dispute_count?: number;
  disputed_zar?: number;
  previous_event_date?: string | null;
  host_secret_token: string;
  created_at: string;
  spots_locked?: number;
  total_raised_zar?: number;
  verified_gateway_zar?: number;
  cash_logged_zar?: number;
  rsvp_count?: number;
}

export interface Order {
  id: string;
  event_id: string;
  profile_id: string;
  buyer_name: string;
  buyer_whatsapp: string;
  buyer_email: string; // Either user-provided or synthetic wa_27...@rsvp.pullthru.co.za
  is_synthetic_email: boolean;
  spots_count: number;
  plus_one_names: string[];
  tier_id?: string | null;
  tier_label?: string | null;
  base_price_cents: number; // 100% settled to Host via Paystack Subaccount
  platform_fee_cents: number; // Instant Software RSVP & Clearing Fee (Non-refundable)
  total_charged_cents: number; // Total paid by Guest
  paystack_reference: string;
  payment_channel: PaymentChannel;
  settled_to_host: boolean;
  cpa_s49_accepted: boolean;
  status: "pending" | "paid" | "refunded_partial" | "disputed" | "refund_requested";
  refund_reference?: string | null;
  refund_reason?: string | null;
  refunded_at?: string | null;
  created_at: string;
}

export interface GuestRsvp {
  id: string;
  order_id?: string | null;
  event_id: string;
  guest_name: string;
  plus_one_names: string[];
  spots_locked: number;
  tier_label?: string | null;
  amount_contributed_zar: number;
  status: RsvpStatus;
  payment_channel: PaymentChannel;
  badge_label: string; // e.g., "🥩 Braai Master Sponsor", "⚽ Midfield General", "🍻 Here for the Gees"
  comment?: string | null;
  claimed_item_id?: string | null;
  claimed_item_label?: string | null;
  custom_answer?: string | null; // Private to host unless harmless
  is_anonymous_on_wall: boolean;
  checked_in: boolean;
  payday_preauthorized?: boolean;
  swap_token: string;
  swapped_at?: string | null;
  refund_status?: "none" | "requested" | "refunded" | "disputed";
  refund_reason?: string | null;
  refund_reference?: string | null;
  gate_pin?: string;
  pop_hash?: string | null;
  pop_rail_badge?: "instant_payshap" | "capitec_payme" | "standard_eft" | null;
  pop_reference_note?: string | null;
  guest_whatsapp?: string | null;
  created_at: string;
}

export interface DisputeReport {
  id: string;
  event_id: string;
  slug: string;
  order_id: string;
  rsvp_id: string;
  reporter_name: string;
  buyer_whatsapp: string;
  reason: string;
  amount_zar: number;
  created_at: string;
  status: "open" | "frozen_payout" | "resolved_refunded";
}

export interface CheckoutSplitResult {
  unitBasePriceZar: number;
  spotsCount: number;
  totalBasePriceZar: number;
  basePriceCents: number;
  platformFeeCents: number;
  platformFeeZar: number;
  totalChargedCents: number;
  totalChargedZar: number;
  feeFormulaLabel: string;
  estimatedPaystackCapitecFeeCents: number;
  estimatedPaystackCardFeeCents: number;
  netMarginCapitecCents: number;
  netMarginCardCents: number;
}
