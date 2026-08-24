import type { NextConfig } from "next";

async function headers() {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ];
}

const nextConfig: NextConfig = {
  /* config options here */
  agentRules: false,
  headers,
};

export default nextConfig;
