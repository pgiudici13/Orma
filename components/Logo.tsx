import type { CSSProperties } from "react";

export function Logo({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`font-logo tracking-wide ${className}`} style={style}>
      ORMA
    </span>
  );
}
