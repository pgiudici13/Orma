import React from "react";

export default function Loading() {
  return (
    <div
      className="flex min-h-full items-center justify-center"
      style={{ backgroundColor: "var(--paper-base)" }}
    >
      <style>{`
        @keyframes pulse-ink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .loading-dot {
          animation: pulse-ink 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1">
          <span
            className="loading-dot w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--ink)" }}
          />
          <span
            className="loading-dot w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--ink)" }}
          />
          <span
            className="loading-dot w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--ink)" }}
          />
        </div>

        <p
          className="font-serif text-sm tracking-wide"
          style={{ color: "var(--ink)" }}
        >
          Caricamento in corso…
        </p>
      </div>
    </div>
  );
}
