"use client";

import { useMemo } from "react";
import {
  BAULE_BODY_GEOMETRY,
  BAULE_LID_GEOMETRY,
  BAULE_STRAP_GEOMETRY,
  OBJECT_SIZE,
} from "../geometry";
import { MetalSurface } from "../materials/Surfaces";
import { getBauleTexture } from "../materials/textures";

/**
 * Baule dell'archivio (Fase 9): la cassa dei ricordi del Reparto.
 *
 * Più grande e più vissuto della cassetta (che tiene i membri), è il baule che
 * viaggia ai campi: dentro ci sono le uscite, i campi, i luoghi, le fotografie
 * e i documenti della storia del Reparto. Apre la superficie dell'Archivio
 * come ogni altro oggetto del tavolo (DEC-019).
 */

const BAULE = OBJECT_SIZE.baule;
const BODY_HEIGHT = 0.15;

export function Baule3D() {
  const map = useMemo(() => getBauleTexture(), []);

  return (
    <group>
      {/* Corpo: cassa di legno, centrata rispetto all'ingombro dichiarato. */}
      <mesh
        castShadow
        receiveShadow
        geometry={BAULE_BODY_GEOMETRY}
        position={[0, -BAULE.height / 2 + BODY_HEIGHT / 2, 0]}
      >
        <meshStandardMaterial map={map} roughness={0.8} metalness={0.02} />
      </mesh>

      {/* Coperchio leggermente sollevato: un baule che si riapre di continuo. */}
      <mesh
        castShadow
        receiveShadow
        geometry={BAULE_LID_GEOMETRY}
        position={[0, BAULE.height / 2 - 0.008, 0.008]}
        rotation={[-0.05, 0, 0]}
      >
        <meshStandardMaterial map={map} roughness={0.74} metalness={0.02} />
      </mesh>

      {/* Due fasce di ottone che tengono il coperchio, come su un baule da campo. */}
      {[-0.14, 0.14].map((x) => (
        <mesh
          key={x}
          castShadow
          geometry={BAULE_STRAP_GEOMETRY}
          position={[
            x,
            -BAULE.height / 2 + BODY_HEIGHT / 2,
            BAULE.depth / 2 + 0.004,
          ]}
        >
          <MetalSurface roughness={0.42} />
        </mesh>
      ))}
    </group>
  );
}
