import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import {
  HIT_GEOMETRY,
  OBJECT_SIZE,
  hitScale,
  restingHeight,
} from "@/components/three/geometry";
import { SCENE_OBJECTS } from "@/lib/scene/objects";

/**
 * Il volume di presa (`components/three/HitProxy.tsx`) esiste solo per essere
 * intersecato: non viene mai disegnato. Questi test fissano le due proprietà da
 * cui dipende, così una regressione si vede qui e non a mano nel browser.
 */

/** Raycast verticale dall'alto verso il basso sul punto indicato del piano. */
function castFromAbove(target: Mesh, x = 0, z = 0) {
  const raycaster = new Raycaster(
    new Vector3(x, 2, z),
    new Vector3(0, -1, 0).normalize(),
  );
  target.updateMatrixWorld(true);
  return raycaster.intersectObject(target, true);
}

describe("volume di presa degli oggetti", () => {
  it("una mesh invisibile resta intersecabile dal raycaster", () => {
    // Comportamento di Three.js su cui si regge `HitProxy`: se un
    // aggiornamento della libreria reintroducesse l'esclusione degli oggetti
    // invisibili dal raycasting, gli oggetti del tavolo tornerebbero non
    // cliccabili e questo test fallirebbe per primo.
    const mesh = new Mesh(HIT_GEOMETRY, new MeshBasicMaterial());
    mesh.visible = false;

    expect(castFromAbove(mesh)).toHaveLength(2);
  });

  it("dà a ogni oggetto interattivo un bersaglio più largo della sua sagoma", () => {
    for (const object of SCENE_OBJECTS.filter((item) => item.interactive)) {
      const size = OBJECT_SIZE[object.kind];
      const [width, height, depth] = hitScale(object.kind);

      expect(width).toBeGreaterThanOrEqual(size.width);
      expect(height).toBeGreaterThan(size.height);
      expect(depth).toBeGreaterThanOrEqual(size.depth);
    }
  });

  it("copre il foglio, l'oggetto più sottile del tavolo", () => {
    // 2 mm di spessore: senza volume di presa si può cliccare solo di taglio.
    const mesh = new Mesh(HIT_GEOMETRY, new MeshBasicMaterial());
    mesh.visible = false;
    mesh.scale.set(...hitScale("foglio"));
    mesh.position.y = restingHeight("foglio");

    // Un punto appena fuori dalla sagoma visibile del foglio, ma dentro il
    // volume di presa.
    const offsetX = OBJECT_SIZE.foglio.width / 2 + 0.01;

    expect(castFromAbove(mesh, offsetX, 0).length).toBeGreaterThan(0);
  });
});

describe("quota di appoggio", () => {
  it("posa ogni oggetto esattamente sul piano del tavolo", () => {
    for (const object of SCENE_OBJECTS) {
      expect(restingHeight(object.kind)).toBeCloseTo(
        OBJECT_SIZE[object.kind].height / 2,
        6,
      );
    }
  });
});
