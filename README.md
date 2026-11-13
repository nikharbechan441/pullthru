# PullThru — South African Group Event RSVP & Payment-Split Platform

**Live Platform:** [https://pullthru.co.za](https://pullthru.co.za) · **Android Package:** `com.pullthru.za` (Capacitor)

PullThru is a full-stack Next.js and Cloudflare Workers web & mobile application built for South African group events (braais, 5-a-side football, padel, group gift pots, and social events). Hosts create an event roll-call in seconds, accept direct PayShap or card/EFT checkouts, automatically parse and verify Proof-of-Payment (POP) receipts/SMS notifications across major South African banks, and calculate fair cost splits with server-side financial integrity.

---

## Key Engineering Highlights

- **SA Bank Proof-of-Payment (POP) Verification Engine (`src/lib/popEngine.ts`)**
  - Parses transaction notifications across Capitec, FNB, Standard Bank, Nedbank, ABSA, TymeBank, Discovery Bank, and PayShap rails.
  - Detects and blocks non-payment slips (airtime/data purchases, ATM withdrawals, retail POS card swipes, debit orders, incoming deposits, betting vouchers, and social engineering text).
  - Canonical SHA-256 deduplication against slip replay attacks and file validation checks.
- **Deterministic ZAR Fee & Split Engine (`src/lib/fees.ts`)**
  - Integer-cent arithmetic with fractional precision (`R66.67 × 3`), multi-tier rate calculations, free roll-call mode, and POPIA-aware contact normalization.
- **Security & Compliance (`src/lib/compliance.ts`)**
  - AES-256-GCM database column encryption (`sealDbSecret` / `unsealDbSecret`) for sensitive tokens at rest.
  - FICA & settlement velocity caps, bank account format validation, and statutory category screening.
- **Multi-Surface Architecture**
  - Next.js 15 App Router deployed to Cloudflare Workers via `@opennextjs/cloudflare` (`wrangler.jsonc`), paired with Supabase (`@supabase/supabase-js`) and Capacitor 8 (`@capacitor/android`) for native Android delivery (`com.pullthru.za`).

---

## Tech Stack

- **Framework:** Next.js 15 (`next@15.1.7`), React 19, TypeScript 5.7, Tailwind CSS v4
- **Edge & Database:** Cloudflare Workers (`@opennextjs/cloudflare`, Wrangler), Supabase
- **Mobile:** Capacitor 8 Android (`com.pullthru.za`)
- **Testing:** Node.js / `tsx` test runner (`142` passing unit & integration tests across 5 test suites)

---

## Project Structure

```text
├── src/
│   ├── app/                  # App Router pages & API routes (/create, /e/[slug], /split-bill, /braai-calculator, etc.)
│   ├── components/           # UI components & mobile roll-call tabs
│   └── lib/                  # popEngine.ts, fees.ts, compliance.ts, security & crypto helpers
├── tests/                    # 142 tests (popEngine, pullthru, security, shortfall, siteEnhancements)
├── android/                  # Capacitor Android project
├── supabase/                 # Database migrations & schema definitions
├── wrangler.jsonc            # Cloudflare Worker deployment configuration
└── open-next.config.ts       # OpenNext Cloudflare adapter configuration
```

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Copy environment template and configure keys in .env.local
cp .env.example .env.local

# Run the test suite (142 tests across 5 suites)
npm test

# Start development server
npm run dev
```

*(Production secrets, `.env*` files, and Android signing keystores are excluded from version control.)*
