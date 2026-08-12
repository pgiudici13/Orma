"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import type { Group } from "three";
import {
  sceneObjectAriaLabel,
  type SceneObject,
  type SceneObjectKind,
} from "@/lib/scene/objects";
import { useSceneObjects } from "@/lib/scene/SceneDataContext";
import { useSceneStore } from "@/lib/scene/store";
import { SETTLED, damp } from "./animation";
import { Card3D } from "./Card3D";
import {
  Calendar3D,
  Compass3D,
  Notebook3D,
  Pencil3D,
  Sheet3D,
} from "./Props3D";

/** Quota di appoggio sul piano: metà dello spessore di ogni oggetto. */
const RESTING_Y: Record<SceneObjectKind, number> = {
  specialita: 0.003,
  competenza: 0.003,
  tappa: 0.003,
  taccuino: 0.025,
  calendario: 0.006,
  foglio: 0.001,
  matita: 0.008,
  bussola: 0.009,
};

const LIFT_FOCUSED = 0.17;
const LIFT_HOVERED = 0.02;
const TILT_FOCUSED = 0.28;
const LAMBDA = 7;

function ObjectMesh({ object }: { object: SceneObject }) {
  switch (object.kind) {
    case "specialita":
    case "competenza":
    case "tappa":
      return <Card3D object={object} />;
    case "taccuino":
      return <Notebook3D />;
    case "calendario":
      return <Calendar3D />;
    case "foglio":
      return <Sheet3D />;
    case "matita":
      return <Pencil3D />;
    case "bussola":
      return <Compass3D />;
  }
}

function PlacedObject({ object }: { object: SceneObject }) {
  const innerRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const focusedId = useSceneStore((state) => state.focusedId);
  const focus = useSceneStore((state) => state.focus);
  const invalidate = useThree((state) => state.invalidate);

  const isFocused = focusedId === object.id;
  const restingY = RESTING_Y[object.kind];

  useFrame((_, delta) => {
    const group = innerRef.current;
    if (!group) return;

    const targetY =
      restingY +
      (isFocused ? LIFT_FOCUSED : hovered && !focusedId ? LIFT_HOVERED : 0);
    const targetTilt = isFocused ? TILT_FOCUSED : 0;

    group.position.y = damp(group.position.y, targetY, LAMBDA, delta);
    group.rotation.x = damp(group.rotation.x, targetTilt, LAMBDA, delta);

    if (
      Math.abs(group.position.y - targetY) > SETTLED ||
      Math.abs(group.rotation.x - targetTilt) > SETTLED
    ) {
      invalidate();
    }
  });

  const setCursor = useCallback((value: string) => {
    document.body.style.cursor = value;
  }, []);

  const interactionProps = object.interactive
    ? {
        onClick: (event: {
          stopPropagation: () => void;
          nativeEvent: MouseEvent;
        }) => {
          event.stopPropagation();
          focus(object.id, {
            x: event.nativeEvent.clientX,
            y: event.nativeEvent.clientY,
          });
        },
        onPointerOver: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          setHovered(true);
          if (!focusedId) setCursor("pointer");
        },
        onPointerOut: () => {
          setHovered(false);
          setCursor("auto");
        },
      }
    : {};

  return (
    <group
      position={[object.spot[0], 0, object.spot[1]]}
      rotation={[0, (object.tilt * Math.PI) / 180, 0]}
    >
      <group ref={innerRef} position={[0, restingY, 0]} {...interactionProps}>
        <ObjectMesh object={object} />
      </group>

      {object.interactive ? <ObjectHotspot object={object} /> : null}
    </group>
  );
}

/**
 * Accessibilità (SDD NFR-6): ogni oggetto interattivo ha un bottone DOM
 * ancorato alla sua posizione. È trasparente e non intercetta il mouse — il
 * click passa alla mesh — ma è raggiungibile da Tab e attivabile da tastiera,
 * con anello di focus visibile sopra l'oggetto.
 */
function ObjectHotspot({ object }: { object: SceneObject }) {
  const focus = useSceneStore((state) => state.focus);

  return (
    <Html center position={[0, 0.02, 0]} zIndexRange={[20, 10]}>
      <button
        type="button"
        data-scene-hotspot={object.id}
        aria-label={sceneObjectAriaLabel(object)}
        className="h-24 w-20 cursor-pointer rounded-[3px] bg-transparent outline-offset-4 focus-visible:outline-2"
        style={{ pointerEvents: "none", outlineColor: "var(--accent)" }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          focus(object.id, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }}
      >
        <span className="sr-only">{sceneObjectAriaLabel(object)}</span>
      </button>
    </Html>
  );
}

export function SceneObjects() {
  const objects = useSceneObjects();
  return (
    <>
      {objects.map((object) => (
        <PlacedObject key={object.id} object={object} />
      ))}
    </>
  );
}
