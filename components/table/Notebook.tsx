export function Notebook({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative h-40 w-28 rounded-[2px] ${className}`}
      style={{
        backgroundColor: "var(--fabric-base)",
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 3px)",
        boxShadow: "0 16px 24px -14px rgba(15, 12, 4, 0.6)",
        border: "1px solid color-mix(in srgb, black 35%, var(--fabric-base))",
      }}
    >
      {/* dorso cucito */}
      <span
        aria-hidden
        className="absolute inset-y-2 left-2 w-px"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, color-mix(in srgb, var(--paper-aged) 70%, transparent) 0px, color-mix(in srgb, var(--paper-aged) 70%, transparent) 3px, transparent 3px, transparent 7px)",
        }}
      />
      {/* toppa etichetta */}
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 h-10 w-16 -translate-x-1/2 -translate-y-1/2 rotate-[-1deg] rounded-[2px]"
        style={{
          backgroundColor: "var(--paper-aged)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
        }}
      />
      {/* elastico */}
      <span
        aria-hidden
        className="absolute inset-y-0 right-3 w-1"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--ink) 70%, var(--accent) 30%)",
        }}
      />
    </div>
  );
}
