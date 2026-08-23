"use client";

import { useMemo } from "react";
import {
  CASSETTA_BODY_GEOMETRY,
  CASSETTA_LID_GEOMETRY,
  CASSETTA_STRAP_GEOMETRY,
  GUIDONE_CLOTH_GEOMETRY,
  GUIDONE_STAFF_GEOMETRY,
  OBJECT_SIZE,
} from "../geometry";
import { materialColor } from "../materials/palette";
import { FabricSurface, MetalSurface } from "../materials/Surfaces";
import { getCassettaTexture, getGuidoneTexture } from "../materials/textures";

/**
 * Oggetti della vita di Reparto (RD-T06).
 *
 * La cassetta è la cassa di legno che ogni Reparto ha in sede: dentro ci sono i
 * suoi membri. Il guidone è il drappo di Squadriglia, posato sull'asta.
 * Entrambi aprono la propria superficie nel pannello, come ogni altro oggetto
 * del tavolo: nessuna funzionalità vive fuori da qui (DEC-019).
 */

const CASSETTA = OBJECT_SIZE.cassetta;
const BODY_HEIGHT = CASSETTA.height * 0.78;

export function Cassetta3D() {
  const map = useMemo(() => getCassettaTexture(), []);
  const leather = useMemo(() => materialColor("--brass-dark"), []);

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        geometry={CASSETTA_BODY_GEOMETRY}
        position={[0, -CASSETTA.height / 2 + BODY_HEIGHT / 2, 0]}
      >
        <meshStandardMaterial map={map} roughness={0.78} metalness={0.02} />
      </mesh>

      {/* Coperchio appena sollevato sul retro: una cassa richiusa in fretta. */}
      <mesh
        castShadow
        receiveShadow
        geometry={CASSETTA_LID_GEOMETRY}
        position={[0, CASSETTA.height / 2 - 0.004, 0.006]}
        rotation={[-0.06, 0, 0]}
      >
        <meshStandardMaterial map={map} roughness={0.72} metalness={0.02} />
      </mesh>

      <mesh
        castShadow
        geometry={CASSETTA_STRAP_GEOMETRY}
        position={[
          0,
          -CASSETTA.height / 2 + BODY_HEIGHT / 2,
          CASSETTA.depth / 2 + 0.002,
        ]}
      >
        <meshStandardMaterial
          color={leather}
          roughness={0.62}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

export function Guidone3D() {
  const map = useMemo(() => getGuidoneTexture(), []);
  const staff = useMemo(() => materialColor("--wood-grain"), []);

  return (
    <group>
      {/* Asta coricata lungo X, come appoggiata sul tavolo. */}
      <mesh
        castShadow
        receiveShadow
        geometry={GUIDONE_STAFF_GEOMETRY}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, -OBJECT_SIZE.guidone.height / 2 + 0.006, 0]}
      >
        <meshStandardMaterial color={staff} roughness={0.6} metalness={0.03} />
      </mesh>

      {/* Puntale metallico. */}
      <mesh
        castShadow
        geometry={GUIDONE_STAFF_GEOMETRY}
        rotation={[0, 0, Math.PI / 2]}
        position={[
          OBJECT_SIZE.guidone.width * 0.42,
          -OBJECT_SIZE.guidone.height / 2 + 0.006,
          0,
        ]}
        scale={[1.15, 0.12, 1.15]}
      >
        <MetalSurface roughness={0.4} />
      </mesh>

      {/* Drappo, appoggiato appena sopra l'asta. */}
      <mesh
        castShadow
        receiveShadow
        geometry={GUIDONE_CLOTH_GEOMETRY}
        position={[-OBJECT_SIZE.guidone.width / 2 + 0.01, 0.002, 0]}
      >
        <FabricSurface map={map} />
      </mesh>
    </group>
  );
}
