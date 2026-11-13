import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/e/:slug/opengraph-image",
        destination: "/feature-graphic.png",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/e/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noimageindex",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://js.yoco.com https://pagead2.googlesyndication.com https://adservice.google.com https://adservice.google.co.za https://tpc.googlesyndication.com https://ep2.adtrafficquality.google; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.paystack.co https://online.yoco.com https://pagead2.googlesyndication.com https://adservice.google.com https://adservice.google.co.za https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google; frame-src 'self' https://checkout.paystack.com https://js.paystack.co https://*.yoco.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google; frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
