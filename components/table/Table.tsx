import { Logo } from "@/components/Logo";
import { Calendar } from "./Calendar";
import { Card } from "./Card";
import { Compass } from "./Compass";
import { FadeIn } from "./FadeIn";
import { LooseSheet } from "./LooseSheet";
import { Notebook } from "./Notebook";
import { Pencil } from "./Pencil";
import { TableSurface } from "./TableSurface";

function Placed({
  top,
  left,
  rotate,
  children,
}: {
  top: string;
  left: string;
  rotate: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      }}
    >
      {children}
    </div>
  );
}

export function Table() {
  return (
    <div className="relative min-h-[640px] w-full flex-1 overflow-hidden">
      <TableSurface />

      <Logo
        className="pointer-events-none absolute top-[4%] left-1/2 -translate-x-1/2 text-3xl"
        style={{
          color: "color-mix(in srgb, var(--wood-dark) 55%, transparent)",
          textShadow: "0 1px 0 color-mix(in srgb, white 12%, transparent)",
        }}
      />

      <div className="absolute inset-0">
        <Placed top="18%" left="12%" rotate={-6}>
          <FadeIn delay={0}>
            <Notebook />
          </FadeIn>
        </Placed>

        <Placed top="24%" left="38%" rotate={-3}>
          <FadeIn delay={0.08}>
            <Card variant="specialita" title="Nodi e Legature" />
          </FadeIn>
        </Placed>

        <Placed top="20%" left="72%" rotate={2}>
          <Card variant="tappa" title="Tappa della Scoperta" />
        </Placed>

        <Placed top="52%" left="58%" rotate={4}>
          <Card variant="competenza" title="Educazione alla Fede" />
        </Placed>

        <Placed top="58%" left="16%" rotate={-2}>
          <Calendar day="12" month="Agosto" />
        </Placed>

        <Placed top="70%" left="42%" rotate={5}>
          <LooseSheet note="Prossima uscita: sabato ore 8:30, stazione." />
        </Placed>

        <Placed top="80%" left="62%" rotate={-8}>
          <Pencil className="w-32" />
        </Placed>

        <Placed top="72%" left="84%" rotate={0}>
          <Compass className="w-20" />
        </Placed>
      </div>
    </div>
  );
}
