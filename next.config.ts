import type { NextConfig } from "next";

/**
 * CSP senza nonce: `script-src`/`style-src` restano su `unsafe-inline` perché
 * l'idratazione di Next.js (dati serializzati in <script> inline) lo richiede
 * senza un'infrastruttura di nonce per-richiesta (non presente in questo
 * progetto). Il valore reale non è "blocca ogni XSS", ma "impedisce a uno
 * script iniettato di caricare risorse/esfiltrare dati verso un'origine
 * esterna arbitraria" — connect-src/img-src restano ristretti a 'self' e al
 * solo host Supabase del progetto. Nessun asset esterno (font Google self-hosted
 * via next/font, nessun tracker di terze parti oltre Vercel Analytics/Speed
 * Insights, serviti same-origin da /_vercel/... quando deployati su Vercel).
 */
function buildCsp() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // In sviluppo il compilatore di Next.js (fast refresh/HMR) genera codice che
  // passa da eval(): senza 'unsafe-eval' qui, `npm run dev` si romperebbe.
  // La build di produzione non ne ha bisogno.
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseUrl}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseUrl}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

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
        {
          key: "Content-Security-Policy",
          value: buildCsp(),
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
