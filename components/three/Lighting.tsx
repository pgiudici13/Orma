"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useMemo } from "react";
import type { SceneQuality } from "@/lib/scene/useSceneCapabilities";
import { materialColor } from "./materials/palette";
import { LAMP_FLAME_HEIGHT, LAMP_SPOT } from "./props/GasLamp";

/**
 * Illuminazione della scena.
 *
 * L'intento è un tavolo scout alla fine della giornata: la luce dominante è
 * quella calda della lampada a gas appoggiata sul piano, la finestra dietro
 * resta come luce fredda di riempimento. Il contrasto fra le due è quello che
 * dà volume agli oggetti — con una sola sorgente diffusa la carta sembra
 * cartone stampato (vedi la baseline in `.claude/CORRECTIONS.md`, RD-T04).
 *
 * L'ambiente non è un file HDRI ma una manciata di pannelli luminosi disegnati
 * qui e cotti una volta sola in una cubemap (`frames={1}`): nessun asset da
 * scaricare o da verificare per licenza, e i materiali hanno finalmente
 * qualcosa da riflettere.
 */

/** Luce fredda che entra dalla finestra dietro il tavolo. */
const WINDOW_COLOR = "#cddaef";

export function Lighting({ quality }: { quality: SceneQuality }) {
  const highQuality = quality === "alto";
  const lampColor = useMemo(() => materialColor("--lamp-flame"), []);

  return (
    <>
      <Environment resolution={highQuality ? 256 : 128} frames={1}>
        {/* Finestra: un pannello largo e freddo dietro/sopra il tavolo. */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color={WINDOW_COLOR}
          position={[-1.2, 3, -2.4]}
          rotation={[Math.PI / 2.6, 0, 0]}
          scale={[4, 3, 1]}
        />
        {/* Alone caldo della lampada: illumina anche ciò che non vede la
            fiamma direttamente, come farebbe la luce rimbalzata sul piano. */}
        <Lightformer
          form="circle"
          intensity={2.4}
          color={lampColor}
          position={[LAMP_SPOT[0], 0.6, LAMP_SPOT[1]]}
          scale={[1.2, 1.2, 1]}
        />
        {/* Legno del tavolo visto dagli oggetti: rimbalzo bruno dal basso,
            evita che i bordi rivolti in giù diventino neri. */}
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#6b4a2c"
          position={[0, -1.4, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[6, 4, 1]}
        />
      </Environment>

      {/* Riempimento minimo: la scena vive di ambiente e lampada, non di
          luce diffusa piatta. */}
      <hemisphereLight args={["#8fa3c4", "#2a1d12", 0.35]} />

      {/* Finestra come sorgente direzionale: è la luce che proietta l'ombra
          principale, l'unica con ombre sul livello base. */}
      <directionalLight
        castShadow
        position={[1.9, 3.1, -1.6]}
        intensity={1.15}
        color={WINDOW_COLOR}
        shadow-mapSize-width={highQuality ? 2048 : 1024}
        shadow-mapSize-height={highQuality ? 2048 : 1024}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-camera-left={-2.4}
        shadow-camera-right={2.4}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0006}
        shadow-normalBias={0.015}
      />

      {/* Fiamma della lampada: luce puntiforme con decadimento fisico, quindi
          gli oggetti vicini sono davvero più illuminati di quelli lontani.
          Proietta ombre solo sul livello alto (budget, `docs/SDD.md` §10). */}
      <pointLight
        castShadow={highQuality}
        position={[LAMP_SPOT[0], LAMP_FLAME_HEIGHT, LAMP_SPOT[1]]}
        intensity={2.4}
        distance={4.2}
        decay={2}
        color={lampColor}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.004}
        shadow-normalBias={0.02}
      />
    </>
  );
}
