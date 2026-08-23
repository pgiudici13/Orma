"use client";

import { useMemo } from "react";
import { materialColor } from "./materials/palette";
import {
  FabricSurface,
  MetalSurface,
  PaperSurface,
} from "./materials/Surfaces";
import {
  getCalendarTexture,
  getCompassTexture,
  getNotebookTexture,
  getSheetTexture,
} from "./materials/textures";
import {
  CALENDAR_GEOMETRY,
  COMPASS_BODY_GEOMETRY,
  COMPASS_FACE_GEOMETRY,
  NOTEBOOK_GEOMETRY,
  PENCIL_GEOMETRY,
  PENCIL_TIP_GEOMETRY,
  SHEET_GEOMETRY,
} from "./geometry";

/** Oggetti del tavolo diversi dalle carte. Stessa regola: geometrie condivise. */

export function Notebook3D() {
  const map = useMemo(() => getNotebookTexture(), []);

  return (
    <mesh castShadow receiveShadow geometry={NOTEBOOK_GEOMETRY}>
      <FabricSurface map={map} />
    </mesh>
  );
}

export function Calendar3D() {
  const map = useMemo(() => getCalendarTexture(), []);

  return (
    <mesh castShadow receiveShadow geometry={CALENDAR_GEOMETRY}>
      <PaperSurface map={map} />
    </mesh>
  );
}

export function Sheet3D() {
  const map = useMemo(() => getSheetTexture(), []);

  return (
    <mesh castShadow receiveShadow geometry={SHEET_GEOMETRY}>
      <PaperSurface map={map} />
    </mesh>
  );
}

export function Pencil3D() {
  const wood = useMemo(() => materialColor("--wood-base"), []);
  const ink = useMemo(() => materialColor("--ink"), []);

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow geometry={PENCIL_GEOMETRY}>
        <meshStandardMaterial color={wood} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh castShadow geometry={PENCIL_TIP_GEOMETRY} position={[0, 0.187, 0]}>
        <meshStandardMaterial color={ink} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Compass3D() {
  const face = useMemo(() => getCompassTexture(), []);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={COMPASS_BODY_GEOMETRY}>
        <MetalSurface />
      </mesh>
      {/* Vetro del quadrante: quasi liscio, così prende il riflesso della
          lampada come farebbe un vetro vero. */}
      <mesh geometry={COMPASS_FACE_GEOMETRY} position={[0, 0.01, 0]}>
        <meshStandardMaterial
          map={face}
          roughness={0.18}
          metalness={0.05}
          envMapIntensity={1.4}
        />
      </mesh>
    </group>
  );
}
