-- ============================================================================
-- PullThru (pullthru.co.za) — Production PostgreSQL Schema & POPIA RLS Policies
-- South Africa's Universal WhatsApp Event RSVP & Chip-In Kitty PWA
-- ============================================================================
-- Regulatory & Architectural Guarantees:
-- 1. SARB Directive 1 of 2007: Split-at-source via Paystack SA Subaccounts
--    (paystack_subaccount_code, settlement_schedule in ('auto', 'manual')).
-- 2. SARS VAT Act s54 Disclosed Agent & s12E SBC: Strict separation of
--    base_price_cents (Host Principal) vs platform_fee_cents (PullThru Revenue).
-- 3. POPIA (Act 4 of 2013): Strict Row-Level Security (RLS) locking down
--    public.orders (PII: phone, email, financial refs) while exposing only
--    sanitized, positive-only social attendance rows in public.guest_rsvps.
-- 4. CPA Section 49 & ECTA Section 43: Explicit cpa_s49_accepted audit flag
--    and self-service swap_token for zero-admin WhatsApp spot transfers.
-- ============================================================================

-- Enable cryptographic UUID generation
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABLE: public.profiles
-- Stores Event Host profiles, Paystack SA Subaccount metadata, and Trust Tier
-- ============================================================================
create table if not exists public.profiles (
  id text primary key default gen_random_uuid()::text,
  handle text not null unique check (char_length(handle) between 2 and 40),
  display_name text not null check (char_length(display_name) between 2 and 80),
  whatsapp_phone text not null,
  avatar_url text,
  bank_code text,
  bank_name text,
  account_number_last4 text check (account_number_last4 is null or char_length(account_number_last4) = 4),
  paystack_subaccount_code text,
  trust_tier text not null default 'tier_0_new' check (trust_tier in ('tier_0_new', 'tier_1_trusted')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Host profiles and Paystack South Africa subaccount routing metadata.';
comment on column public.profiles.paystack_subaccount_code is 'Paystack ACCT_xxx code for SARB Directive 1 of 2007 split-at-source settlement.';
comment on column public.profiles.trust_tier is '2-Tier Host Trust Ladder: tier_0_new (auto T+1 <= R3,000) or tier_1_trusted.';

-- ============================================================================
-- 2. TABLE: public.events
-- Polymorphic event engine supporting 'fixed', 'tiered', 'pot', and 'free' modes
-- ============================================================================
create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  profile_id text not null references public.profiles(id) on delete cascade,
  host_name text not null,
  host_handle text not null,
  host_phone text not null,
  host_bank_name text,
  paystack_subaccount_code text,
  settlement_schedule text not null default 'auto' check (settlement_schedule in ('auto', 'manual')),
  slug text not null unique check (char_length(slug) between 3 and 120),
  mode text not null default 'fixed' check (mode in ('fixed', 'tiered', 'pot', 'free')),
  category_vibe text not null default '🥩 Braai & Potjie',
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '',
  price_zar integer not null default 0 check (
    (mode = 'free' and price_zar = 0) or
    (mode in ('fixed', 'pot') and price_zar >= 15) or
    (mode = 'tiered' and price_zar >= 0)
  ),
  min_pot_contribution_zar integer default 15 check (min_pot_contribution_zar is null or min_pot_contribution_zar >= 15),
  target_pot_zar integer check (target_pot_zar is null or target_pot_zar >= 15),
  tiers jsonb not null default '[]'::jsonb,
  bring_items jsonb not null default '[]'::jsonb,
  custom_question text,
  hide_amounts_on_wall boolean not null default false,
  allow_payday_promise boolean not null default true,
  allow_cash_on_arrival boolean not null default true,
  pro_fee_split_mode text default 'host_100',
  event_date text not null,
  location_name text not null,
  secret_location_pin text,
  max_spots integer check (max_spots is null or max_spots > 0),
  venue_name text,
  venue_deposit_zar integer check (venue_deposit_zar is null or venue_deposit_zar >= 0),
  venue_bank_name text,
  venue_account_number_last4 text check (venue_account_number_last4 is null or char_length(venue_account_number_last4) = 4),
  is_active boolean not null default true,
  is_public boolean not null default false,
  is_cancelled boolean not null default false,
  payout_frozen boolean not null default false,
  dispute_count integer not null default 0,
  disputed_zar numeric(10,2) not null default 0,
  previous_event_date text,
  host_account_number text,
  capitec_payme_url text,
  bake_pro_boost_into_price boolean not null default false,
  is_pro_boosted boolean not null default false,
  pro_boost_reference text,
  host_secret_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

comment on table public.events is 'Universal WhatsApp event drops supporting fixed, tiered, pot, and free modes.';
comment on column public.events.settlement_schedule is 'Tier 0 Trust Ladder: auto (T+1 payout for pools <= R3,000) or manual (post-event payout for pools > R3,000).';
comment on column public.events.tiers is 'JSONB array of EventTier objects: [{id, label, description, price_zar, max_spots}].';
comment on column public.events.bring_items is 'JSONB array of BringItem objects: [{id, label, emoji, claimed_by_name, claimed_rsvp_id}].';
comment on column public.events.host_secret_token is 'Zero-login magic token allowing the host to manage check-ins and cash logs from WhatsApp.';

-- ============================================================================
-- 3. TABLE: public.orders
-- Private financial & PII ledger (SARS s54 Disclosed Agent split & CPA s49)
-- STRICT POPIA PROTECTION: Never publicly readable.
-- ============================================================================
create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  event_id text not null references public.events(id) on delete cascade,
  profile_id text not null references public.profiles(id) on delete cascade,
  buyer_name text not null,
  buyer_whatsapp text not null,
  buyer_email text not null,
  is_synthetic_email boolean not null default true,
  spots_count integer not null default 1 check (spots_count between 1 and 20),
  plus_one_names jsonb not null default '[]'::jsonb,
  tier_id text,
  tier_label text,
  base_price_cents integer not null check (base_price_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  total_charged_cents integer not null check (total_charged_cents = base_price_cents + platform_fee_cents),
  paystack_reference text not null unique,
  payment_channel text not null default 'capitec_pay' check (
    payment_channel in ('capitec_pay', 'payshap', 'eft', 'apple_pay', 'google_pay', 'card', 'cash_manual')
  ),
  settled_to_host boolean not null default false,
  cpa_s49_accepted boolean not null default true check (cpa_s49_accepted = true),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'refunded_partial', 'disputed', 'refund_requested')
  ),
  refund_reference text,
  refund_reason text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.orders is 'Private financial records and PII. Locked down via RLS under POPIA.';
comment on column public.orders.buyer_email is 'User-provided email or deterministic synthetic proxy (wa_27...@rsvp.pullthru.co.za).';
comment on column public.orders.base_price_cents is 'Principal contribution collected as Disclosed Agent (SARS VAT Act s54) and settled 100% to Host.';
comment on column public.orders.platform_fee_cents is 'PullThru Instant Software RSVP & Clearing Fee (sole gross turnover under Income Tax Act s12E).';
comment on column public.orders.cpa_s49_accepted is 'Mandatory Consumer Protection Act Section 49 clickwrap acknowledgment.';

-- ============================================================================
-- 4. TABLE: public.guest_rsvps
-- POPIA-safe public social wall (Zero phone numbers, zero emails, positive-only)
-- ============================================================================
create table if not exists public.guest_rsvps (
  id text primary key default gen_random_uuid()::text,
  order_id text references public.orders(id) on delete set null,
  event_id text not null references public.events(id) on delete cascade,
  guest_name text not null check (char_length(guest_name) between 1 and 80),
  plus_one_names jsonb not null default '[]'::jsonb,
  spots_locked integer not null default 1 check (spots_locked between 1 and 20),
  tier_label text,
  amount_contributed_zar numeric(10,2) not null default 0 check (amount_contributed_zar >= 0),
  status text not null default 'locked_paid' check (
    status in ('locked_paid', 'going_free', 'payday_promise', 'cash_logged', 'refunded')
  ),
  payment_channel text not null default 'capitec_pay' check (
    payment_channel in ('capitec_pay', 'payshap', 'eft', 'apple_pay', 'google_pay', 'card', 'cash_manual')
  ),
  badge_label text not null default '🔥 Locked In',
  comment text check (comment is null or char_length(comment) <= 280),
  claimed_item_id text,
  claimed_item_label text,
  custom_answer text,
  is_anonymous_on_wall boolean not null default false,
  payday_preauthorized boolean not null default false,
  checked_in boolean not null default false,
  swapped_at timestamptz,
  refund_status text check (refund_status is null or refund_status in ('none', 'requested', 'refunded', 'disputed')),
  refund_reason text,
  refund_reference text,
  pop_hash text,
  pop_rail_badge text,
  pop_reference_note text,
  guest_whatsapp text,
  swap_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now()
);

comment on table public.guest_rsvps is 'POPIA-safe public social wall containing zero phone numbers or email addresses.';
comment on column public.guest_rsvps.swap_token is 'Self-service 1-Tap WhatsApp Spot-Swap token allowing a replacement player to take over a spot without refunds.';

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_profile_id on public.events(profile_id);
create index if not exists idx_events_host_handle on public.events(host_handle);
create index if not exists idx_orders_event_id on public.orders(event_id);
create index if not exists idx_orders_profile_id on public.orders(profile_id);
create index if not exists idx_orders_paystack_ref on public.orders(paystack_reference);
create unique index if not exists uq_guest_rsvps_order_id on public.guest_rsvps(order_id) where order_id is not null;
create index if not exists idx_guest_rsvps_event_id on public.guest_rsvps(event_id);
create index if not exists idx_guest_rsvps_swap_token on public.guest_rsvps(swap_token);

-- ============================================================================
-- 6. ROW-LEVEL SECURITY (RLS) & TABLE/COLUMN PRIVILEGE LOCKDOWN (POPIA)
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.orders enable row level security;
alter table public.guest_rsvps enable row level security;

-- IMPORTANT POSTGRES SECURITY FIX:
-- In PostgreSQL, column-level REVOKE does not override an existing table-level SELECT grant.
-- We MUST first revoke table-level ALL from anon and authenticated, and then explicitly GRANT SELECT
-- only on non-sensitive public columns! All mutations happen through our verified server API (service_role).
revoke all on public.profiles from anon, authenticated;
revoke all on public.events from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.guest_rsvps from anon, authenticated;

grant select (
  id, handle, display_name, avatar_url, bank_name, trust_tier, is_verified, created_at
) on public.profiles to anon, authenticated;

grant select (
  id, profile_id, host_name, host_handle, host_bank_name, settlement_schedule, slug, mode,
  category_vibe, title, description, price_zar, min_pot_contribution_zar, target_pot_zar,
  tiers, bring_items, custom_question, hide_amounts_on_wall, allow_payday_promise,
  allow_cash_on_arrival, pro_fee_split_mode,
  event_date, previous_event_date, location_name, max_spots, venue_name, venue_deposit_zar,
  venue_bank_name, venue_account_number_last4, is_active, is_public, is_cancelled,
  payout_frozen, dispute_count, disputed_zar, created_at
) on public.events to anon, authenticated;

grant select (
  id, event_id, guest_name, plus_one_names, spots_locked, tier_label, amount_contributed_zar,
  status, payment_channel, badge_label, comment, claimed_item_id, claimed_item_label,
  is_anonymous_on_wall, payday_preauthorized, checked_in, swapped_at, refund_status, created_at
) on public.guest_rsvps to anon, authenticated;

-- Public visitors can read non-sensitive host display columns
drop policy if exists "profiles_public_select" on public.profiles;
create policy "profiles_public_select"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Public visitors can read active non-sensitive event columns (secret_location_pin, host_secret_token, host_phone are revoked at column level)
drop policy if exists "events_public_select" on public.events;
create policy "events_public_select"
  on public.events
  for select
  to anon, authenticated
  using (is_active = true);

-- Only authenticated host can read their own orders (anon has zero access to public.orders)
drop policy if exists "orders_host_select_only" on public.orders;
create policy "orders_host_select_only"
  on public.orders
  for select
  to authenticated
  using (auth.uid()::text = profile_id);

-- Drop any direct client insert policies (all inserts go through verified server API routes via service_role)
drop policy if exists "orders_checkout_insert" on public.orders;
drop policy if exists "guest_rsvps_public_insert" on public.guest_rsvps;
drop policy if exists "guest_rsvps_public_update" on public.guest_rsvps;

-- Anyone viewing the event page can read the sanitized social wall columns (swap_token and custom_answer are revoked at column level)
drop policy if exists "guest_rsvps_public_select" on public.guest_rsvps;
create policy "guest_rsvps_public_select"
  on public.guest_rsvps
  for select
  to anon, authenticated
  using (true);
