import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = resolve(import.meta.dirname, "../ontology/source");

const sourceJsonPaths = (): readonly string[] => [
  resolve(sourceRoot, "agent-ontology.product.json"),
  ...readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((plane) =>
      readdirSync(resolve(sourceRoot, plane.name))
        .filter((name) => name.endsWith(".json"))
        .map((name) => resolve(sourceRoot, plane.name, name)),
    ),
];

const corruptedTextPaths = (value: unknown, jsonPath = "$"): string[] => {
  if (typeof value === "string") {
    return value.includes("\uFFFD") || /\?{2,}/u.test(value) ? [jsonPath] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => corruptedTextPaths(item, `${jsonPath}[${index}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      corruptedTextPaths(item, `${jsonPath}.${key}`),
    );
  }
  return [];
};

describe("ontology source text integrity", () => {
  it("rejects replacement characters and consecutive question-mark encoding loss", () => {
    const invalid = sourceJsonPaths().flatMap((filePath) => {
      const source = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
      return corruptedTextPaths(source).map((jsonPath) => `${filePath}:${jsonPath}`);
    });

    expect(invalid).toEqual([]);
  });
});
