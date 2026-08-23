"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { findSceneObject } from "@/lib/scene/objects";
import { useSceneObjects } from "@/lib/scene/SceneDataContext";
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

const REST_POSITION = new Vector3(0, 2.35, 2.1);
const REST_TARGET = new Vector3(0, 0, 0.02);
/** Avvicinamento all'oggetto: lento e contemplativo, come "prendere in mano"
 *  l'oggetto (`docs/UX.md`). */
const LAMBDA = 4.2;
/** Ritorno al tavolo: più rapido, così pannello, blur e camera arrivano a
 *  riposo insieme e la scena non continua a scivolare dopo la chiusura. */
const LAMBDA_RETURN = 6.5;

export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const focusedId = useSceneStore((state) => state.focusedId);
  // La lista realmente montata, non il set dimostrativo: le carte reali hanno
  // id derivati dai dati (`specialita:<slug>`) e cercarle altrove significava
  // sollevare un'eccezione dentro `useFrame`, ad ogni frame.
  const objects = useSceneObjects();

  const lookAt = useRef(REST_TARGET.clone());
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  /**
   * Frame da disegnare ancora dopo che la camera è arrivata.
   *
   * Gli hotspot DOM sono ancorati agli oggetti da drei, che ne ricalcola la
   * posizione sullo schermo dentro il proprio `useFrame`. Fermare il render
   * loop nell'istante esatto in cui la camera arriva li lascerebbe fermi
   * all'ultima proiezione calcolata: visibilmente giusti, ma cliccabili dove
   * la camera era un attimo prima.
   */
  const trailingFrames = useRef(0);

  // Priorità negativa: la camera si muove **prima** che gli overlay DOM
  // proiettino la propria posizione. Con l'ordine inverso ogni hotspot
  // resterebbe indietro di un frame rispetto a ciò che si vede.
  useFrame((_, delta) => {
    const focused = focusedId ? findSceneObject(objects, focusedId) : undefined;

    if (focused) {
      const [x, z] = focused.spot;
      desiredPosition.current.set(x + 0.42, 1.34, z + 1.02);
      desiredTarget.current.set(x + 0.42, 0.08, z);
    } else {
      desiredPosition.current.copy(REST_POSITION);
      desiredTarget.current.copy(REST_TARGET);
    }

    const lambda = focused ? LAMBDA : LAMBDA_RETURN;

    camera.position.set(
      damp(camera.position.x, desiredPosition.current.x, lambda, delta),
      damp(camera.position.y, desiredPosition.current.y, lambda, delta),
      damp(camera.position.z, desiredPosition.current.z, lambda, delta),
    );

    lookAt.current.set(
      damp(lookAt.current.x, desiredTarget.current.x, lambda, delta),
      damp(lookAt.current.y, desiredTarget.current.y, lambda, delta),
      damp(lookAt.current.z, desiredTarget.current.z, lambda, delta),
    );

    camera.lookAt(lookAt.current);

    const moving =
      camera.position.distanceToSquared(desiredPosition.current) > SETTLED ||
      lookAt.current.distanceToSquared(desiredTarget.current) > SETTLED;

    if (moving) {
      // Arrivati, la camera si posa esattamente sulla posa desiderata: senza
      // questo resterebbe a qualche millimetro, e gli hotspot con lei.
      trailingFrames.current = 2;
      invalidate();
      return;
    }

    camera.position.copy(desiredPosition.current);
    lookAt.current.copy(desiredTarget.current);
    camera.lookAt(lookAt.current);

    if (trailingFrames.current > 0) {
      trailingFrames.current -= 1;
      invalidate();
    }
  }, -1);

  return null;
}
