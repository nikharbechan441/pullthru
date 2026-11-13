import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "For Venues, Clubs & Group Bookings — PullThru South Africa (R0 Cost, Zero Integration)",
  description:
    "Stop losing provisional group bookings while the organiser chases friends on WhatsApp for deposits. Give group organisers a 1-click WhatsApp collection link so they pay your full deposit faster.",
  alternates: {
    canonical: "https://pullthru.co.za/for-venues",
  },
  openGraph: {
    title: "PullThru for South African Venues & Group Bookings",
    description:
      "Zero cost, zero integration. Help group organisers collect per-person deposits from their friends on WhatsApp in one afternoon so they settle your venue invoice on time.",
    url: "https://pullthru.co.za/for-venues",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "PullThru for South African Venues & Group Bookings — R0 Cost, Zero Integration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title: "PullThru for South African Venues & Group Bookings",
    description:
      "Zero cost, zero integration. Help group organisers collect per-person deposits from their friends on WhatsApp in one afternoon.",
    images: ["/feature-graphic.png"],
  },
};

export default function ForVenuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
