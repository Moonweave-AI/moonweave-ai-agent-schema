import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Node = {
  readonly sources?: readonly {
    readonly id?: unknown;
    readonly source_type?: unknown;
    readonly url?: unknown;
  }[];
  readonly source_claims?: readonly {
    readonly id?: unknown;
    readonly source?: unknown;
    readonly evidence_kind?: unknown;
  }[];
  readonly semantics?: {
    readonly definition?: {
      readonly en?: unknown;
    };
  };
  readonly engineering?: {
    readonly typical_input?: readonly {
      readonly description?: {
        readonly en?: unknown;
      };
      readonly source_claims?: readonly unknown[];
    }[];
  };
  readonly parent_relation?: unknown;
  readonly structure?: {
    readonly required_relations?: readonly unknown[];
    readonly fields?: readonly { readonly id?: unknown; readonly required?: unknown }[];
  };
  readonly examples?: readonly {
    readonly kind?: unknown;
    readonly field_values?: Readonly<Record<string, unknown>>;
    readonly related_relation_ids?: readonly unknown[];
  }[];
};

const catalog = (): Node => parse(readFileSync(resolve(
  "ontology",
  "tool-plane",
  "tool-registry-definition",
  "CapabilityCatalog",
  "node.yaml",
), "utf8")) as Node;

describe("CapabilityCatalog module-root placement", () => {
  it("uses derived module containment instead of a semantic parent relation to a module", () => {
    const value = catalog();

    expect(value.parent_relation).toBeNull();
    expect(value.structure?.required_relations ?? []).not.toContain(
      "CapabilityCatalog-part_of-tool-registry-definition",
    );
    for (const example of value.examples ?? []) {
      expect(example.related_relation_ids ?? []).not.toContain(
        "CapabilityCatalog-part_of-tool-registry-definition",
      );
    }
  });

  it("makes positive and instance catalog records carry their full local snapshot contract", () => {
    const value = catalog();
    const required = (value.structure?.fields ?? []).flatMap((field) => (
      field.required === true && typeof field.id === "string" ? [field.id] : []
    ));

    for (const example of value.examples ?? []) {
      if (example.kind !== "positive" && example.kind !== "instance") continue;
      expect(Object.keys(example.field_values ?? {})).toEqual(expect.arrayContaining(required));
    }
  });

  it("grounds application-configured OpenAI function tools in the official request contract", () => {
    const value = catalog();
    const openaiSource = (value.sources ?? []).find((source) => (
      source.id === "openai-function-calling"
    ));
    const openaiClaim = (value.source_claims ?? []).find((claim) => (
      claim.id === "openai-function-tool-definition"
    ));
    const openaiInput = (value.engineering?.typical_input ?? []).find((input) => (
      input.description?.en === "OpenAI Responses API function-tool request fragment"
    ));
    const openaiInstance = (value.examples ?? []).find((example) => (
      example.kind === "instance"
      && example.field_values?.provenance
      && typeof example.field_values.provenance === "object"
      && (example.field_values.provenance as { readonly source_kind?: unknown }).source_kind === "application-configuration"
    ));

    expect(openaiSource).toMatchObject({
      source_type: "official-doc",
      url: "https://developers.openai.com/api/docs/guides/function-calling",
    });
    expect(openaiClaim).toMatchObject({
      source: "openai-function-calling",
      evidence_kind: "official-doc",
    });
    expect(openaiInput?.source_claims).toContain("openai-function-tool-definition");
    expect(openaiInstance?.source_claims).toContain("openai-function-tool-definition");
    expect(value.semantics?.definition?.en).toContain("application-configured OpenAI function tools");
  });

  it("uses a retrievable repository provenance source for the local catalog design inference", () => {
    const value = catalog();
    const localDesign = (value.sources ?? []).find((source) => (
      source.id === "moonweave-ontology-design"
    ));

    expect(localDesign).toMatchObject({
      source_type: "design-inference",
      url: "https://github.com/Moonweave-AI/moonweave-ai-agent-schema",
    });
  });

  it("distinguishes the local catalog profile from the official MCP Registry REST service", () => {
    const value = catalog();
    const registrySource = (value.sources ?? []).find((source) => source.id === "mcp-registry-faq");
    const registryClaim = (value.source_claims ?? []).find((claim) => claim.id === "mcp-registry-rest-service");

    expect(registrySource).toMatchObject({
      source_type: "official-doc",
      url: "https://modelcontextprotocol.io/registry/faq",
    });
    expect(registryClaim).toMatchObject({
      source: "mcp-registry-faq",
      evidence_kind: "official-doc",
    });
    expect(value.semantics?.definition?.en).toContain("MCP Registry REST service");
  });
});
