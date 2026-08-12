"use client";

/**
 * Illuminazione della scena: una sola sorgente proietta ombre (budget di
 * performance, `docs/SDD.md` §10), il resto è luce di riempimento.
 *
 * L'intento è luce naturale di finestra, non un set fotografico: ombre morbide
 * e direzionali, nessun contrasto teatrale (`docs/DESIGN.md`).
 */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#e8dfc8", "#3a2c1c", 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[1.9, 3.1, 1.4]}
        intensity={2.1}
        color="#fff3dd"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-camera-left={-2.4}
        shadow-camera-right={2.4}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0006}
        shadow-normalBias={0.015}
      />
    </>
  );
}
