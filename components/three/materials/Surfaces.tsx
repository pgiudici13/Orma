"use client";

import { useMemo } from "react";
import type { Texture } from "three";
import { materialColor } from "./palette";
import {
  getFabricNormalTexture,
  getPaperNormalTexture,
  getWoodNormalTexture,
  getWoodSurfaceTexture,
  getWoodTexture,
} from "./textures";

/**
 * Materiali condivisi della scena.
 *
 * Un oggetto non dichiara più "un colore e una rugosità a occhio": dichiara di
 * che **materiale** è fatto, e il materiale porta con sé rilievo, finitura e
 * modo di riflettere la luce. Sono i tre dati che distinguono una superficie
 * reale da un piano colorato (`docs/DESIGN.md`, "materiali fisicamente
 * credibili").
 *
 * Le mappe sono procedurali e memoizzate a livello di modulo: esiste una sola
 * fibra di carta e una sola trama di tela per tutta la scena, qualunque sia il
 * numero di oggetti che le usano.
 */

/** Legno del piano: venatura in rilievo sotto una vernice consumata. */
export function WoodSurface() {
  const map = useMemo(() => getWoodTexture(), []);
  const normalMap = useMemo(() => getWoodNormalTexture(), []);
  // Occlusione (R), rugosità (G) e metallicità (B) in un'unica texture.
  const surface = useMemo(() => getWoodSurfaceTexture(), []);

  return (
    <meshPhysicalMaterial
      map={map}
      normalMap={normalMap}
      normalScale={[0.22, 0.22]}
      aoMap={surface}
      aoMapIntensity={0.7}
      roughnessMap={surface}
      metalnessMap={surface}
      roughness={1}
      metalness={1}
      // Il legno è scuro e caldo: se riflette l'ambiente quanto un metallo,
      // il bruno si slava in un grigio rosato.
      envMapIntensity={0.5}
      // Vernice: un velo lucido sopra il legno opaco, quello che fa scorrere
      // il riflesso della lampada sul piano quando la camera si muove.
      clearcoat={0.14}
      clearcoatRoughness={0.7}
    />
  );
}

/** Carta: fibra minuta, nessun riflesso speculare marcato. */
export function PaperSurface({ map }: { map: Texture }) {
  const normalMap = useMemo(() => getPaperNormalTexture(), []);

  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      normalScale={[0.3, 0.3]}
      roughness={0.93}
      metalness={0}
    />
  );
}

/** Tela del taccuino: trama in rilievo e la lucentezza obliqua del tessuto. */
export function FabricSurface({ map }: { map: Texture }) {
  const normalMap = useMemo(() => getFabricNormalTexture(), []);

  return (
    <meshPhysicalMaterial
      map={map}
      normalMap={normalMap}
      normalScale={[0.7, 0.7]}
      roughness={0.95}
      metalness={0}
      // Il tessuto si accende sui bordi rivolti verso la luce, non al centro:
      // senza questo la copertina sembra cartone verniciato.
      sheen={0.6}
      sheenRoughness={0.85}
      sheenColor="#cfc6ae"
    />
  );
}

/** Ottone/acciaio degli oggetti piccoli: riflette l'ambiente, non la fiamma. */
export function MetalSurface({
  color = materialColor("--metal-base"),
  roughness = 0.34,
}: {
  color?: string;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={0.85}
      envMapIntensity={1.2}
    />
  );
}
