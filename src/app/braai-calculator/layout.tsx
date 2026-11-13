import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SA Braai Meat, Charcoal, Ice & Kitty Calculator (Free)",
  description:
    "Free South African braai meat, charcoal, ice, and kitty split calculator. Calculate exact kg of boerewors, lamb/pork chops, sosaties, garlic bread, 4kg bags of ice, and per-person Rand split for 4 to 40 guests — then turn it into a live WhatsApp kitty link in 1 click.",
  alternates: {
    canonical: "https://pullthru.co.za/braai-calculator",
  },
  openGraph: {
    title: "SA Braai Meat, Charcoal, Ice & Kitty Calculator | PullThru South Africa",
    description:
      "Calculate exact kg of boerewors, chops, sosaties, garlic bread, bags of ice, and per-person Rand split for your weekend braai — then launch a WhatsApp kitty & bring-list link in 1 tap.",
    url: "https://pullthru.co.za/braai-calculator",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "Free SA Braai Meat, Charcoal, Ice & Kitty Calculator — PullThru South Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title: "SA Braai Meat, Charcoal, Ice & Kitty Calculator | PullThru South Africa",
    description:
      "Calculate exact kg of boerewors, chops, sosaties, garlic bread, bags of ice, and per-person Rand split for your weekend braai.",
    images: ["/feature-graphic.png"],
  },
};

export default function BraaiCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
