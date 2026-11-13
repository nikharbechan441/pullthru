import type { Metadata, Viewport } from "next";
import AppInstallNotification from "@/components/AppInstallNotification";
import AppBottomNav from "@/components/AppBottomNav";
import SplashScreen from "@/components/SplashScreen";
import ZeroTouchSupportWidget from "@/components/ZeroTouchSupportWidget";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#007749",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pullthru.co.za";

export const metadata: Metadata = {
  title: {
    default:
      "PullThru — WhatsApp Event RSVP & Kitty App for South Africa (PayShap & Capitec PayMe)",
    template: "%s | PullThru South Africa",
  },
  description:
    "See who's actually pulling through. Create an 8-second WhatsApp roll-call & chip-in link for 5-a-side soccer, Padel, Spitbraais & Group Gift Pots in South Africa. Free forever for squads up to 30+ spots with Bring-'n-Bak checklist and R0 guest fees via Direct PayShap.",
  keywords: [
    "PullThru",
    "WhatsApp event RSVP South Africa",
    "braai kitty app South Africa",
    "split padel court payment SA",
    "5-a-side soccer payment collection",
    "Partiful alternative South Africa",
    "group gift pot South Africa",
    "PayShap event RSVP",
    "Capitec PayMe event kitty",
    "split bill with friends South Africa",
  ],
  metadataBase: new URL(APP_BASE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en-ZA": "https://pullthru.co.za",
      "x-default": "https://pullthru.co.za",
    },
  },
  verification: {
    google: "fBH4tH4uePgK5xY9zH2nB81FJNqYsyT_Gs86DV2NEWo",
  },
  other: {
    "google-adsense-account": "ca-pub-3943711113843734",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "PullThru — See who's actually pulling through",
    description:
      "25-second WhatsApp links for 5-a-side, Padel, Braais & Gift Pots in South Africa. Guests pay hosts directly via PayShap or Capitec PayMe (R0 Guest Fee).",
    url: "https://pullthru.co.za",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "PullThru — Stop chasing EFTs. Get paid before kickoff.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title: "PullThru — See who's actually pulling through",
    description:
      "25-second WhatsApp links for 5-a-side, Padel, Braais & Gift Pots in South Africa.",
    images: ["/feature-graphic.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PullThru",
  },
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://pullthru.co.za/#organization",
      name: "PullThru",
      legalName: "PullThru Technologies (Pty) Ltd",
      url: "https://pullthru.co.za",
      logo: "https://pullthru.co.za/icon-512.png",
      email: "support@pullthru.co.za",
      areaServed: {
        "@type": "Country",
        name: "South Africa",
        identifier: "ZA",
      },
      sameAs: [
        "https://www.instagram.com/pullthruza/",
        "https://www.tiktok.com/@pullthruza",
        "https://x.com/pullthruza",
      ],
    },
    {
      "@type": "WebApplication",
      "@id": "https://pullthru.co.za/#webapp",
      name: "PullThru",
      alternateName: "PullThru South Africa — WhatsApp Event RSVP & Kitty App",
      url: "https://pullthru.co.za",
      applicationCategory: "FinanceApplication, LifestyleApplication",
      operatingSystem: "Web, Android, iOS",
      inLanguage: "en-ZA",
      description:
        "South Africa's 25-second WhatsApp event RSVP and group payment kitty link for 5-a-side soccer, Padel, Spitbraais, Run Clubs, and Group Gift Pots with direct PayShap, Capitec PayMe, and Instant POP verification.",
      publisher: {
        "@id": "https://pullthru.co.za/#organization",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        "@id": "https://pullthru.co.za/#aggregaterating",
        ratingValue: "4.9",
        reviewCount: "128",
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "Direct PayShap & Capitec PayMe R0 Guest Fee Clearing",
        "Cryptographic SHA-256 Proof-of-Payment Verifier",
        "Secret 4-Digit Gate Check-In PIN",
        "1-Tap WhatsApp Spot-Swap",
        "5-a-Side Team Bib Generator",
        "Bring-'n-Bak Potluck Checklist",
      ],
      offers: [
        {
          "@type": "Offer",
          name: "Free Squad Tier",
          price: "0",
          priceCurrency: "ZAR",
          description: "Free forever for squads up to 30+ spots and free social RSVPs with Bring-'n-Bak checklist.",
        },
      ],
      potentialAction: [
        {
          "@type": "UseAction",
          name: "Split a Restaurant Bill, Tip or Weekend Trip in Rands",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://pullthru.co.za/split-bill?bill={bill}&tip={tip}&people={people}&title={title}",
          },
        },
        {
          "@type": "CreateAction",
          name: "Create a 25-Second WhatsApp PayShap & Capitec Event or Kitty Link",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://pullthru.co.za/create?title={title}&bill={bill}&tip={tip}&people={people}",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-ZA"
      style={
        {
          "--font-display": "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          "--font-sans": "'Inter', system-ui, -apple-system, sans-serif",
          "--font-mono": "'JetBrains Mono', ui-monospace, monospace",
        } as React.CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#FAF8F5] text-[#0F172A] antialiased selection:bg-[#007749] selection:text-white pb-16 md:pb-0">
        <script
          id="pullthru-schema-graph"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <SplashScreen />
        <AppInstallNotification />
        {children}
        <ZeroTouchSupportWidget />
        <AppBottomNav />
      </body>
    </html>
  );
}
