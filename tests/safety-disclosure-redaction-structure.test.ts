import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id: string;
  readonly required: boolean;
};

type Source = {
  readonly id: string;
  readonly url: string;
  readonly source_type: string;
};

type SourceClaim = {
  readonly id: string;
  readonly source: string;
  readonly evidence_kind: string;
  readonly supports: string;
};

type Relation = {
  readonly id: string;
  readonly predicate: string;
  readonly target: string;
  readonly relation_kind: string;
};

type Node = {
  readonly id: string;
  readonly labels?: { readonly en?: string };
  readonly semantics?: { readonly definition?: { readonly en?: string } };
  readonly sources?: readonly Source[];
  readonly source_claims?: readonly SourceClaim[];
  readonly parent_relation?: Relation | null;
  readonly relations?: readonly Relation[];
  readonly structure?: {
    readonly identity_keys?: readonly string[];
    readonly fields?: readonly Field[];
  };
};

const disclosureRoot = resolve("ontology", "safety-plane", "safety-disclosure-redaction");

const disclosureNode = (relativePath: string): Node => parse(readFileSync(
  resolve(disclosureRoot, relativePath, "node.yaml"),
  "utf8",
)) as Node;

const disclosureNodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  return entry.isDirectory()
    ? disclosureNodeFiles(entryPath)
    : entry.isFile() && entry.name === "node.yaml"
      ? [entryPath]
      : [];
});

const allDisclosureNodes = (): readonly Node[] => disclosureNodeFiles(disclosureRoot)
  .map((file) => parse(readFileSync(file, "utf8")) as Node);

const relation = (node: Node, predicate: string, target: string): Relation | undefined => (
  node.relations?.find((candidate) => candidate.predicate === predicate && candidate.target === target)
);

describe("safety disclosure and redaction structure", () => {
  it("uses auditable official sources for local design inferences instead of invented project URLs", () => {
    const nodes = allDisclosureNodes();

    for (const node of nodes) {
      const sourcesById = new Map((node.sources ?? []).map((source) => [source.id, source]));

      expect(node.sources?.map((source) => source.url).join("\n")).not.toMatch(/moonweave\.ai\/ontology/u);
      expect(node.sources?.map((source) => source.source_type)).not.toContain("project-design");

      for (const claim of node.source_claims?.filter(
        (candidate) => candidate.evidence_kind === "design-inference",
      ) ?? []) {
        expect(sourcesById.has(claim.source), node.id + "/" + claim.id).toBe(true);
        expect(claim.supports, node.id + "/" + claim.id).toMatch(/Moonweave.*design inference/iu);
      }
    }
  });

  it("uses StagedDisclosure as the canonical non-UI name and removes ProgressiveDisclosure references", () => {
    const stagedPath = resolve(
      disclosureRoot,
      "DisclosureControlActivity",
      "StagedDisclosure",
      "node.yaml",
    );
    const progressivePath = resolve(
      disclosureRoot,
      "DisclosureControlActivity",
      "ProgressiveDisclosure",
      "node.yaml",
    );

    expect(existsSync(stagedPath)).toBe(true);
    expect(existsSync(progressivePath)).toBe(false);

    const staged = disclosureNode("DisclosureControlActivity/StagedDisclosure");
    const serializedModule = disclosureNodeFiles(disclosureRoot)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(staged).toMatchObject({
      id: "StagedDisclosure",
      labels: { en: "Staged Disclosure" },
      parent_relation: {
        id: "StagedDisclosure-is_a-DisclosureControlActivity",
        predicate: "is_a",
        target: "concept:DisclosureControlActivity",
        relation_kind: "hierarchy",
      },
    });
    expect(staged.semantics?.definition?.en).toContain("not a progressive-disclosure UI pattern");
    expect(relation(staged, "produces", "concept:Message")).toMatchObject({
      id: "StagedDisclosure-produces-Message",
      relation_kind: "association",
    });
    expect(serializedModule).not.toContain("ProgressiveDisclosure");
  });

  it("keeps every declared is_a subtype compatible with its parent's identity and required fields", () => {
    const subtypePairs = [
      ["DisclosureControlActivity", "DisclosureControlActivity/DisclosureFilter"],
      ["DisclosureControlActivity", "DisclosureControlActivity/Redaction"],
      ["DisclosureControlActivity", "DisclosureControlActivity/StagedDisclosure"],
      ["DisclosureSpecification/DisclosureRule", "DisclosureSpecification/DisclosureRule/RedactionRule"],
    ] as const;

    for (const [parentPath, childPath] of subtypePairs) {
      const parent = disclosureNode(parentPath);
      const child = disclosureNode(childPath);
      const parentIdentity = parent.structure?.identity_keys ?? [];
      const requiredParentFields = parent.structure?.fields
        ?.filter((field) => field.required)
        .map((field) => field.id) ?? [];
      const childFields = child.structure?.fields?.map((field) => field.id) ?? [];

      expect(child.parent_relation).toMatchObject({
        predicate: "is_a",
        relation_kind: "hierarchy",
        target: "concept:" + parent.id,
      });
      expect(child.structure?.identity_keys).toEqual(expect.arrayContaining(parentIdentity));
      expect(childFields).toEqual(expect.arrayContaining(requiredParentFields));
    }
  });
});
