"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { getSceneObject } from "@/lib/scene/objects";
import { useSceneStore } from "@/lib/scene/store";
import { SETTLED, damp } from "./animation";

/**
 * Movimento della camera: due sole pose — riposo sul tavolo e avvicinamento
 * all'oggetto a fuoco. Nessuna camera libera esplorabile (SDD §10).
 *
 * Quando un oggetto è a fuoco la camera guarda leggermente alla sua destra,
 * così l'oggetto resta nella metà sinistra dello schermo e il pannello di
 * contenuto non lo copre.
 */

const REST_POSITION = new Vector3(0, 2.05, 1.75);
const REST_TARGET = new Vector3(0, 0, 0.02);
const LAMBDA = 4.2;

export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const focusedId = useSceneStore((state) => state.focusedId);

  const lookAt = useRef(REST_TARGET.clone());
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());

  useFrame((_, delta) => {
    if (focusedId) {
      const object = getSceneObject(focusedId);
      const [x, z] = object.spot;
      desiredPosition.current.set(x + 0.42, 1.34, z + 1.02);
      desiredTarget.current.set(x + 0.42, 0.08, z);
    } else {
      desiredPosition.current.copy(REST_POSITION);
      desiredTarget.current.copy(REST_TARGET);
    }

    camera.position.set(
      damp(camera.position.x, desiredPosition.current.x, LAMBDA, delta),
      damp(camera.position.y, desiredPosition.current.y, LAMBDA, delta),
      damp(camera.position.z, desiredPosition.current.z, LAMBDA, delta),
    );

    lookAt.current.set(
      damp(lookAt.current.x, desiredTarget.current.x, LAMBDA, delta),
      damp(lookAt.current.y, desiredTarget.current.y, LAMBDA, delta),
      damp(lookAt.current.z, desiredTarget.current.z, LAMBDA, delta),
    );

    camera.lookAt(lookAt.current);

    if (
      camera.position.distanceToSquared(desiredPosition.current) > SETTLED ||
      lookAt.current.distanceToSquared(desiredTarget.current) > SETTLED
    ) {
      invalidate();
    }
  });

  return null;
}
