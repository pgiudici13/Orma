"use client";

import { useState } from "react";
import { MembriSection, type MemberData } from "./MembriSection";
import { SquadriglieSection, type SquadrigliaData } from "./SquadriglieSection";
import { CalendarioSection } from "./CalendarioSection";
import type { EventoData } from "@/lib/scene/objects";

export function RepartoTabs({
  members,
  squadriglie,
  events,
  isCapoOrAdmin,
}: {
  members: MemberData[];
  squadriglie: SquadrigliaData[];
  events: EventoData[];
  isCapoOrAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"membri" | "squadriglie" | "calendario">("membri");

  return (
    <div className="flex flex-col gap-8">
      {/* Tab Navigation */}
      <div
        className="flex items-center gap-2 border-b"
        style={{ borderColor: "color-mix(in srgb, var(--ink) 18%, transparent)" }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("membri")}
          className={`cursor-pointer px-4 py-2.5 font-serif text-base tracking-wide transition-all border-b-2 -mb-px ${
            activeTab === "membri"
              ? "font-bold text-[var(--ink)] border-[var(--accent)]"
              : "font-normal text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          Membri ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("squadriglie")}
          className={`cursor-pointer px-4 py-2.5 font-serif text-base tracking-wide transition-all border-b-2 -mb-px ${
            activeTab === "squadriglie"
              ? "font-bold text-[var(--ink)] border-[var(--accent)]"
              : "font-normal text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          Squadriglie ({squadriglie.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calendario")}
          className={`cursor-pointer px-4 py-2.5 font-serif text-base tracking-wide transition-all border-b-2 -mb-px ${
            activeTab === "calendario"
              ? "font-bold text-[var(--ink)] border-[var(--accent)]"
              : "font-normal text-neutral-500 border-transparent hover:text-neutral-800"
          }`}
        >
          Calendario ({events.length})
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "membri" ? <MembriSection members={members} /> : null}
        {activeTab === "squadriglie" ? (
          <SquadriglieSection
            squadriglie={squadriglie}
            members={members}
            isCapoOrAdmin={isCapoOrAdmin}
          />
        ) : null}
        {activeTab === "calendario" ? (
          <CalendarioSection events={events} isCapoOrAdmin={isCapoOrAdmin} />
        ) : null}
      </div>
    </div>
  );
}
