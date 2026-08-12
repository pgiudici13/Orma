import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_GEOMETRY } from "@/components/three/geometry";

const THREE_DIR = join(process.cwd(), "components/three");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("geometrie condivise", () => {
  it("espone una sola istanza di geometria carta", () => {
    // Il vincolo di CLAUDE.md è "stesso modello 3D, texture diverse": ogni
    // carta deve puntare a questa istanza, non crearne una propria.
    expect(CARD_GEOMETRY.type).toBe("BoxGeometry");
    expect(CARD_GEOMETRY.uuid).toBe(CARD_GEOMETRY.uuid);
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
