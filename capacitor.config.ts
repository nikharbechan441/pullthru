/**
 * PullThru (pullthru.co.za) — Native Android Google Play Store Configuration (Capacitor)
 * Package ID: com.pullthru.za
 *
 * Strategy:
 * - Guests clicking a WhatsApp link open `https://pullthru.co.za/e/[slug]` (or Android App Links
 *   if they have the Google Play Store app installed).
 * - Hosts & regular users download the official Android app from the Google Play Store
 *   ($25 one-time Google Play Console fee), while iOS App Store ($99/yr) can be added once traction scales.
 */

const capacitorConfig = {
  appId: "com.pullthru.za",
  appName: "PullThru",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://pullthru.co.za",
    cleartext: process.env.NODE_ENV === "development",
    errorPath: "/offline.html",
    allowNavigation: [
      "pullthru.co.za",
      "*.pullthru.co.za",
      "checkout.paystack.com",
      "*.paystack.co",
      "*.ozow.com",
    ],
  },
  android: {
    backgroundColor: "#FAF8F5",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#FAF8F5",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#007749",
    },
  },
};

export default capacitorConfig;
