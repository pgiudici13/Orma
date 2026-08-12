"use client";

import { useMemo } from "react";
import { materialColor } from "./materials/palette";
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
      <meshStandardMaterial map={map} roughness={0.92} metalness={0} />
    </mesh>
  );
}

export function Calendar3D() {
  const map = useMemo(() => getCalendarTexture(), []);

  return (
    <mesh castShadow receiveShadow geometry={CALENDAR_GEOMETRY}>
      <meshStandardMaterial map={map} roughness={0.84} metalness={0} />
    </mesh>
  );
}

export function Sheet3D() {
  const map = useMemo(() => getSheetTexture(), []);

  return (
    <mesh castShadow receiveShadow geometry={SHEET_GEOMETRY}>
      <meshStandardMaterial map={map} roughness={0.9} metalness={0} />
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
  const metal = useMemo(() => materialColor("--metal-base"), []);
  const face = useMemo(() => getCompassTexture(), []);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={COMPASS_BODY_GEOMETRY}>
        <meshStandardMaterial color={metal} roughness={0.35} metalness={0.75} />
      </mesh>
      <mesh geometry={COMPASS_FACE_GEOMETRY} position={[0, 0.01, 0]}>
        <meshStandardMaterial map={face} roughness={0.45} metalness={0.05} />
      </mesh>
    </group>
  );
}
