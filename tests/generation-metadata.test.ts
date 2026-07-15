import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  deterministicGeneratedAt,
  ONTOLOGY_GENERATOR_VERSION,
} from "../scripts/lib/generation-metadata.mjs";
import { sourceTreeFingerprint } from "../scripts/lib/stable-json.mjs";

describe("deterministic ontology generation metadata", () => {
  it("uses SOURCE_DATE_EPOCH when supplied", () => {
    expect(deterministicGeneratedAt("2026-07-03", "1783900800")).toBe(
      "2026-07-13T00:00:00.000Z",
    );
  });

  it("falls back to the reviewed product release date", () => {
    expect(deterministicGeneratedAt("2026-07-03", undefined)).toBe(
      "2026-07-03T00:00:00.000Z",
    );
    expect(ONTOLOGY_GENERATOR_VERSION).toBe("moonweave-ontology-builder/2.0.0");
  });

  it.each(["1.25", "not-an-epoch", ""])(
    "rejects a non-integer SOURCE_DATE_EPOCH value %j",
    (epoch) => {
      expect(() => deterministicGeneratedAt("2026-07-03", epoch)).toThrow(
        /SOURCE_DATE_EPOCH must be an integer/iu,
      );
    },
  );

  it("rejects unsafe epochs and invalid product dates", () => {
    expect(() => deterministicGeneratedAt("2026-07-03", "99999999999999999")).toThrow(
      /outside the supported date range/iu,
    );
    expect(() => deterministicGeneratedAt("not-a-date", undefined)).toThrow(
      /Product release date is invalid/iu,
    );
  });

  it("fingerprints normalized paths, byte lengths, and raw bytes without reserialization", () => {
    const first = Buffer.from("a\r\nb", "utf8");
    const second = Buffer.from([0, 255, 10]);
    const expected = createHash("sha256")
      .update("a/source.json")
      .update("\u0000")
      .update(String(first.byteLength), "ascii")
      .update("\u0000")
      .update(first)
      .update("z/evidence.csv")
      .update("\u0000")
      .update(String(second.byteLength), "ascii")
      .update("\u0000")
      .update(second)
      .digest("hex");

    expect(
      sourceTreeFingerprint([
        ["z\\evidence.csv", second],
        ["a/source.json", first],
      ]),
    ).toBe(expected);
  });
});
