import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertPublishedContentSecurity,
  assertSourceUrlPolicy,
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
  const policyNow = new Date("2026-07-15T12:00:00.000Z");
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
        { now: policyNow },
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
      { now: policyNow },
    );

    expect(violations.map(({ sourceId }) => sourceId)).toEqual([
      "unapproved",
      "legacy-standard",
      "active",
    ]);
    expect(violations.every(({ message }) => /https|approved|protocol/iu.test(message))).toBe(true);
  });

  it("rejects malformed, future, reversed, and expired HTTP approval dates", () => {
    const sources = [
      { id: "invalid-calendar", url: "http://example.test/invalid-calendar" },
      { id: "future-approval", url: "http://example.test/future" },
      { id: "reversed-window", url: "http://example.test/reversed" },
      { id: "expired-review", url: "http://example.test/expired" },
    ];
    const base = {
      reason: "Historical HTTP evidence under an explicitly time-bounded exception.",
      approved_by: "ontology-security-reviewer",
    };
    const allowlist = [
      {
        ...base,
        source_id: "invalid-calendar",
        url: "http://example.test/invalid-calendar",
        approved_on: "2026-02-30",
        review_by: "2027-07-13",
      },
      {
        ...base,
        source_id: "future-approval",
        url: "http://example.test/future",
        approved_on: "2026-07-16",
        review_by: "2027-07-13",
      },
      {
        ...base,
        source_id: "reversed-window",
        url: "http://example.test/reversed",
        approved_on: "2026-07-13",
        review_by: "2026-07-12",
      },
      {
        ...base,
        source_id: "expired-review",
        url: "http://example.test/expired",
        approved_on: "2025-07-13",
        review_by: "2026-07-14",
      },
    ];

    const violations = validateSourceUrlPolicy(sources, allowlist, { now: policyNow });

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "invalid-calendar",
          message: expect.stringMatching(/approved_on.*valid/iu),
        }),
        expect.objectContaining({
          sourceId: "future-approval",
          message: expect.stringMatching(/approved_on.*future/iu),
        }),
        expect.objectContaining({
          sourceId: "reversed-window",
          message: expect.stringMatching(/review_by.*approved_on/iu),
        }),
        expect.objectContaining({
          sourceId: "expired-review",
          message: expect.stringMatching(/review_by.*expired/iu),
        }),
      ]),
    );
  });

  it("validates malformed allowlist metadata and the injected policy clock", () => {
    const complete = {
      source_id: "invalid-url",
      url: "not a URL",
      reason: "Historical exception fixture.",
      approved_by: "ontology-security-reviewer",
      approved_on: "2026-07-13",
      review_by: "2027-07-13",
    };
    const malformedAllowlist = [
      null,
      { source_id: "missing-fields" },
      complete,
      { ...complete, source_id: "https-entry", url: "https://example.test/spec" },
      {
        ...complete,
        source_id: "bad-review",
        url: "http://example.test/spec",
        review_by: "July 2027",
      },
    ] as never;

    expect(
      validateSourceUrlPolicy([], malformedAllowlist, { now: "2026-07-15" }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "<unknown>",
          message: expect.stringMatching(/object/iu),
        }),
        expect.objectContaining({
          sourceId: "missing-fields",
          message: expect.stringMatching(/missing/iu),
        }),
        expect.objectContaining({
          sourceId: "invalid-url",
          message: expect.stringMatching(/invalid URL/iu),
        }),
        expect.objectContaining({
          sourceId: "https-entry",
          message: expect.stringMatching(/historical http/iu),
        }),
        expect.objectContaining({
          sourceId: "bad-review",
          message: expect.stringMatching(/review_by.*valid/iu),
        }),
      ]),
    );
    expect(() =>
      validateSourceUrlPolicy([], [], { now: "not-a-date" }),
    ).toThrow(/now.*valid date/iu);
  });

  it("rejects credential-bearing source URLs and exposes the asserting policy adapter", () => {
    const sources = [
      { id: "credentials", url: "https://user:secret@example.test/spec" },
      { id: "unparseable", url: "not a URL" },
    ];

    expect(
      validateSourceUrlPolicy(sources, [], { now: policyNow }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "credentials",
          message: expect.stringMatching(/credentials/iu),
        }),
        expect.objectContaining({
          sourceId: "unparseable",
          message: expect.stringMatching(/parseable/iu),
        }),
      ]),
    );
    expect(() => assertSourceUrlPolicy(sources, [], { now: policyNow })).toThrow(
      /Source URL policy failed/iu,
    );
    expect(() =>
      assertSourceUrlPolicy(
        [{ id: "secure", url: "https://example.test/spec" }],
        [],
        { now: policyNow },
      ),
    ).not.toThrow();
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

    expect(validateSourceUrlPolicy(registry, allowlist, { now: policyNow })).toEqual([]);
  });
});
