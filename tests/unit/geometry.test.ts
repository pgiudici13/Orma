import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_GEOMETRY, OBJECT_SIZE } from "@/components/three/geometry";

const THREE_DIR = join(process.cwd(), "components/three");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("geometrie condivise", () => {
  it("espone una sola istanza di geometria carta, con lo spessore dichiarato", () => {
    // Il vincolo di CLAUDE.md è "stesso modello 3D, texture diverse": ogni
    // carta deve puntare a questa istanza, non crearne una propria.
    CARD_GEOMETRY.computeBoundingBox();
    const box = CARD_GEOMETRY.boundingBox!;

    // La lastra è centrata sul proprio spessore e misura quanto dichiarato in
    // OBJECT_SIZE: è da lì che derivano quota di appoggio e volume di presa.
    expect(box.max.y - box.min.y).toBeCloseTo(OBJECT_SIZE.specialita.height, 4);
    expect(box.max.y).toBeCloseTo(OBJECT_SIZE.specialita.height / 2, 4);
    expect(box.max.x - box.min.x).toBeCloseTo(OBJECT_SIZE.specialita.width, 4);
  });

  it("non crea geometrie fuori da geometry.ts", () => {
    const offenders = sourceFiles(THREE_DIR)
      .filter((path) => !path.endsWith("geometry.ts"))
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return (
          /new\s+(Box|Plane|Cylinder|Sphere|Circle|Torus)Geometry/.test(
            source,
          ) || /<(box|plane|cylinder|sphere|circle|torus)Geometry/.test(source)
        );
      });

    expect(offenders).toEqual([]);
  });
});
