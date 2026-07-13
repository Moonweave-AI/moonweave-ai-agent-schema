import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertPublishedContentSecurity,
  validateSourceUrlPolicy,
} from "../scripts/lib/ontology-security-gates.mjs";
import { parseCsv } from "../scripts/lib/csv.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");

describe("recursive published-content security gate", () => {
  it("rejects hidden reasoning payload keys at any nesting depth", () => {
    expect(() =>
      assertPublishedContentSecurity({
        documents: [
          {
            label: "nested fixture",
            value: { examples: [{ payload: { private_reasoning: "must not publish" } }] },
          },
        ],
        uiFiles: [],
      }),
    ).toThrow(/nested fixture.*private_reasoning.*private reasoning payload key/iu);
  });

  it("allows policy text that explicitly excludes private reasoning", () => {
    expect(() =>
      assertPublishedContentSecurity({
        documents: [
          {
            label: "policy",
            value: {
              expression:
                "Canonical records observable evidence and never stores private chain-of-thought.",
            },
          },
        ],
        uiFiles: [],
      }),
    ).not.toThrow();
  });

  it("rejects private-reasoning transcript markers and sensitive absolute locators", () => {
    expect(() =>
      assertPublishedContentSecurity({
        documents: [
          {
            label: "leaked transcript",
            value: { description: "<thinking>secret intermediate reasoning</thinking>" },
          },
          {
            label: "leaked locator",
            value: { source_claims: [{ locator: "C:\\Users\\alice\\private\\notes.md" }] },
          },
        ],
        uiFiles: [],
      }),
    ).toThrow(/<thinking>|sensitive absolute path/iu);
  });

  it("rejects unsafe React HTML insertion from UI source files", () => {
    expect(() =>
      assertPublishedContentSecurity({
        documents: [],
        uiFiles: [
          {
            label: "src/Unsafe.tsx",
            text: "export const Unsafe = () => <div dangerouslySetInnerHTML={{ __html: value }} />;",
          },
        ],
      }),
    ).toThrow(/src\/Unsafe\.tsx.*dangerouslySetInnerHTML/iu);
  });
});

describe("source URL protocol policy", () => {
  const approvedHttp = [
    {
      source_id: "legacy-standard",
      url: "http://standards.example.test/spec",
      reason: "The historical standards host has no working HTTPS endpoint.",
      approved_by: "ontology-security-reviewer",
      approved_on: "2026-07-13",
      review_by: "2027-07-13",
    },
  ] as const;

  it("accepts HTTPS and an exact, audited historical HTTP exception", () => {
    expect(
      validateSourceUrlPolicy(
        [
          { id: "secure", url: "https://example.test/reference" },
          { id: "legacy-standard", url: "http://standards.example.test/spec" },
        ],
        approvedHttp,
      ),
    ).toEqual([]);
  });

  it("rejects unapproved HTTP, mismatched exceptions, and active-content schemes", () => {
    const violations = validateSourceUrlPolicy(
      [
        { id: "unapproved", url: "http://example.test/reference" },
        { id: "legacy-standard", url: "http://standards.example.test/other" },
        { id: "active", url: "javascript:alert(1)" },
      ],
      approvedHttp,
    );

    expect(violations.map(({ sourceId }) => sourceId)).toEqual([
      "unapproved",
      "legacy-standard",
      "active",
    ]);
    expect(violations.every(({ message }) => /https|approved|protocol/iu.test(message))).toBe(true);
  });

  it("keeps the repository registry aligned with the audited allowlist", () => {
    const registry = parseCsv(
      readFileSync(resolve(repositoryRoot, "research/source-registry.csv")),
    ).map(({ id, url }) => ({ id, url }));
    const allowlist = JSON.parse(
      readFileSync(resolve(repositoryRoot, "research/source-http-allowlist.json"), "utf8"),
    ) as readonly {
      source_id: string;
      url: string;
      reason: string;
      approved_by: string;
      approved_on: string;
      review_by: string;
    }[];

    expect(validateSourceUrlPolicy(registry, allowlist)).toEqual([]);
  });
});
