import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Split a Bill, Tip & Weekend Trip Calculator South Africa (Free Splitwise Alternative)",
  description:
    "Free South African restaurant bill, tip, Airbnb, and group expense splitter. Calculate exact per-person Rand shares (with 10%–15% tip or custom drinks tiers) and collect instantly on WhatsApp via Direct PayShap or Capitec PayMe with R0.00 guest fees and no app download.",
  keywords: [
    "split a bill calculator south africa",
    "help me split this bill",
    "restaurant bill and tip calculator zar",
    "splitwise alternative south africa",
    "tricount alternative south africa",
    "split dinner bill whatsapp payshap",
    "split airbnb weekend away costs south africa",
    "capitec payme bill splitter",
    "group expense calculator rands",
  ],
  alternates: {
    canonical: "https://pullthru.co.za/split-bill",
  },
  openGraph: {
    title:
      "Split a Bill, Tip & Trip Costs on WhatsApp | Free Splitwise Alternative SA",
    description:
      "Split any restaurant bill, bar tab, or weekend away in Rands (ZAR) in 15 seconds. Zero app downloads, R0.00 guest fees, and instant Direct PayShap & Capitec PayMe settlement.",
    url: "https://pullthru.co.za/split-bill",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "PullThru Free South African Bill, Tip & Group Expense Splitter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title:
      "Split a Bill, Tip & Trip Costs on WhatsApp | PullThru South Africa",
    description:
      "Calculate exact per-person Rand shares with tip and collect instantly on WhatsApp via PayShap or Capitec PayMe with R0 guest fees.",
    images: ["/feature-graphic.png"],
  },
};

export default function SplitBillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
