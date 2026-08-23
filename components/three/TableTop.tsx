"use client";

import { useSceneStore } from "@/lib/scene/store";
import { TABLE_GEOMETRY } from "./geometry";
import { WoodSurface } from "./materials/Surfaces";

/**
 * Piano del tavolo: un unico blocco di legno con bordo visibile, così la scena
 * ha un limite fisico invece di un fondale infinito.
 *
 * Un click sul piano chiude l'oggetto a fuoco: si "posa" ciò che si aveva in
 * mano tornando al tavolo.
 */
export function TableTop() {
  const clear = useSceneStore((state) => state.clear);

  return (
    <mesh
      receiveShadow
      geometry={TABLE_GEOMETRY}
      position={[0, -0.045, 0]}
      name="table-top"
      onClick={() => clear()}
    >
      <WoodSurface />
    </mesh>
  );
}
