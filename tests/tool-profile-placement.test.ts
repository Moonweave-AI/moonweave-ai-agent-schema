import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Relation = {
  readonly predicate?: unknown;
  readonly target?: unknown;
  readonly relation_kind?: unknown;
};
type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};
type Example = {
  readonly kind?: unknown;
  readonly field_values?: Readonly<Record<string, unknown>>;
};
type Source = {
  readonly id?: unknown;
  readonly source_type?: unknown;
};
type SourceClaim = {
  readonly source?: unknown;
  readonly evidence_kind?: unknown;
};
type Node = {
  readonly id?: unknown;
  readonly parent_relation?: unknown;
  readonly relations?: readonly Relation[];
  readonly structure?: { readonly fields?: readonly Field[] };
  readonly examples?: readonly Example[];
  readonly sources?: readonly Source[];
  readonly source_claims?: readonly SourceClaim[];
};

const registryRoot = (...segments: readonly string[]): string => resolve(
  "ontology",
  "tool-plane",
  "tool-registry-definition",
  ...segments,
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(
  registryRoot(...segments, "node.yaml"),
  "utf8",
)) as Node;

const describes = (value: Node, target: string): boolean => (value.relations ?? []).some((relation) => (
  relation.predicate === "describes"
  && relation.target === target
  && relation.relation_kind === "association"
));

const requiredFieldIds = (value: Node): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  field.required === true && typeof field.id === "string" ? [field.id] : []
));

const concreteExamples = (value: Node): readonly Example[] => (value.examples ?? []).filter((example) => (
  example.kind === "positive" || example.kind === "instance"
));

describe("tool execution-profile placement", () => {
  it("keeps execution classifications separate from the Tool identity they describe", () => {
    const hosted = node("HostedTool");
    const localRuntime = node("LocalRuntimeTool");

    expect(hosted.parent_relation).toBeNull();
    expect(describes(hosted, "concept:Tool")).toBe(true);
    expect(localRuntime.parent_relation).toBeNull();
    expect(describes(localRuntime, "concept:Tool")).toBe(true);
    expect(existsSync(registryRoot("Tool", "HostedTool", "node.yaml"))).toBe(false);
    expect(existsSync(registryRoot("Tool", "LocalRuntimeTool", "node.yaml"))).toBe(false);
  });

  it("uses a configuration name, not an invented SDK class, for hosted ShellTool mode", () => {
    const hostedShell = node("HostedContainerShellConfiguration");

    expect(hostedShell.id).toBe("HostedContainerShellConfiguration");
    expect(hostedShell.parent_relation).toBeNull();
    expect(describes(hostedShell, "concept:ShellTool")).toBe(true);
    expect(existsSync(registryRoot("Tool", "ShellTool", "HostedShellTool", "node.yaml"))).toBe(false);
  });

  it("keeps profile data and official SDK evidence explicit in concrete examples", () => {
    for (const profile of [node("HostedTool"), node("LocalRuntimeTool")]) {
      const required = requiredFieldIds(profile);

      for (const example of concreteExamples(profile)) {
        expect(Object.keys(example.field_values ?? {})).toEqual(expect.arrayContaining(required));
      }

      const officialSourceIds = new Set((profile.sources ?? []).flatMap((source) => (
        source.source_type === "official-documentation" && typeof source.id === "string" ? [source.id] : []
      )));
      for (const claim of profile.source_claims ?? []) {
        if (typeof claim.source === "string" && officialSourceIds.has(claim.source)) {
          expect(claim.evidence_kind).toBe("official-doc");
        }
      }
    }
  });
});
