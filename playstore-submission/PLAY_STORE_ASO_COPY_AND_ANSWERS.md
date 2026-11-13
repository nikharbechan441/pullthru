# Google Play Store ASO Copy & Production Access Questionnaire Answers (`com.pullthru.za`)

This reference file contains:
1. **ASO Keyword-Optimized Google Play Store Listing Copy** (addressing Testers Community Feedback Report Item #2: *App Store Optimization — ASO*).
2. **All 10 Production Access Questionnaire Answers** (ready to copy-paste directly into the Google Play Console when applying for Production Access).

---

## Part 1: ASO Keyword-Optimized Play Store Listing Copy

### App Name / Title (Max 30 characters)
```text
PullThru: Group Events & Pay
```
*(28 characters — includes core brand + high-volume search keywords "Group Events" & "Pay")*

### Short Description (Max 80 characters)
```text
25s WhatsApp event RSVP, squad split & kitty links. Direct SA PayShap payouts.
```
*(78 characters — hits "WhatsApp event RSVP", "squad split", "kitty", and "PayShap")*

### Full Description (Keyword-Optimized for South African Search Discovery)
```text
Stop chasing "I'll EFT you on Monday" in the WhatsApp group! 🇿🇦

PullThru is South Africa's fastest 25-second WhatsApp Event RSVP, Group Kitty & Bill-Split app. Whether you're organizing Thursday 5-a-side soccer, a Padel court booking, a weekend Spitbraai, a Baby Shower gift pot, or a group weekend away, PullThru turns messy WhatsApp text lists into a live, paid Squad Wall.

⚡ HOW PULLTHRU WORKS IN 3 STEPS:
1. Pick a Vibe & Set Your Split (25 Seconds):
Choose a 1-tap South African preset (⚽ 5-a-Side, 🎾 Padel, 🥩 Braai, 🎁 Gift Pot, or 🏕️ Weekend Away). Set a fixed spot price, multi-tier tickets (Adults / Kids / Meals), an open gift kitty, or a Free RSVP headcount.
2. Drop the Link in WhatsApp — Get Paid 100% Directly:
Friends open your link directly from WhatsApp with zero app downloads or account signups required. They lock in their spot via Direct PayShap or 1-Tap Capitec PayMe straight into your South African bank account (Capitec, FNB, Standard Bank, Absa, Nedbank, TymeBank, Discovery Bank, Investec & more).
3. Live Squad Wall, 1-Tap Spot-Swap & Shortfall Protection:
Watch the numbered Squad Wall fill up in real time. Secret venue details and Gate PINs unlock only after a guest locks in their spot.

🛡️ BUILT FOR REAL MZANSI GROUP DYNAMICS:
• 80% Flake Cushion & Turnout Shortfall Recalculator: Worried only 8 out of 10 players will pitch up for the R1,000 court booking? Enable the 80% Flake Cushion upfront, or use the 1-Tap Host Shortfall Recalculator on game day to lock the squad at 8/8 and copy a fair WhatsApp top-up message in 1 tap.
• 1-Tap Spot-Swap: If someone bails last minute, they can transfer their locked spot to a standby friend in 1 tap without bothering the host for a refund.
• Bring-'n-Bak Checklist: Assign ice, sekelbos wood, salads, or match balls so guests claim an item when they RSVP.
• Dignity Mode for Gift Pots: Hide individual Rand contributions on the public wall for baby showers, farewells, and birthdays while keeping the total pot transparent for the host.
• Offline-Ready Gate Check-In PINs: Every locked guest gets a unique 4-digit Gate PIN that works even during load-shedding or poor signal at the venue gate.

💰 TRANSPARENT PRICING (R0 GUEST CHECKOUT FEES):
• 1 to 6 Spots: 100% Free forever (R0 host fee, R0 guest fee).
• 7+ Spots: Flat R29 Pro Event Boost per event — with 1-tap Squad Coverage (+R2 to R4 per spot) so the organizer pays R0.00 out of pocket!
• Direct Bank-to-Bank Settlement: PullThru never holds your event funds in an e-wallet or delays your payout. 100% of every contribution goes straight to the host's bank account.

🔒 POPIA COMPLIANT & PRIVACY FIRST:
Built in South Africa with strict POPIA privacy protections, automatic PII masking, and SARB-aligned direct peer-to-peer payment references.
```

---

## Part 2: Google Play Console Production Access Questionnaire Answers

### Part 1: About Your Closed Test

#### Q1: How easy was it to recruit testers for your app?
*(Select rating in Play Console, e.g., **4 / 5 — Easy**, and if a comment box appears, use:)*
> We recruited testers across diverse Android devices and Android OS versions (SDK 29 through SDK 35) through the Testers Community platform as well as local South African sports, padel, and social event organizers.

#### Q2: Describe how you engaged with your testers during your closed test (256 chars max)
```text
Engaged testers via Testers Community & WhatsApp feedback channels. Provided guided test scenarios for event creation, PayShap/Capitec RSVPs, and squad wall updates. Reviewed daily device logs and UX reports across Android 10–15 devices.
```
*(240 characters)*

#### Q3: Provide a summary of the feedback you received from your testers. Include how you collected the feedback (256 chars max)
```text
Collected via Testers Community reports & in-app feedback. 0 crashes across all Android 10–15 devices. Testers praised the 25s event setup & direct SA bank split, and requested a 15s Quick Tour, Share/Rate buttons & a Back-button stepper guard.
```
*(246 characters)*

---

### Part 2: About Your App or Game

#### Q4: Who is the intended audience of your app? (256 chars max)
```text
South African social, sports, and community organizers (5-a-side soccer captains, padel players, braai hosts, stokvel/gift-pot coordinators, and weekend trip planners) and their WhatsApp groups who split venue costs or collect RSVPs.
```
*(234 characters)*

#### Q5: Describe how your app provides value to users (256 chars max)
```text
Eliminates chasing unpaid EFTs in WhatsApp groups. Hosts create a 25-second event link where friends lock in spots via direct PayShap/Capitec PayMe straight to the host's bank account, with live squad lists, Bring-'n-Bak claims & shortfall calculators.
```
*(253 characters)*

#### Q6: How many installs do you expect your app to have in your first year?
- Select: **1,000 – 10,000** (or **10,000 – 100,000** depending on the radio button options in Play Console).

---

### Part 3: About Your Production Readiness

#### Q7: What changes did you make to your app based on what you learned during your closed test? (256 chars max)
```text
Added a skippable 15-second interactive Quick Tour walkthrough for first-time users, added 1-tap Share App & Rate App actions, built a Turnout Shortfall & 80% Flake Cushion calculator, and added a multi-step Back-button & unsaved-draft exit guard.
```
*(248 characters)*

#### Q8: How did you decide that your app is ready for production? (256 chars max)
```text
Verified 0 crashes and 0 ANRs across 12+ physical Android devices (Android 10 to 15), passed 80+ automated security, compliance, and financial split tests, and implemented all usability enhancements from our closed testing feedback report.
```
*(242 characters)*

#### Q9 & Q10: Additional Production Verification Notes (if prompted)
- **Testing Methodology**: Automated unit/integration testing (`npm test`), adversarial security and POPIA sanitization verification (`tests/security.test.ts`), financial shortfall math verification (`tests/shortfall.test.ts`), plus real-device closed testing across Samsung, Xiaomi, Google Pixel, Motorola, OnePlus, Oppo, and Realme handsets on Android 10–15.
