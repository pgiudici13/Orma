"use client";

import { useMemo } from "react";
import {
  ALBUM_GEOMETRY,
  BUSTA_GEOMETRY,
  MAPPA_CORD_GEOMETRY,
  MAPPA_ROLL_GEOMETRY,
  OBJECT_SIZE,
  QUADERNO_GEOMETRY,
  RUBRICA_GEOMETRY,
  TESSERA_GEOMETRY,
} from "../geometry";
import { materialColor, mix } from "../materials/palette";
import { FabricSurface, PaperSurface } from "../materials/Surfaces";
import { getCoverTexture, getSheetTexture } from "../materials/textures";

/**
 * Gli oggetti del percorso personale e dell'account (RD-T07).
 *
 * Album dei distintivi, quaderno delle Competenze, mappa delle Tappe, rubrica
 * dei Maestri, tessera personale, busta per la richiesta di adesione: ognuno
 * apre la propria superficie nel pannello. Nessuna di queste funzionalità vive
 * più in una pagina a sé (DEC-019).
 */

export function Album3D() {
  const map = useMemo(
    () =>
      getCoverTexture("album", {
        base: materialColor("--accent"),
        label: "Distintivi",
        seed: 991,
      }),
    [],
  );

  return (
    <mesh castShadow receiveShadow geometry={ALBUM_GEOMETRY}>
      <FabricSurface map={map} />
    </mesh>
  );
}

export function Quaderno3D() {
  const map = useMemo(
    () =>
      getCoverTexture("quaderno", {
        base: mix(materialColor("--fabric-base"), "#000000", 0.15),
        label: "Competenze",
        seed: 1771,
      }),
    [],
  );

  return (
    <mesh castShadow receiveShadow geometry={QUADERNO_GEOMETRY}>
      <FabricSurface map={map} />
    </mesh>
  );
}

export function Rubrica3D() {
  const map = useMemo(
    () =>
      getCoverTexture("rubrica", {
        base: materialColor("--brass-dark"),
        label: "Maestri",
        seed: 5051,
      }),
    [],
  );

  return (
    <mesh castShadow receiveShadow geometry={RUBRICA_GEOMETRY}>
      <FabricSurface map={map} />
    </mesh>
  );
}

export function Tessera3D() {
  const map = useMemo(
    () =>
      getCoverTexture("tessera", {
        base: materialColor("--paper-aged"),
        label: "Tessera",
        labelPaper: false,
        seed: 2029,
      }),
    [],
  );

  return (
    <mesh castShadow receiveShadow geometry={TESSERA_GEOMETRY}>
      <PaperSurface map={map} />
    </mesh>
  );
}

export function Busta3D() {
  const map = useMemo(
    () =>
      getCoverTexture("busta", {
        base: materialColor("--paper-base"),
        label: "Reparto",
        labelPaper: false,
        seed: 8123,
      }),
    [],
  );

  return (
    <mesh castShadow receiveShadow geometry={BUSTA_GEOMETRY}>
      <PaperSurface map={map} />
    </mesh>
  );
}

/** Mappa delle Tappe: un rotolo di carta legato con un cordino. */
export function Mappa3D() {
  const map = useMemo(() => getSheetTexture(), []);
  const cord = useMemo(() => materialColor("--accent"), []);
  const half = OBJECT_SIZE.mappa.width / 2;

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow geometry={MAPPA_ROLL_GEOMETRY}>
        <PaperSurface map={map} />
      </mesh>

      {[-half * 0.45, half * 0.45].map((offset) => (
        <mesh
          key={offset}
          castShadow
          geometry={MAPPA_CORD_GEOMETRY}
          position={[0, offset, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={cord} roughness={0.85} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
