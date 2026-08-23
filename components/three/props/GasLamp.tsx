"use client";

import { useMemo } from "react";
import { AdditiveBlending, DoubleSide } from "three";
import {
  LAMP_BASE_GEOMETRY,
  LAMP_CAP_GEOMETRY,
  LAMP_COLLAR_GEOMETRY,
  LAMP_FLAME_GEOMETRY,
  LAMP_GLASS_GEOMETRY,
  LAMP_HALO_GEOMETRY,
  LAMP_HANDLE_GEOMETRY,
  LAMP_TANK_GEOMETRY,
} from "../geometry";
import { materialColor } from "../materials/palette";
import { MetalSurface } from "../materials/Surfaces";

/**
 * Lampada a gas appoggiata sul tavolo.
 *
 * È l'oggetto che spiega la luce: la sorgente calda della scena
 * (`components/three/Lighting.tsx`) è posizionata dentro questo vetro, così
 * l'illuminazione ha una causa visibile invece di essere un alone che compare
 * dal nulla sul piano.
 *
 * Decorativa per scelta: non intercetta eventi e non apre nulla — `docs/UX.md`
 * chiede che gli oggetti d'atmosfera restino tali e non generino falsi
 * affordance.
 *
 * Il vetro non usa `transmission`: la rifrazione fisica di Three.js costringe
 * il renderer a un passaggio aggiuntivo su tutta la scena, un costo che a
 * questa dimensione non si distingue da una superficie trasparente lucida.
 */

/** Posizione della lampada sul piano, in metri. */
export const LAMP_SPOT: readonly [x: number, z: number] = [-1.3, -0.5];

/**
 * Altezza della fiamma dentro il vetro: è qui che `Lighting` mette la
 * sorgente calda della scena, così la luce parte davvero da dove si vede.
 */
export const LAMP_FLAME_HEIGHT = 0.165;

export function GasLamp() {
  const brass = useMemo(() => materialColor("--brass-base"), []);
  const brassDark = useMemo(() => materialColor("--brass-dark"), []);
  const glass = useMemo(() => materialColor("--glass-warm"), []);
  const flame = useMemo(() => materialColor("--lamp-flame"), []);

  return (
    <group position={[LAMP_SPOT[0], 0, LAMP_SPOT[1]]} rotation={[0, 0.5, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={LAMP_BASE_GEOMETRY}
        position={[0, 0.012, 0]}
      >
        <MetalSurface color={brassDark} roughness={0.42} />
      </mesh>

      <mesh
        castShadow
        receiveShadow
        geometry={LAMP_TANK_GEOMETRY}
        position={[0, 0.059, 0]}
      >
        <MetalSurface color={brass} roughness={0.3} />
      </mesh>

      <mesh
        castShadow
        geometry={LAMP_COLLAR_GEOMETRY}
        position={[0, 0.1035, 0]}
      >
        <MetalSurface color={brassDark} roughness={0.5} />
      </mesh>

      {/* Vetro affumicato dall'uso: lascia passare la fiamma, non sparisce. */}
      <mesh geometry={LAMP_GLASS_GEOMETRY} position={[0, 0.1805, 0]}>
        <meshPhysicalMaterial
          color={glass}
          transparent
          opacity={0.3}
          roughness={0.07}
          metalness={0}
          side={DoubleSide}
          envMapIntensity={1.6}
          depthWrite={false}
        />
      </mesh>

      <mesh castShadow geometry={LAMP_CAP_GEOMETRY} position={[0, 0.267, 0]}>
        <MetalSurface color={brass} roughness={0.36} />
      </mesh>

      <mesh castShadow geometry={LAMP_HANDLE_GEOMETRY} position={[0, 0.28, 0]}>
        <MetalSurface color={brassDark} roughness={0.45} />
      </mesh>

      {/* Fiamma: emette luce propria, quindi non la si illumina — la si vede. */}
      <mesh
        geometry={LAMP_FLAME_GEOMETRY}
        position={[0, LAMP_FLAME_HEIGHT, 0]}
        scale={[1, 2.1, 1]}
      >
        <meshStandardMaterial
          color={flame}
          emissive={flame}
          emissiveIntensity={2.6}
          roughness={1}
        />
      </mesh>

      {/* Alone del vetro illuminato dall'interno. Additivo e molto tenue:
          senza post-processing è così che si ottiene un bagliore credibile
          invece di un effetto da videogioco (DEC-014). */}
      <mesh geometry={LAMP_HALO_GEOMETRY} position={[0, LAMP_FLAME_HEIGHT, 0]}>
        <meshBasicMaterial
          color={flame}
          transparent
          opacity={0.13}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
