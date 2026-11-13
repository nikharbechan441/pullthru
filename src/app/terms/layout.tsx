import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service, POPIA Privacy & SARB Compliance",
  description:
    "Official Terms of Service, POPIA Section 18 privacy notice, ECTA Section 43 statutory disclosures, and SARB Directive 1 of 2007 payment clearing mandate for PullThru South Africa.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
