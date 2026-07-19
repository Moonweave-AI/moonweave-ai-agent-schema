import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
  readonly definitions?: { readonly en?: unknown };
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: Readonly<Record<string, unknown>>;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly source?: unknown;
  readonly evidence_kind?: unknown;
};

type Constraint = {
  readonly id?: unknown;
  readonly expression?: unknown;
  readonly explanation?: {
    readonly zh?: unknown;
    readonly en?: unknown;
    readonly ja?: unknown;
  };
};

type Node = {
  readonly id?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly target?: unknown;
  } | null;
  readonly semantics?: {
    readonly short_definition?: { readonly en?: unknown };
    readonly definition?: { readonly en?: unknown };
    readonly why_needed?: { readonly en?: unknown };
    readonly includes?: readonly unknown[];
    readonly excludes?: readonly unknown[];
  };
  readonly engineering?: {
    readonly explanation?: { readonly en?: unknown };
    readonly typical_input?: readonly { readonly format?: unknown }[];
    readonly typical_output?: readonly { readonly format?: unknown }[];
    readonly reference_implementations?: readonly unknown[];
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
    readonly constraints?: readonly Constraint[];
  };
  readonly examples?: readonly Example[];
  readonly source_claims?: readonly SourceClaim[];
  readonly axioms?: unknown;
  readonly validation?: unknown;
  readonly adaptation_mappings?: unknown;
  readonly maturity?: unknown;
  readonly change?: unknown;
};

const contentRoot = (...segments: readonly string[]): string => resolve(
  "ontology",
  "info-plane",
  "info-content-parts",
  ...segments,
  "node.yaml",
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(
  contentRoot(...segments),
  "utf8",
)) as Node;

const fields = (value: Node): readonly Field[] => value.structure?.fields ?? [];
const fieldIds = (value: Node, requiredOnly = false): readonly string[] => fields(value).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

const text = (value: unknown): string => typeof value === "string" ? value : "";

const contentPartCases = [
  {
    id: "TextContent",
    path: ["ContentPart", "TextContent"],
    kind: "text",
    specializedRequiredFields: ["text"],
    protocolClaims: ["claim-text-content-a2a", "claim-text-content-mcp", "claim-text-content-openai"],
    inputMarkers: ['"text"', '"input_text"'],
    outputMarkers: ['"type": "text"', '"kind": "text"'],
  },
  {
    id: "ImageContent",
    path: ["ContentPart", "ImageContent"],
    kind: "image",
    specializedRequiredFields: ["image_source", "media_type"],
    protocolClaims: ["claim-image-content-a2a", "claim-image-content-mcp", "claim-image-content-openai"],
    inputMarkers: ['"input_image"', '"type": "image"'],
    outputMarkers: ['"url"', '"file_id"'],
  },
  {
    id: "AudioContent",
    path: ["ContentPart", "AudioContent"],
    kind: "audio",
    specializedRequiredFields: ["audio_source", "media_type"],
    protocolClaims: ["claim-audio-content-a2a", "claim-audio-content-mcp", "claim-audio-content-openai"],
    inputMarkers: ['"input_audio"', '"type": "audio"'],
    outputMarkers: ['"url"', '"derived-transcript"'],
  },
  {
    id: "FileAttachment",
    path: ["ContentPart", "FileAttachment"],
    kind: "file",
    specializedRequiredFields: ["access_mode", "locator_or_bytes", "media_type"],
    protocolClaims: ["claim-file-attachment-a2a", "claim-file-attachment-openai", "claim-file-attachment-mcp-prompt", "claim-file-attachment-mcp-tool"],
    inputMarkers: ['"input_file"', '"file_url"'],
    outputMarkers: ['"resource_link"', '"file_data"'],
  },
  {
    id: "StructuredData",
    path: ["ContentPart", "StructuredData"],
    kind: "data",
    specializedRequiredFields: ["data"],
    protocolClaims: ["claim-structured-data-a2a", "claim-structured-data-openai-boundary", "claim-structured-data-mcp-boundary"],
    inputMarkers: ['"data"', '"application/json"'],
    outputMarkers: ['"parts"', "No documented OpenAI Responses input_data item"],
  },
] as const;

describe("info-content-parts retained contracts", () => {
  it("retains ContentPart identity and required fields in every direct subtype", () => {
    const parent = node("ContentPart");
    const parentContract = [
      ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
      ...fieldIds(parent, true),
    ];

    for (const testCase of contentPartCases) {
      const child = node(...testCase.path);
      const ids = fieldIds(child);
      const kindField = fields(child).find((field) => field.id === "kind");

      expect(child.id).toBe(testCase.id);
      expect(child.parent_relation).toMatchObject({
        predicate: "is_a",
        target: "concept:ContentPart",
      });
      expect(ids, `${testCase.id} must retain ContentPart's source contract`).toEqual(
        expect.arrayContaining([...new Set(parentContract)]),
      );
      expect(fieldIds(child, true), `${testCase.id} keeps its specialized required fields`).toEqual(
        expect.arrayContaining(testCase.specializedRequiredFields),
      );
      expect(kindField).toMatchObject({ required: true });
      expect(text(kindField?.definitions?.en)).toContain("local");
    }
  });

  it("shows the complete inherited and specialized contract in every positive and instance", () => {
    const parent = node("ContentPart");

    for (const testCase of contentPartCases) {
      const child = node(...testCase.path);
      const required = [...new Set([
        ...fieldIds(parent, true),
        ...fieldIds(child, true),
      ])];
      const illustrativeExamples = (child.examples ?? []).filter((example) => (
        example.kind === "positive" || example.kind === "instance"
      ));

      expect(illustrativeExamples.length, `${testCase.id} has positive/instance evidence`).toBeGreaterThan(0);
      for (const example of illustrativeExamples) {
        expect(Object.keys(example.field_values ?? {}), `${testCase.id}/${String(example.id)}`).toEqual(
          expect.arrayContaining(required),
        );
        expect(example.field_values?.kind).toBe(testCase.kind);
      }
    }
  });

  it("keeps protocol evidence and real interface shapes separate from the neutral ontology record", () => {
    for (const testCase of contentPartCases) {
      const child = node(...testCase.path);
      const claimIds = (child.source_claims ?? []).flatMap((claim) => (
        typeof claim.id === "string" ? [claim.id] : []
      ));
      const sourceKinds = (child.source_claims ?? []).flatMap((claim) => (
        typeof claim.evidence_kind === "string" ? [claim.evidence_kind] : []
      ));
      const input = (child.engineering?.typical_input ?? []).map((item) => text(item.format)).join("\n");
      const output = (child.engineering?.typical_output ?? []).map((item) => text(item.format)).join("\n");

      expect(claimIds, `${testCase.id} cites every named protocol boundary`).toEqual(
        expect.arrayContaining(testCase.protocolClaims),
      );
      expect(sourceKinds, `${testCase.id} distinguishes sourced claims from local inference`).toEqual(
        expect.arrayContaining(["normative", "official", "design-inference"]),
      );
      for (const marker of testCase.inputMarkers) expect(input, `${testCase.id} input ${marker}`).toContain(marker);
      for (const marker of testCase.outputMarkers) expect(output, `${testCase.id} output ${marker}`).toContain(marker);
    }
  });

  it("keeps definitions, boundaries, examples, and the requested governance cleanup on every source node", () => {
    const nodes = [node(), node("ContentPart"), ...contentPartCases.map((testCase) => node(...testCase.path))];

    for (const value of nodes) {
      const shortDefinition = text(value.semantics?.short_definition?.en);
      const formalDefinition = text(value.semantics?.definition?.en);

      expect(shortDefinition.length, `${String(value.id)} short definition`).toBeGreaterThan(20);
      expect(formalDefinition.length, `${String(value.id)} formal definition`).toBeGreaterThan(shortDefinition.length);
      expect(formalDefinition).not.toBe(shortDefinition);
      expect(text(value.semantics?.why_needed?.en).length, `${String(value.id)} plain-language why`).toBeGreaterThan(40);
      expect(value.semantics?.includes?.length, `${String(value.id)} includes`).toBeGreaterThan(0);
      expect(value.semantics?.excludes?.length, `${String(value.id)} excludes`).toBeGreaterThan(0);
      expect(text(value.engineering?.explanation?.en).length, `${String(value.id)} engineering explanation`).toBeGreaterThan(80);
      expect(value.engineering?.typical_input?.length, `${String(value.id)} real input`).toBeGreaterThan(0);
      expect(value.engineering?.typical_output?.length, `${String(value.id)} real output`).toBeGreaterThan(0);
      expect(value.engineering?.reference_implementations?.length, `${String(value.id)} source implementation`).toBeGreaterThan(0);
      expect((value.examples ?? []).map((example) => example.kind)).toEqual(expect.arrayContaining([
        "positive",
        "counterexample",
        "boundary",
        "instance",
      ]));
      expect(value.axioms).toBeUndefined();
      expect(value.validation).toBeUndefined();
      expect(value.adaptation_mappings).toBeUndefined();
      expect(value.maturity).toBeUndefined();
      expect(value.change).toBeUndefined();
    }
  });

  it("models TextContent's code-language hint as a field and keeps every constraint executable and localized", () => {
    const textContent = node("ContentPart", "TextContent");
    const constraints = textContent.structure?.constraints ?? [];

    expect(fieldIds(textContent)).toContain("code_language");
    expect(constraints.map((constraint) => constraint.id)).not.toContain("code_language");
    for (const constraint of constraints) {
      expect(typeof constraint.id).toBe("string");
      expect(text(constraint.expression).length).toBeGreaterThan(0);
      expect(text(constraint.explanation?.zh).length).toBeGreaterThan(0);
      expect(text(constraint.explanation?.en).length).toBeGreaterThan(0);
      expect(text(constraint.explanation?.ja).length).toBeGreaterThan(0);
    }
  });
});
