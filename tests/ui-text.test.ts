import { describe, expect, it } from "vitest";

import { uiText } from "../src/i18n/ui-text";

describe("ontology UI translations", () => {
  it("keeps every formatter executable in every supported language", () => {
    for (const [language, copy] of Object.entries(uiText)) {
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value !== "function") continue;
        const rendered = value.length === 2
          ? (value as (first: number, second: number) => string)(2, 5)
          : key === "focusNode" || key === "focusRelation"
            ? (value as (label: string) => string)("AgentRun")
            : (value as (count: number) => string)(5);
        expect(rendered, `${language}.${key}`).toBeTypeOf("string");
        expect(rendered.length, `${language}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("provides readable labels for every viewer-derived organization edge", () => {
    for (const copy of Object.values(uiText)) {
      expect(Object.keys(copy.derivedRelationLabels).sort()).toEqual([
        "contains_domain",
        "contains_module",
        "declares_concept",
      ]);
      expect(Object.keys(copy.derivedRelationDefinitions).sort()).toEqual([
        "contains_domain",
        "contains_module",
        "declares_concept",
      ]);
      expect(Object.values(copy.derivedRelationLabels).every(Boolean)).toBe(true);
      expect(Object.values(copy.derivedRelationDefinitions).every(Boolean)).toBe(true);
    }
  });
});
