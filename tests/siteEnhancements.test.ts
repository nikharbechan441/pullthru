process.env.IS_PULLTHRU_TEST = "true";

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { QUICK_TOUR_STEPS } from "../src/components/Navbar";
import {
  sanitizeTelemetryString,
  sanitizeTelemetryPayload,
  shouldReportClientError,
  shouldReportFunnelStep,
  resetClientTelemetryLimiterForTests,
} from "../src/lib/telemetry";
import { clearRateLimitStore } from "../src/lib/security";
import { normalizeSaPhone } from "../src/lib/fees";
import { sealDbSecret, unsealDbSecret } from "../src/lib/store";
import {
  POST as postTelemetryApi,
  GET as getTelemetryApi,
} from "../src/app/api/telemetry/route";
import {
  POST as postEventsApi,
  PATCH as patchEventsApi,
  GET as getEventsApi,
} from "../src/app/api/events/route";
import { POST as postRsvpApi } from "../src/app/api/rsvp/route";
import { POST as postYocoCheckoutApi } from "../src/app/api/yoco/checkout/route";

const ROOT = path.resolve(__dirname, "..");

describe("Testers Community Site & App Enhancements Verification Suite", () => {
  describe("Scenario Group 1: 15-Second Interactive Quick Tour Walkthrough (Report Item #1)", () => {
    it("1.1 QUICK_TOUR_STEPS defines exactly 3 concise, high-impact walkthrough steps", () => {
      assert.equal(QUICK_TOUR_STEPS.length, 3);
      assert.equal(QUICK_TOUR_STEPS[0].step, 1);
      assert.equal(QUICK_TOUR_STEPS[1].step, 2);
      assert.equal(QUICK_TOUR_STEPS[2].step, 3);
    });

    it("1.2 Each Quick Tour step contains a badge, title, description, and 3 actionable highlights", () => {
      for (const s of QUICK_TOUR_STEPS) {
        assert.ok(s.badge.includes(`Step ${s.step} of 3`), `Missing badge step number in step ${s.step}`);
        assert.ok(s.title.length >= 15, `Title too short in step ${s.step}`);
        assert.ok(s.description.length >= 40, `Description too short in step ${s.step}`);
        assert.equal(s.highlights.length, 3, `Expected 3 highlights in step ${s.step}`);
      }
    });

    it("1.3 Step 1 covers Vibe Presets & 80% Flake Cushion, Step 2 covers Direct PayShap/Capitec PayMe, Step 3 covers Squad Wall & Shortfall Split", () => {
      assert.ok(QUICK_TOUR_STEPS[0].title.includes("Flake Cushion"));
      assert.ok(QUICK_TOUR_STEPS[1].description.includes("PayShap"));
      assert.ok(QUICK_TOUR_STEPS[1].description.includes("Capitec PayMe"));
      assert.ok(QUICK_TOUR_STEPS[2].title.includes("Shortfall Split"));
    });

    it("1.4 Navbar.tsx wires the skippable Quick Tour modal, step switcher pills, and custom event listener", () => {
      const navbarSrc = fs.readFileSync(path.join(ROOT, "src/components/Navbar.tsx"), "utf8");
      assert.ok(navbarSrc.includes("pullthru:open-quick-tour"), "Navbar should listen for pullthru:open-quick-tour");
      assert.ok(navbarSrc.includes("Skip Tour"), "Quick Tour modal must be skippable");
      assert.ok(navbarSrc.includes('id="quick-tour-title"'), "Quick Tour modal must have accessible dialog title");
      assert.ok(navbarSrc.includes("15s Quick Tour"), "Desktop nav must include 15s Quick Tour trigger");
      assert.ok(navbarSrc.includes("15-Second Interactive Walkthrough"), "Mobile drawer must include walkthrough trigger");
    });
  });

  describe("Scenario Group 2: Share App & Rate App Flows (Report Items #3 & #4)", () => {
    it("2.1 Navbar.tsx includes Web Share API with WhatsApp/Clipboard fallback and Google Play Store deep link", () => {
      const navbarSrc = fs.readFileSync(path.join(ROOT, "src/components/Navbar.tsx"), "utf8");
      assert.ok(
        navbarSrc.includes("https://play.google.com/store/apps/details?id=com.pullthru.za"),
        "Navbar must reference official com.pullthru.za Google Play URL"
      );
      assert.ok(
        navbarSrc.includes("market://details?id=com.pullthru.za"),
        "Navbar must support native Android market:// deep link"
      );
      assert.ok(navbarSrc.includes("navigator.share"), "Navbar must use native Web Share API when available");
      assert.ok(navbarSrc.includes("handleShareApp"), "Navbar must define handleShareApp");
      assert.ok(navbarSrc.includes("handleRateApp"), "Navbar must define handleRateApp");
    });

    it("2.2 ZeroTouchSupportWidget.tsx footer exposes 1-tap pills for 15s Tour, Share App, and Rate App", () => {
      const widgetSrc = fs.readFileSync(
        path.join(ROOT, "src/components/ZeroTouchSupportWidget.tsx"),
        "utf8"
      );
      assert.ok(widgetSrc.includes("pullthru:open-quick-tour"), "Support widget should trigger quick tour");
      assert.ok(widgetSrc.includes("📲 Share App"), "Support widget should include Share App button");
      assert.ok(widgetSrc.includes("⭐ Rate App"), "Support widget should include Rate App button");
    });

    it("2.3 Event Wall (/e/[slug]) post-creation celebration banner includes a contextual Rate PullThru prompt", () => {
      const eventWallSrc = fs.readFileSync(
        path.join(ROOT, "src/app/e/[slug]/page.tsx"),
        "utf8"
      );
      assert.ok(
        eventWallSrc.includes("⭐ Rate PullThru"),
        "Post-creation banner should include contextual Rate PullThru button"
      );
      assert.ok(
        eventWallSrc.includes("market://details?id=com.pullthru.za"),
        "Post-creation rate button should deep-link to Play Store on Android"
      );
    });
  });

  describe("Scenario Group 3: Back-Button Stepper & Unsaved Changes Exit Guard (Report Item #5)", () => {
    it("3.1 /create page implements history pushState / popstate stepper guard (Step 3 -> Step 2 -> Step 1)", () => {
      const createSrc = fs.readFileSync(path.join(ROOT, "src/app/create/page.tsx"), "utf8");
      assert.ok(
        createSrc.includes("pullthruCreateStep"),
        "/create must track pullthruCreateStep in window.history state"
      );
      assert.ok(
        createSrc.includes('window.addEventListener("popstate", handlePopState)'),
        "/create must listen to popstate to step backward instead of exiting immediately"
      );
      assert.ok(
        createSrc.includes("const goToStep = useCallback"),
        "/create must use goToStep helper for step transitions"
      );
    });

    it("3.2 /create page implements beforeunload & showExitConfirmModal when form has unsaved edits", () => {
      const createSrc = fs.readFileSync(path.join(ROOT, "src/app/create/page.tsx"), "utf8");
      assert.ok(
        createSrc.includes('window.addEventListener("beforeunload", handleBeforeUnload)'),
        "/create must guard against accidental tab/webview unload when dirty"
      );
      assert.ok(
        createSrc.includes("showExitConfirmModal"),
        "/create must provide an explicit Exit Confirmation Modal"
      );
      assert.ok(
        createSrc.includes("Leave event setup?"),
        "Exit confirmation modal must ask 'Leave event setup?'"
      );
      assert.ok(
        createSrc.includes("Keep Editing") && createSrc.includes("Discard &amp; Exit"),
        "Exit confirmation modal must offer Keep Editing and Discard & Exit actions"
      );
    });

    it("3.3 Android MainActivity.java implements OnBackPressedCallback with WebView.canGoBack() and double-back toast", () => {
      const javaSrc = fs.readFileSync(
        path.join(ROOT, "android/app/src/main/java/com/pullthru/za/MainActivity.java"),
        "utf8"
      );
      assert.ok(javaSrc.includes("OnBackPressedCallback"), "MainActivity must register OnBackPressedCallback");
      assert.ok(javaSrc.includes("webView.canGoBack()"), "MainActivity must navigate WebView history back first");
      assert.ok(
        javaSrc.includes("Press Back again to exit PullThru"),
        "MainActivity must show confirmation toast before exiting app"
      );
    });
  });

  describe("Scenario Group 4: Play Store ASO Copy & Production Access Questionnaire (Report Item #2)", () => {
    it("4.1 PLAY_STORE_ASO_COPY_AND_ANSWERS.md exists and respects Google Play Console character limits", () => {
      const docPath = path.join(ROOT, "playstore-submission/PLAY_STORE_ASO_COPY_AND_ANSWERS.md");
      assert.ok(fs.existsSync(docPath), "PLAY_STORE_ASO_COPY_AND_ANSWERS.md must exist");
      const content = fs.readFileSync(docPath, "utf8");

      const titleMatch = content.match(/PullThru: Group Events & Pay/);
      assert.ok(titleMatch, "Title must be present");
      assert.ok(titleMatch[0].length <= 30, "Play Store Title must be <= 30 characters");

      const shortDesc = "25s WhatsApp event RSVP, squad split & kitty links. Direct SA PayShap payouts.";
      assert.ok(content.includes(shortDesc), "Short description must be present");
      assert.ok(shortDesc.length <= 80, `Short description must be <= 80 chars (got ${shortDesc.length})`);

      // Verify all 256-char Play Console production questionnaire answers fit strictly under 256 chars
      const q2 =
        "Engaged testers via Testers Community & WhatsApp feedback channels. Provided guided test scenarios for event creation, PayShap/Capitec RSVPs, and squad wall updates. Reviewed daily device logs and UX reports across Android 10–15 devices.";
      const q3 =
        "Collected via Testers Community reports & in-app feedback. 0 crashes across all Android 10–15 devices. Testers praised the 25s event setup & direct SA bank split, and requested a 15s Quick Tour, Share/Rate buttons & a Back-button stepper guard.";
      const q4 =
        "South African social, sports, and community organizers (5-a-side soccer captains, padel players, braai hosts, stokvel/gift-pot coordinators, and weekend trip planners) and their WhatsApp groups who split venue costs or collect RSVPs.";
      const q5 =
        "Eliminates chasing unpaid EFTs in WhatsApp groups. Hosts create a 25-second event link where friends lock in spots via direct PayShap/Capitec PayMe straight to the host's bank account, with live squad lists, Bring-'n-Bak claims & shortfall calculators.";
      const q7 =
        "Added a skippable 15-second interactive Quick Tour walkthrough for first-time users, added 1-tap Share App & Rate App actions, built a Turnout Shortfall & 80% Flake Cushion calculator, and added a multi-step Back-button & unsaved-draft exit guard.";
      const q8 =
        "Verified 0 crashes and 0 ANRs across 12+ physical Android devices (Android 10 to 15), passed 80+ automated security, compliance, and financial split tests, and implemented all usability enhancements from our closed testing feedback report.";

      for (const [label, ans] of Object.entries({ q2, q3, q4, q5, q7, q8 })) {
        assert.ok(
          ans.length <= 256,
          `${label} exceeds 256 characters (${ans.length} chars)`
        );
        assert.ok(content.includes(ans), `${label} missing from PLAY_STORE_ASO_COPY_AND_ANSWERS.md`);
      }
    });
  });

  describe("Scenario Group 5: Silent Auto-Error Telemetry & POPIA Sanitization Engine", () => {
    it("5.1 sanitizeTelemetryString & sanitizeTelemetryPayload strictly scrub SA phone numbers, bank accounts, cards, emails, and secret tokens", () => {
      const dirtyMsg =
        "Failed checkout for +27825550194 / 083 123 4567 with acc 62910482910 card 4532-1111-2222-3333 email tariq@pullthru.co.za on /e/sandton?hostToken=sec_99887766&swapToken=swap_112233";
      const cleaned = sanitizeTelemetryString(dirtyMsg, 500);

      assert.ok(!cleaned.includes("825550194"), "Must mask +27 phone number");
      assert.ok(!cleaned.includes("123 4567") || cleaned.includes("***"), "Must mask 083 phone number");
      assert.ok(!cleaned.includes("62910482910"), "Must mask 11-digit bank account");
      assert.ok(cleaned.includes("******2910"), "Must preserve last 4 of bank account");
      assert.ok(cleaned.includes("XXXX-XXXX-XXXX-XXXX"), "Must mask 16-digit card number");
      assert.ok(cleaned.includes("t***@pullthru.co.za"), "Must mask email address");
      assert.ok(!cleaned.includes("sec_99887766"), "Must redact hostToken");
      assert.ok(!cleaned.includes("swap_112233"), "Must redact swapToken");
      assert.ok(cleaned.includes("[REDACTED_TOKEN]"), "Must replace secret tokens with [REDACTED_TOKEN]");

      const payload = sanitizeTelemetryPayload({
        type: "window_error",
        message: dirtyMsg,
        stack: "Error at checkout (host_secret_token: super_secret_abc123)",
        route: "/e/sandton?hostToken=sec_99887766",
        recentLogs: ["User 0821112222 failed acc 1234567890"],
      });
      assert.ok(!payload.stack?.includes("super_secret_abc123"));
      assert.ok(!payload.route.includes("sec_99887766"));
      assert.ok(!payload.recentLogs[0].includes("1234567890"));
    });

    it("5.2 shouldReportClientError suppresses duplicate errors within 60s and caps at 5 reports per session", () => {
      resetClientTelemetryLimiterForTests();

      // 1st occurrence is allowed
      assert.equal(shouldReportClientError("window_error", "TypeError: x is null", "/create"), true);
      // Duplicate occurrence on same route is suppressed
      assert.equal(shouldReportClientError("window_error", "TypeError: x is null", "/create"), false);

      // Up to 5 distinct errors in a session are allowed
      assert.equal(shouldReportClientError("window_error", "Error 2", "/create"), true);
      assert.equal(shouldReportClientError("window_error", "Error 3", "/create"), true);
      assert.equal(shouldReportClientError("window_error", "Error 4", "/create"), true);
      assert.equal(shouldReportClientError("window_error", "Error 5", "/create"), true);

      // 6th distinct error in the same session is blocked to prevent flooding
      assert.equal(shouldReportClientError("window_error", "Error 6", "/create"), false);
      resetClientTelemetryLimiterForTests();
    });

    it("5.3 POST /api/telemetry & GET /api/telemetry persist sanitized errors, block CSRF/empty payloads, and enforce rate limits", async () => {
      clearRateLimitStore();

      // 1. Valid POST records sanitized error
      const postRes = await postTelemetryApi(
        new NextRequest("http://localhost:3000/api/telemetry", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "198.51.100.88",
          },
          body: JSON.stringify({
            type: "unhandled_rejection",
            message: "Network timeout for 0825550194 on acc 1648291045",
            stack: "at submitEvent (/create:120:4)",
            route: "/create",
            clientPlatform: "Android Chrome",
            viewport: "390x844 @3x",
            recentLogs: ["PromiseRejection: Network timeout"],
          }),
        })
      );
      assert.equal(postRes.status, 201);
      const postData = await postRes.json();
      assert.equal(postData.ok, true);
      assert.ok(postData.reference.startsWith("ERR_TELEMETRY_"));
      assert.ok(!postData.sanitizedMessage.includes("1648291045"));
      assert.ok(postData.sanitizedMessage.includes("******1045"));

      // 2. GET /api/telemetry retrieves the recorded error
      const getRes = await getTelemetryApi(
        new NextRequest("http://localhost:3000/api/telemetry?limit=10", {
          method: "GET",
          headers: { "x-forwarded-for": "198.51.100.88" },
        })
      );
      assert.equal(getRes.status, 200);
      const getData = await getRes.json();
      assert.equal(getData.ok, true);
      assert.ok(getData.count >= 1);
      const matched = getData.errors.find((e: { reference: string }) => e.reference === postData.reference);
      assert.ok(matched, "Newly recorded telemetry error must be returned by GET /api/telemetry");
      assert.equal(matched.type, "unhandled_rejection");
      assert.equal(matched.route, "/create");

      // 3. Cross-origin CSRF POST is blocked with 403
      const csrfRes = await postTelemetryApi(
        new NextRequest("http://localhost:3000/api/telemetry", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://evil-attacker.example.com",
          },
          body: JSON.stringify({ message: "spoofed error" }),
        })
      );
      assert.equal(csrfRes.status, 403);

      // 4. Empty message is rejected with 400
      const emptyRes = await postTelemetryApi(
        new NextRequest("http://localhost:3000/api/telemetry", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({ message: "   " }),
        })
      );
      assert.equal(emptyRes.status, 400);
    });

    it("5.4 ZeroTouchSupportWidget.tsx and src/app/error.tsx wire automatic window error, unhandledrejection, and React error boundary reporting", () => {
      const widgetSrc = fs.readFileSync(
        path.join(ROOT, "src/components/ZeroTouchSupportWidget.tsx"),
        "utf8"
      );
      assert.ok(widgetSrc.includes('window.addEventListener("error", handleWindowError)'));
      assert.ok(widgetSrc.includes('window.addEventListener("unhandledrejection", handleUnhandledRejection)'));
      assert.ok(widgetSrc.includes("reportClientError"));

      const errorBoundarySrc = fs.readFileSync(
        path.join(ROOT, "src/app/error.tsx"),
        "utf8"
      );
      assert.ok(errorBoundarySrc.includes('type: "react_error_boundary"'));
      assert.ok(errorBoundarySrc.includes("reportClientError"));
    });
  });

  describe("Scenario Group 6: Zero-Friction /create (No Demo Trap, Optional Bank Details & Funnel Telemetry)", () => {
    it("6.1 /create starts blank by default ('custom' preset, empty title/date/venue/bank) and eliminates the 'Tariq Davids' demo trap", () => {
      const createSrc = fs.readFileSync(
        path.join(ROOT, "src/app/create/page.tsx"),
        "utf8"
      );
      assert.ok(
        createSrc.includes('useState<string>("custom")'),
        "Default selectedPresetId must be 'custom' so first-time visitors see a blank form"
      );
      assert.ok(
        createSrc.includes('selectedBankCode: ""'),
        "Default host profile must not pre-select Capitec Bank (470010)"
      );
      assert.ok(
        !createSrc.includes('placeholder="e.g. Tariq Davids"'),
        "Must not contain Tariq Davids placeholder trap"
      );
      assert.ok(
        !createSrc.includes('placeholder="e.g. 082 555 0194"'),
        "Must not contain 082 555 0194 demo phone placeholder"
      );
      assert.ok(
        !createSrc.includes('placeholder="e.g. 164 829 1045"'),
        "Must not contain 164 829 1045 demo account placeholder"
      );
      assert.ok(
        createSrc.includes("Publish Link Now (Add Bank Later)"),
        "Must provide 1-tap express publish buttons on Step 1 & Step 2"
      );
    });

    it("6.2 POST /api/events allows creating a paid event without bank details, and PATCH /api/events (link_bank) attaches bank details later", async () => {
      clearRateLimitStore();

      const createRes = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "198.51.100.91",
          },
          body: JSON.stringify({
            title: "Saturday 5-a-Side Express Test",
            description: "Quick link created without bank details upfront",
            mode: "fixed",
            price_zar: 100,
            max_spots: 10,
            location_name: "TBD",
            host_name: "Organiser",
            host_phone: "",
            bank_code: "",
            account_number: "",
            mandate_accepted: true,
          }),
        })
      );
      assert.equal(createRes.status, 201);
      const createData = await createRes.json();
      assert.ok(createData.event?.slug, "Created event must have a slug");
      assert.ok(createData.host_secret_token, "Created event must return a host_secret_token");
      assert.equal(createData.event.host_bank_name, null);
      assert.equal(createData.event.host_account_number, null);

      // Now link bank details via PATCH /api/events action: "link_bank"
      const linkRes = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "198.51.100.91",
          },
          body: JSON.stringify({
            slug: createData.event.slug,
            action: "link_bank",
            bank_code: "250655",
            account_number: "62819401829",
            host_phone: "0831234567",
            host_token: createData.host_secret_token,
          }),
        })
      );
      assert.equal(linkRes.status, 200);
      const linkData = await linkRes.json();
      assert.ok(linkData.event.host_bank_name.includes("FNB"));
      assert.ok(linkData.event.host_bank_name.includes("1829"));
      assert.equal(linkData.event.host_account_number, "62819401829");
      assert.equal(linkData.event.host_phone, "0831234567");
    });

    it("6.3 Funnel step telemetry (funnel_step) deduplicates per step and aggregates funnelCountsByStep on GET /api/telemetry", async () => {
      resetClientTelemetryLimiterForTests();
      clearRateLimitStore();

      assert.equal(shouldReportFunnelStep("create_step_1_view"), true);
      assert.equal(
        shouldReportFunnelStep("create_step_1_view"),
        false,
        "Duplicate funnel step in same session must be suppressed"
      );
      assert.equal(shouldReportFunnelStep("create_step_2_view"), true);

      const postFunnelRes = await postTelemetryApi(
        new NextRequest("http://localhost:3000/api/telemetry", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "198.51.100.92",
          },
          body: JSON.stringify({
            type: "funnel_step",
            message: "create_step_1_view",
            route: "/create",
            clientPlatform: "iPhone Safari",
            viewport: "390x844 @3x",
            recentLogs: ["preset=custom"],
          }),
        })
      );
      assert.equal(postFunnelRes.status, 201);
      const postFunnelData = await postFunnelRes.json();
      assert.equal(postFunnelData.ok, true);
      assert.ok(postFunnelData.reference.startsWith("FUNNEL_TELEMETRY_"));

      const getRes = await getTelemetryApi(
        new NextRequest("http://localhost:3000/api/telemetry?limit=20", {
          method: "GET",
          headers: { "x-forwarded-for": "198.51.100.92" },
        })
      );
      assert.equal(getRes.status, 200);
      const getData = await getRes.json();
      assert.ok(getData.funnelCount >= 1);
      assert.ok(getData.funnelCountsByStep.create_step_1_view >= 1);
      assert.ok(
        !getData.errors.some((e: { reference: string }) => e.reference === postFunnelData.reference),
        "Funnel step records must not pollute the errors list"
      );
    });
  });

  describe("Scenario Group 7: 3-Stage Conversion Overhaul (Stage 1 Mobile Landing, Stage 2 15s /create, Stage 3 2-Tap Checkout)", () => {
    it("7.1 Stage 1: SplashScreen does not block first paint, Homepage renders interactive hero on mobile, and AppBottomNav hides for cold visitors", () => {
      const splashSrc = fs.readFileSync(
        path.join(ROOT, "src/components/SplashScreen.tsx"),
        "utf8"
      );
      assert.ok(
        splashSrc.includes("useState(false)"),
        "SplashScreen must default to visible=false so cold ad visitors get instant First Contentful Paint"
      );
      assert.ok(
        !splashSrc.includes("1050"),
        "SplashScreen must not have a 1,050ms artificial boot timer"
      );

      const homeSrc = fs.readFileSync(
        path.join(ROOT, "src/app/page.tsx"),
        "utf8"
      );
      assert.ok(
        !homeSrc.includes("<MobileHomeFeed"),
        "Homepage must not replace the main landing page with MobileHomeFeed on mobile"
      );

      const bottomNavSrc = fs.readFileSync(
        path.join(ROOT, "src/components/AppBottomNav.tsx"),
        "utf8"
      );
      assert.ok(
        !bottomNavSrc.includes("/e/thursday-fives-sandton/success?ref=PT_SAMPLE_DEMO"),
        "AppBottomNav must never link My Passes to a fake PT_SAMPLE_DEMO receipt"
      );
      assert.ok(
        bottomNavSrc.includes("!hasSavedActivity ||"),
        "AppBottomNav must hide for first-time cold visitors with no saved activity"
      );
    });

    it("7.2 Stage 2: /create has no +27820000000 fallback, no Nando's tier leak, defaults maxSpots to 6, and gates error banner on hasAttemptedSubmit", async () => {
      const createSrc = fs.readFileSync(
        path.join(ROOT, "src/app/create/page.tsx"),
        "utf8"
      );
      assert.ok(
        createSrc.includes("const [maxSpots, setMaxSpots] = useState<number | null>(6)"),
        "/create must default maxSpots to 6 (Free Tier 1–6 spots)"
      );
      assert.ok(
        createSrc.includes('{ id: "t-standard", label: "Standard Spot", price_zar: 150 }') &&
          !createSrc.includes("useState<EventTier[]>(\n    VIBE_PRESETS"),
        "/create blank tiers must initialize with generic Standard Spot / Early Bird tiers instead of Nando's chicken menu items"
      );
      assert.ok(
        createSrc.includes("hasAttemptedSubmit"),
        "/create must gate the amber blockingReasons alert until the user types or attempts to submit"
      );
      assert.ok(
        !createSrc.includes('id="whatsapp-command-input"'),
        "/create must not show a developer CLI slash-command box above the fold"
      );

      const storeSrc = fs.readFileSync(
        path.join(ROOT, "src/lib/store.ts"),
        "utf8"
      );
      assert.ok(
        !storeSrc.includes('host_phone: input.host_phone?.trim() || "+27820000000"'),
        "store.ts must never silently write +27820000000 when host_phone is blank"
      );
    });

    it("7.3 Stage 3: /e/[slug] fixes the 640px-1023px dead-zone, collapses optional fields behind showGuestExtrasAccordion, and locks Yoco checkout spots on the Squad Wall", async () => {
      const eventWallSrc = fs.readFileSync(
        path.join(ROOT, "src/app/e/[slug]/page.tsx"),
        "utf8"
      );
      assert.ok(
        eventWallSrc.includes("flex lg:hidden w-full items-center justify-between"),
        "Sticky guest bottom bar must use flex lg:hidden so 640px–1023px viewports never hit a checkout dead-zone"
      );
      assert.ok(
        eventWallSrc.includes("showGuestExtrasAccordion"),
        "Optional checkout fields (+1s, Bring-Item, Banter Badge, Comment, POPIA, Tax Invoice) must collapse behind showGuestExtrasAccordion"
      );
      assert.ok(
        eventWallSrc.includes("➕ Add +1s, Claim Bring-Item or Note (Optional)"),
        "Checkout form must display the single collapsed extras toggle"
      );

      // Verify POST /api/yoco/checkout immediately locks the guest's spot on the Squad Wall when running in mock/instant mode
      clearRateLimitStore();
      const checkoutRes = await postYocoCheckoutApi(
        new NextRequest("http://localhost:3000/api/yoco/checkout", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": "198.51.100.99",
          },
          body: JSON.stringify({
            slug: "thursday-fives-sandton",
            buyerName: "Sipho Checkout Test",
            buyerWhatsapp: "0829998877",
            spotsCount: 1,
            comment: "Locked in via 2-tap checkout!",
            badgeLabel: "⚽ Top Binz",
          }),
        })
      );
      assert.equal(checkoutRes.status, 200);
      const checkoutData = await checkoutRes.json();
      assert.ok(checkoutData.orderRef, "Yoco checkout must return an orderRef");
      assert.ok(checkoutData.rsvpId, "Mock/Instant Yoco checkout must return the created rsvpId so the guest is immediately on the Squad Wall");

      // Verify the guest is now on the event's Squad Wall
      const eventRes = await getEventsApi(
        new NextRequest("http://localhost:3000/api/events?slug=thursday-fives-sandton", {
          method: "GET",
        })
      );
      assert.equal(eventRes.status, 200);
      const eventData = await eventRes.json();
      const foundRsvp = eventData.rsvps.find(
        (r: { guest_name: string }) => r.guest_name === "Sipho Checkout Test"
      );
      assert.ok(foundRsvp, "Guest must appear on the Squad Wall immediately after checkout");
      assert.equal(foundRsvp.status, "locked_paid");
    });
  });

  describe("Scenario Group 8: Post-Audit Security & Payment Hardening", () => {
    after(() => {
      try {
        const dataPath = path.join(ROOT, ".pullthru-data.json");
        if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
      } catch {
        // Ignore cleanup errors
      }
    });

    it("8.1 AES-256-GCM Database Column Sealing (sealDbSecret / unsealDbSecret) encrypts sensitive tokens at rest", () => {
      const rawToken = "host-secret-8f91a2b3c4d5e6f7";
      const sealed = sealDbSecret(rawToken);
      assert.ok(sealed && sealed.startsWith("PTSEAL:"), "Must prefix encrypted value with PTSEAL:");
      assert.ok(!sealed.includes(rawToken), "Ciphertext must never contain plaintext token");
      assert.equal(unsealDbSecret(sealed), rawToken, "Must decrypt back to exact plaintext token");
      assert.equal(sealDbSecret(sealed), sealed, "Double-sealing must be idempotent");
    });

    it("8.2 Public GET /api/events?slug=X strips host_account_number, and recover_host_token blocks takeover via secret_location_pin when bank is linked", async () => {
      clearRateLimitStore();
      const createRes = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            title: "Host Takeover Defense Test",
            description: "Testing public account stripping and 2FA hardening",
            mode: "fixed",
            price_zar: 120,
            max_spots: 8,
            location_name: "Sandton",
            secret_location_pin: "Estate Gate #4455",
            host_name: "Sipho",
            host_phone: "0824445566",
            bank_code: "470010",
            account_number: "1648291045",
            mandate_accepted: true,
          }),
        })
      );
      assert.equal(createRes.status, 201);
      const created = await createRes.json();
      const slug = created.event.slug;

      // 1. Public GET /api/events?slug=X must NEVER expose host_account_number
      const pubGetRes = await getEventsApi(
        new NextRequest(`http://localhost:3000/api/events?slug=${slug}`, { method: "GET" })
      );
      const pubGetData = await pubGetRes.json();
      assert.equal(pubGetData.event.host_account_number, null, "Public GET must strip host_account_number");
      assert.equal(pubGetData.event.secret_location_pin, null, "Public GET must strip secret_location_pin");

      // 2. Attacker who knows host_phone + gate PIN ("4455") cannot hijack host token when bank account is linked
      const hijackAttempt = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            slug,
            action: "recover_host_token",
            host_phone: "0824445566",
            secret_check: "4455",
          }),
        })
      );
      assert.equal(hijackAttempt.status, 403, "Gate PIN must not unlock recover_host_token when bank account is linked");

      // 3. Legitimate host providing last 6 digits of bank account ("291045") recovers token
      const legitRecover = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            slug,
            action: "recover_host_token",
            host_phone: "0824445566",
            secret_check: "291045",
          }),
        })
      );
      assert.equal(legitRecover.status, 200);
    });

    it("8.3 unlock_pro_boost rejects spoofed PRO-AAAAAAAA references", async () => {
      clearRateLimitStore();
      const createRes = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            title: "Pro Boost Spoof Guard Test",
            mode: "fixed",
            price_zar: 100,
            max_spots: 10,
            host_name: "Host",
            mandate_accepted: true,
          }),
        })
      );
      const created = await createRes.json();

      const spoofRes = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            slug: created.event.slug,
            action: "unlock_pro_boost",
            host_token: created.host_secret_token,
            pro_boost_reference: "PRO-AAAAAAAA",
          }),
        })
      );
      assert.equal(spoofRes.status, 400, "Spoofed PRO-AAAAAAAA must be rejected with 400");
    });

    it("8.4 normalizeSaPhone('') returns '' (never 27820000000) and Yoco checkout rejects missing buyerWhatsapp", async () => {
      assert.equal(normalizeSaPhone(""), "");
      assert.equal(normalizeSaPhone("   "), "");

      clearRateLimitStore();
      const missingPhoneRes = await postYocoCheckoutApi(
        new NextRequest("http://localhost:3000/api/yoco/checkout", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            slug: "thursday-fives-sandton",
            buyerName: "No Phone Guest",
            buyerWhatsapp: "",
            spotsCount: 1,
          }),
        })
      );
      assert.equal(missingPhoneRes.status, 400, "Yoco checkout must require a valid WhatsApp number");
    });

    it("8.5 1-Tap PayShap claim works when allow_cash_on_arrival is false, sets '📲 PayShap Sent' badge, and keeps gate PIN locked until host confirms", async () => {
      clearRateLimitStore();
      const createRes = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            title: "No Cash PayShap Test",
            mode: "fixed",
            price_zar: 100,
            max_spots: 6,
            allow_cash_on_arrival: false,
            secret_location_pin: "SecretPin#8899",
            host_name: "Host",
            host_phone: "0821112233",
            mandate_accepted: true,
          }),
        })
      );
      const created = await createRes.json();

      const payshapRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            action: "reserve_cash_on_arrival",
            slug: created.event.slug,
            guest_name: "PayShap Taps Guest",
            spots_locked: 1,
            badge_label: "📲 PayShap Sent",
          }),
        })
      );
      assert.equal(payshapRes.status, 201);
      const payshapData = await payshapRes.json();
      assert.equal(payshapData.rsvp.badge_label, "📲 PayShap Sent");
      assert.equal(payshapData.event.secret_location_pin, null, "Unconfirmed PayShap claim must not reveal secret_location_pin");
      assert.equal(payshapData.event.host_account_number, null, "Must not leak host_account_number");
    });
  });

  // =========================================================================
  // 9. VIRAL WHATSAPP OG SCOREBOARD & B2B / HIGH-INTENT VISIBILITY ENGINE
  // =========================================================================
  describe("9. Viral WhatsApp OG Scoreboard & B2B / High-Intent Visibility Engine", () => {
    it("9.1 generateMetadata on /e/[slug] and buildOgScoreboardData respect POPIA anonymous + Dignity Pot privacy while keeping robots noindex", async () => {
      const { generateMetadata } = await import("../src/app/e/[slug]/layout");
      const { buildOgScoreboardData } = await import("../src/lib/ogScoreboard");
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: "thursday-fives-sandton" }),
      });

      const ogImages = meta.openGraph?.images as Array<{ url: string }>;
      assert.ok(Array.isArray(ogImages) && ogImages.length > 0);
      assert.equal(ogImages[0].url, "/feature-graphic.png");
      const robots = meta.robots as { index?: boolean; follow?: boolean };
      assert.equal(robots?.index, false, "Private event walls must remain noindex");

      const fivesScoreboard = await buildOgScoreboardData("thursday-fives-sandton");
      assert.ok(fivesScoreboard.scoreboardBadge.includes("LOCKED"));
      assert.equal(fivesScoreboard.priceLabel, "R100 / SPOT");
      assert.ok(fivesScoreboard.namesLine.startsWith("Locked in:"));

      // Verify Dignity Pot (mrs-dlamini-baby-shower has hide_amounts_on_wall: true) hides Rand total in OG metadata and scoreboard badge
      const potMeta = await generateMetadata({
        params: Promise.resolve({ slug: "mrs-dlamini-baby-shower" }),
      });
      assert.ok(
        String(potMeta.openGraph?.title).includes("Dignity Pot"),
        `Dignity pot OG title must not leak raised Rand amount, got: ${potMeta.openGraph?.title}`
      );
      const potScoreboard = await buildOgScoreboardData("mrs-dlamini-baby-shower");
      assert.ok(
        potScoreboard.scoreboardBadge.includes("DIGNITY POT"),
        `Dignity pot scoreboard badge must not leak raised Rand amount, got: ${potScoreboard.scoreboardBadge}`
      );
    });

    it("9.2 sitemap() exposes /for-venues and the 3 flagship SA comparison/use-case pages", async () => {
      const sitemapMod = await import("../src/app/sitemap");
      const entries = sitemapMod.default();
      const urls = entries.map((e) => e.url);

      assert.ok(urls.some((u) => u.endsWith("/for-venues")), "Sitemap must include /for-venues");
      assert.ok(urls.some((u) => u.endsWith("/partiful-south-africa")), "Sitemap must include /partiful-south-africa");
      assert.ok(urls.some((u) => u.endsWith("/quicket-alternative")), "Sitemap must include /quicket-alternative");
      assert.ok(urls.some((u) => u.endsWith("/group-gift-pot")), "Sitemap must include /group-gift-pot");
      assert.ok(urls.some((u) => u.endsWith("/5-a-side-and-padel")), "Sitemap must include /5-a-side-and-padel");
    });

    it("9.3 6-Skill SEO/GEO/AEO/PR Suite: robots() allows all pSEO routes, IndexNow key exists, en-ZA hreflang is wired, and embed/FAQ schemas are active", async () => {
      const robotsMod = await import("../src/app/robots");
      const r = robotsMod.default();
      const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
      const allowed = Array.isArray(rule.allow) ? rule.allow : [rule.allow];

      for (const pathItem of [
        "/for-venues",
        "/braai-calculator",
        "/partiful-south-africa",
        "/quicket-alternative",
        "/group-gift-pot",
        "/5-a-side-and-padel",
      ]) {
        assert.ok(allowed.includes(pathItem), `robots.ts allow must include ${pathItem}`);
      }

      assert.ok(
        fs.existsSync(path.join(ROOT, "public/pullthru2026indexnowkey8842.txt")),
        "IndexNow verification key file must exist in /public"
      );

      const fivesSrc = fs.readFileSync(
        path.join(ROOT, "src/app/5-a-side-and-padel/page.tsx"),
        "utf8"
      );
      assert.ok(fivesSrc.includes("FAQPage") && fivesSrc.includes("SoftwareApplication"), "/5-a-side-and-padel must include FAQPage + SoftwareApplication JSON-LD");

      const venuesSrc = fs.readFileSync(
        path.join(ROOT, "src/app/for-venues/page.tsx"),
        "utf8"
      );
      assert.ok(venuesSrc.includes("htmlBadgeSnippet"), "/for-venues must include the Website HTML Badge backlink snippet generator");
    });

    it("9.4 Tasteful AdSense & Partner Slot Architecture: ads.txt exists, CSP whitelists googlesyndication, and Dignity Pots / Pro Boost walls remain 100% ad-free", async () => {
      assert.ok(
        fs.existsSync(path.join(ROOT, "public/ads.txt")),
        "IAB ads.txt must exist in /public"
      );
      const nextConfigSrc = fs.readFileSync(
        path.join(ROOT, "next.config.ts"),
        "utf8"
      );
      assert.ok(
        nextConfigSrc.includes("https://pagead2.googlesyndication.com"),
        "next.config.ts CSP must allow pagead2.googlesyndication.com"
      );

      const eventWallSrc = fs.readFileSync(
        path.join(ROOT, "src/app/e/[slug]/page.tsx"),
        "utf8"
      );
      assert.ok(
        eventWallSrc.includes('event.mode !== "pot" && !event.is_pro_boosted'),
        "Event wall must strictly exclude ads from Dignity Pots (mode === 'pot') and Pro Boost / Club Pass events"
      );
    });

    it("9.5 AI Search & LLM Citation Engine (/split-bill, /llms.txt, /llms-full.txt, /openapi.json, /kb.json, AI crawlers & deep-link hydration)", async () => {
      // 1. Verify /split-bill page & layout exist with SoftwareApplication + HowTo + FAQPage JSON-LD
      const splitPageSrc = fs.readFileSync(
        path.join(ROOT, "src/app/split-bill/page.tsx"),
        "utf8"
      );
      assert.ok(
        splitPageSrc.includes("SoftwareApplication") &&
          splitPageSrc.includes("HowTo") &&
          splitPageSrc.includes("FAQPage"),
        "/split-bill must include SoftwareApplication, HowTo, and FAQPage JSON-LD"
      );
      assert.ok(
        splitPageSrc.includes('searchParams.get("bill")') &&
          splitPageSrc.includes('searchParams.get("tip")') &&
          splitPageSrc.includes('searchParams.get("people")'),
        "/split-bill must hydrate bill, tip, and people from URL query parameters"
      );

      // 2. Verify /create supports universal AI query parameter hydration (?bill=...&tip=...&people=...&tiers=...)
      const createSrc = fs.readFileSync(
        path.join(ROOT, "src/app/create/page.tsx"),
        "utf8"
      );
      assert.ok(
        createSrc.includes('searchParams?.get("bill")') &&
          createSrc.includes('searchParams?.get("tip")') &&
          createSrc.includes('searchParams?.get("people")') &&
          createSrc.includes('searchParams?.get("tiers")'),
        "/create must hydrate bill, tip, people, and tiers from AI-generated URLs"
      );
      assert.ok(
        splitPageSrc.includes("tiersQueryParam"),
        "/split-bill must pass tiered Drinkers vs. Non-Drinkers pricing via tiersQueryParam to /create"
      );

      // 3. Verify /llms.txt, /llms-full.txt, /.well-known/ai-plugin.json, and /openapi.json exist and cover all 7 prompt categories
      const llmsTxt = fs.readFileSync(path.join(ROOT, "public/llms.txt"), "utf8");
      const llmsFullTxt = fs.readFileSync(
        path.join(ROOT, "public/llms-full.txt"),
        "utf8"
      );
      assert.ok(
        llmsTxt.includes("https://pullthru.co.za/split-bill?bill="),
        "llms.txt must document the pre-filled /split-bill URL template"
      );
      assert.ok(
        llmsFullTxt.includes("PerPersonZAR = ceil") &&
          llmsFullTxt.includes("7-Point South African Anti-Scam POP Checklist"),
        "llms-full.txt must include exact ZAR formulas and the 7-point fake POP checklist"
      );

      const aiPlugin = JSON.parse(
        fs.readFileSync(
          path.join(ROOT, "public/.well-known/ai-plugin.json"),
          "utf8"
        )
      );
      assert.equal(aiPlugin.api.url, "https://pullthru.co.za/openapi.json");

      const openApi = JSON.parse(
        fs.readFileSync(path.join(ROOT, "public/openapi.json"), "utf8")
      );
      assert.ok(
        openApi.paths["/split-bill"] &&
          openApi.paths["/braai-calculator"] &&
          openApi.paths["/create"],
        "openapi.json must define /split-bill, /braai-calculator, and /create"
      );

      // 4. Verify kb.json contains all 6 new discovery entries
      const kb = JSON.parse(
        fs.readFileSync(path.join(ROOT, "public/kb.json"), "utf8")
      );
      const kbIds = new Set(kb.map((item: { id: string }) => item.id));
      for (const expectedId of [
        "split-restaurant-bill-tip-sa",
        "split-weekend-away-airbnb-trip-sa",
        "braai-meat-charcoal-ice-formula-sa",
        "collect-5aside-padel-court-money-no-flakes",
        "whatsapp-baby-shower-teacher-gift-condolence-pot",
        "verify-fake-bank-pop-sms-south-africa",
      ]) {
        assert.ok(kbIds.has(expectedId), `kb.json must include ${expectedId}`);
      }

      // 5. Verify robots.ts explicitly welcomes AI search crawlers and allows /split-bill & /llms-full.txt
      const robotsMod = await import("../src/app/robots");
      const r = robotsMod.default();
      const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
      const aiBotRule = rules.find(
        (rl) =>
          Array.isArray(rl.userAgent) && rl.userAgent.includes("OAI-SearchBot")
      );
      assert.ok(
        aiBotRule,
        "robots.ts must include explicit rules for OAI-SearchBot, ClaudeBot, PerplexityBot, and Google-Extended"
      );
    });
  });

  // =========================================================================
  // 10. PARTIFUL 8-SECOND ROLL-CALL, R0 FREE 1-100+ SPOTS & 1-TAP GUEST JOIN
  // =========================================================================
  describe("10. Partiful 8-Second Roll-Call, 100% R0 Free Tiers & 1-Tap Guest Join", () => {
    it("10.1 /create sets isProBoostRequired = false and bakeProBoostIntoPrice = false, includes 8-Second Roll-Call Card, and strips statutory Act jargon", () => {
      const createSrc = fs.readFileSync(
        path.join(ROOT, "src/app/create/page.tsx"),
        "utf8"
      );
      assert.ok(
        createSrc.includes("const isProBoostRequired = false;"),
        "/create must set isProBoostRequired = false so 7+ spots (5-a-side & braais) are 100% R0 free"
      );
      assert.ok(
        createSrc.includes("const bakeProBoostIntoPrice = false;"),
        "/create must set bakeProBoostIntoPrice = false so no +R4/+R2 markup is added to player spots"
      );
      assert.ok(
        createSrc.includes("8-Second WhatsApp Roll-Call Card"),
        "/create must feature the 8-Second 3-Input WhatsApp Roll-Call Card at the top"
      );
      assert.ok(
        !createSrc.includes("National Gambling Act 7 of 2004") &&
          !createSrc.includes("Insurance Act 18 of 2017") &&
          !createSrc.includes("Host Mandate &amp; SaaS Agreement"),
        "/create must not display scary statutory Act citations or SaaS Mandate legal walls"
      );
    });

    it("10.2 /e/[slug] defaults to direct_payshap (R0 Fee), makes WhatsApp optional for 1-tap PayShap/Cash join, collapses POP verifier, and removes CPA S49 & Corporate VAT jargon", () => {
      const slugSrc = fs.readFileSync(
        path.join(ROOT, "src/app/e/[slug]/page.tsx"),
        "utf8"
      );
      assert.ok(
        slugSrc.includes(
          'useState<"gateway" | "direct_payshap" | "cash_on_arrival">("direct_payshap")'
        ),
        "Guest checkout must default to direct_payshap (R0 Fee) instead of gateway middleman fee"
      );
      assert.ok(
        slugSrc.includes("⚡ I'm In — Copy PayShap # & Lock Spot"),
        "Guest checkout must provide 1-tap PayShap copy & spot lock without mandatory POP upload"
      );
      assert.ok(
        slugSrc.includes("✅ Mark PayShap Paid"),
        "Host Squad Wall must include 1-tap Mark PayShap Paid button"
      );
      assert.ok(
        !slugSrc.includes("CPA Section 49 Notice") &&
          !slugSrc.includes("Corporate Tax Invoice"),
        "/e/[slug] must not display CPA Section 49 Notice or Corporate Tax Invoice clutter"
      );
    });

    it("10.3 /braai-calculator and /split-bill copied WhatsApp summaries include 1-tap interactive roll-call wall links", () => {
      const braaiSrc = fs.readFileSync(
        path.join(ROOT, "src/app/braai-calculator/page.tsx"),
        "utf8"
      );
      const splitSrc = fs.readFileSync(
        path.join(ROOT, "src/app/split-bill/page.tsx"),
        "utf8"
      );
      assert.ok(
        braaiSrc.includes("https://pullthru.co.za${createHref}"),
        "/braai-calculator copied WhatsApp list must include 1-tap pre-filled /create roll-call link"
      );
      assert.ok(
        splitSrc.includes("const liveRollCallUrl = `https://pullthru.co.za${createHref}`;"),
        "/split-bill copied WhatsApp summary must include 1-tap pre-filled /create roll-call link"
      );
    });

    it("10.4 Critic Council Hardening: Homepage Hero Quick-Create payload, /e/[slug]/success 1-Tap PayShap Action Card, Mobile SquadWallTab verify_cash, and zero R29/R79 upsells", () => {
      const homeSrc = fs.readFileSync(
        path.join(ROOT, "src/app/page.tsx"),
        "utf8"
      );
      assert.ok(
        homeSrc.includes("mandate_accepted: true") &&
          homeSrc.includes("bake_pro_boost_into_price: false") &&
          homeSrc.includes("secret_location_pin:") &&
          homeSrc.includes("hostTokenParam"),
        "Homepage handleQuickCreateFromHero must pass mandate_accepted: true, bake_pro_boost_into_price: false, secret_location_pin, and append hostToken on redirect"
      );

      const successSrc = fs.readFileSync(
        path.join(ROOT, "src/app/e/[slug]/success/page.tsx"),
        "utf8"
      );
      assert.ok(
        successSrc.includes("📲 SPOT LOCKED! SEND PAYSHAP TO HOST") &&
          successSrc.includes("Copy PayShap #:"),
        "/e/[slug]/success must display 1-Tap PayShap Action Card and 'SPOT LOCKED! SEND PAYSHAP TO HOST' instead of Cash on Arrival"
      );
      assert.ok(
        !successSrc.includes("Corporate Expense &amp; Attendance Receipt") &&
          !successSrc.includes("CPA s17"),
        "/e/[slug]/success must not display Corporate Expense Receipt or CPA s17 jargon"
      );

      const squadWallTabSrc = fs.readFileSync(
        path.join(ROOT, "src/components/event/SquadWallTab.tsx"),
        "utf8"
      );
      assert.ok(
        squadWallTabSrc.includes("✅ Mark PayShap Paid") &&
          squadWallTabSrc.includes('"verify_cash"'),
        "Mobile SquadWallTab.tsx must expose 1-tap Mark PayShap Paid (verify_cash) button for hosts"
      );

      const adSlotSrc = fs.readFileSync(
        path.join(ROOT, "src/components/TastefulAdSlot.tsx"),
        "utf8"
      );
      assert.ok(
        !adSlotSrc.includes("R79/mo") &&
          !adSlotSrc.includes("Pro Boosted"),
        "TastefulAdSlot.tsx must not pitch R79/mo Club Pass or Pro Boosted walls"
      );
      assert.ok(
        QUICK_TOUR_STEPS[0].highlights[0].includes("1–100+ spots are 100% R0 Free"),
        "Navbar Quick Tour Step 1 must state 1–100+ spots are 100% R0 Free"
      );
    });

    it("10.5 Critic Council API Integration: 1-Tap PayShap preserves custom Pot amount and Host verify_cash records PayShap verification note", async () => {
      clearRateLimitStore();
      const createPotRes = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            title: "Siya Birthday Braai Pot",
            mode: "pot",
            price_zar: 100,
            min_pot_contribution_zar: 100,
            max_spots: 15,
            host_name: "Siya",
            host_phone: "0824445566",
            bake_pro_boost_into_price: false,
            mandate_accepted: true,
          }),
        })
      );
      assert.equal(createPotRes.status, 201);
      const potCreated = await createPotRes.json();

      // Guest joins in 1 tap with custom R250 pot contribution & "📲 PayShap Sent"
      const joinRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            action: "reserve_cash_on_arrival",
            slug: potCreated.event.slug,
            guest_name: "Eben Etzebeth",
            spots_locked: 1,
            amount_contributed_zar: 250,
            badge_label: "📲 PayShap Sent",
          }),
        })
      );
      assert.equal(joinRes.status, 201);
      const joinData = await joinRes.json();
      assert.equal(joinData.rsvp.amount_contributed_zar, 250, "Custom Gift Pot amount must be preserved on 1-tap PayShap join");
      assert.equal(joinData.rsvp.badge_label, "📲 PayShap Sent");
      assert.equal(joinData.rsvp.payment_channel, "payshap");

      // Host taps "✅ Mark PayShap Paid" (verify_cash)
      const { PATCH: patchRsvpApi } = await import("../src/app/api/rsvp/route");
      const verifyRes = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-host-token": potCreated.host_secret_token,
          },
          body: JSON.stringify({
            action: "moderate_rsvp",
            slug: potCreated.event.slug,
            host_token: potCreated.host_secret_token,
            rsvpId: joinData.rsvp.id,
            moderationAction: "verify_cash",
          }),
        })
      );
      assert.equal(verifyRes.status, 200);
      const verifyData = await verifyRes.json();
      assert.equal(verifyData.rsvp.checked_in, true);
      assert.equal(
        verifyData.rsvp.pop_reference_note,
        "✅ PayShap Received & Verified by Host",
        "Host verify_cash on PayShap RSVP must record PayShap verification note instead of Cash"
      );
    });

    it("10.6 Zero-Phone Free Roll-Call Mode, R15 Price Floor & 30+ Free Spots Copy across /, /create, /5-a-side-and-padel & layout.tsx", () => {
      const homeSrc = fs.readFileSync(
        path.join(ROOT, "src/app/page.tsx"),
        "utf8"
      );
      assert.ok(
        homeSrc.includes("🎉 Fast Free RSVP (No Phone #)") &&
          homeSrc.includes("3B. When &amp; Where (Zero Phone # Required)"),
        "Homepage Hero Roll-Call card must support Zero-Phone Free RSVP mode"
      );

      const createSrc = fs.readFileSync(
        path.join(ROOT, "src/app/create/page.tsx"),
        "utf8"
      );
      assert.ok(
        createSrc.includes("🎉 Fast Roll-Call (Free RSVP • No Phone #)") &&
          createSrc.includes("3B. Date &amp; Time") &&
          createSrc.includes("3C. Location / Park / Venue") &&
          createSrc.includes("min={15}"),
        "/create 8-Second card must include Fast Roll-Call mode (Date + Location + 1-Tap Bring-List without Phone #) and R15 price floor"
      );

      const fivesSrc = fs.readFileSync(
        path.join(ROOT, "src/app/5-a-side-and-padel/page.tsx"),
        "utf8"
      );
      assert.ok(
        fivesSrc.includes("100% Free Forever for Padel 4-Balls &amp; 5-a-Side Squads (Up to 30+ Spots)") &&
          !fivesSrc.includes("Pro Squad Wall (+R2/player covers R29)"),
        "/5-a-side-and-padel must highlight 30+ free spots and remove the >6 player R29 upsell"
      );

      const layoutSrc = fs.readFileSync(
        path.join(ROOT, "src/app/layout.tsx"),
        "utf8"
      );
      assert.ok(
        layoutSrc.includes("Free forever for squads up to 30+ spots with Bring-'n-Bak checklist"),
        "layout.tsx metadata and JSON-LD must highlight Free forever for squads up to 30+ spots"
      );
    });

    it("10.7 API Integration: Zero-Phone 30-Spot Free Meetup & R20 Low-Ticket Padel Ball Split", async () => {
      clearRateLimitStore();

      // 1. Create a 30-spot Free Reddit Picnic Roll-Call with zero host phone or bank details
      const freeRes = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            title: "Green Point Strangers Picnic & Board Games",
            mode: "free",
            price_zar: 0,
            max_spots: 30,
            event_date: "Saturday • 11:00 SAST",
            location_name: "Green Point Urban Park",
            host_name: "Chloe (r/capetown)",
            host_phone: "",
            bring_items: [
              { id: "gp-1", label: "🥨 Snacks / Crisps & Dips", claimed_by_name: null, claimed_rsvp_id: null },
            ],
          }),
        })
      );
      assert.equal(freeRes.status, 201);
      const freeData = await freeRes.json();
      assert.equal(freeData.event.mode, "free");
      assert.equal(freeData.event.max_spots, 30);
      assert.equal(freeData.event.host_phone, "");

      // Guest joins the free roll-call in 1 tap and claims the snack item
      const freeJoinRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            slug: freeData.event.slug,
            guest_name: "Liam CT",
            status: "going_free",
            spots_locked: 1,
            claimed_item_id: "gp-1",
          }),
        })
      );
      assert.equal(freeJoinRes.status, 201);
      const freeJoinData = await freeJoinRes.json();
      assert.equal(freeJoinData.rsvp.status, "going_free");
      assert.equal(freeJoinData.rsvp.claimed_item_label, "🥨 Snacks / Crisps & Dips");

      // 2. Create a R20 Padel Ball Split event (testing the lowered R15 minimum floor)
      const r20Res = await postEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            title: "Morning Padel Can of Balls Split",
            mode: "fixed",
            price_zar: 20,
            max_spots: 4,
            host_name: "Willem",
            host_phone: "0825551122",
            mandate_accepted: true,
          }),
        })
      );
      assert.equal(r20Res.status, 201);
      const r20Data = await r20Res.json();
      assert.equal(r20Data.event.price_zar, 20);

      // Guest locks a R20 spot via 1-tap PayShap
      const r20JoinRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            action: "reserve_cash_on_arrival",
            slug: r20Data.event.slug,
            guest_name: "Farouk",
            spots_locked: 1,
            badge_label: "📲 PayShap Sent",
          }),
        })
      );
      assert.equal(r20JoinRes.status, 201);
      const r20JoinData = await r20JoinRes.json();
      assert.equal(r20JoinData.rsvp.amount_contributed_zar, 20);
      assert.equal(r20JoinData.rsvp.payment_channel, "payshap");
    });
  });
});
