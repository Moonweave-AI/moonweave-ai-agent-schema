import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Node = {
  readonly id?: unknown;
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly labels?: {
    readonly en?: unknown;
  };
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly target?: unknown;
  };
  readonly examples?: readonly {
    readonly id?: unknown;
    readonly kind?: unknown;
    readonly field_values?: unknown;
  }[];
  readonly source_claims?: readonly {
    readonly id?: unknown;
    readonly supports?: unknown;
    readonly evidence_kind?: unknown;
  }[];
};

const storageRoot = resolve("ontology", "info-plane", "info-storage-sources");

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(entryPath);
  return entry.isFile() && entry.name === "node.yaml" ? [entryPath] : [];
});

const fieldIds = (node: Node): ReadonlySet<string> => new Set(
  (node.structure?.fields ?? []).flatMap((field) => (
    typeof field.id === "string" && field.id.trim().length > 0 ? [field.id] : []
  )),
);

const requiredFieldIds = (node: Node): readonly string[] => (
  (node.structure?.fields ?? []).flatMap((field) => (
    field.required === true && typeof field.id === "string" && field.id.trim().length > 0
      ? [field.id]
      : []
  ))
);

const identityKeyIds = (node: Node): readonly string[] => (
  (node.structure?.identity_keys ?? []).flatMap((key) => (
    typeof key === "string" && key.trim().length > 0 ? [key] : []
  ))
);

const targetId = (target: unknown): string | null => {
  if (typeof target !== "string" || target.trim().length === 0) return null;
  const separator = target.indexOf(":");
  return separator < 0 ? target : target.slice(separator + 1);
};

describe("info-storage-sources structure", () => {
  const parsed = nodeFiles(storageRoot).map((path) => ({
    path,
    node: parse(readFileSync(path, "utf8")) as Node,
  }));
  const nodesByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));

  it("keeps every retained is_a source-reference specialization structurally substitutable", () => {
    const violations = parsed.flatMap(({ path, node }) => {
      if (node.parent_relation?.predicate !== "is_a") return [];

      const parentPath = join(dirname(dirname(path)), "node.yaml");
      const parent = nodesByPath.get(parentPath);
      if (!parent || typeof parent.id !== "string") return [];

      const declaredParent = targetId(node.parent_relation.target);
      const missing = requiredFieldIds(parent).filter((id) => !fieldIds(node).has(id));
      return declaredParent !== parent.id || missing.length > 0
        ? [`${node.id ?? path}: parent=${declaredParent ?? "<implicit>"}; missing=${missing.join(",")}`]
        : [];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("carries immediate-parent identity keys and required values into each positive and instance specialization example", () => {
    const violations = parsed.flatMap(({ path, node }) => {
      if (node.parent_relation?.predicate !== "is_a") return [];

      const parent = nodesByPath.get(join(dirname(dirname(path)), "node.yaml"));
      if (!parent) return [];

      const childIdentityKeys = new Set(identityKeyIds(node));
      const missingIdentityKeys = identityKeyIds(parent).filter((id) => !childIdentityKeys.has(id));
      const missingExampleValues = (node.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = example.field_values;
        if (!values || typeof values !== "object" || Array.isArray(values)) {
          return [`${example.id ?? "<example>"}: no field_values object`];
        }
        const missing = requiredFieldIds(parent).filter((id) => !(id in values));
        return missing.length > 0 ? [`${example.id ?? "<example>"}: ${missing.join(",")}`] : [];
      });

      return missingIdentityKeys.length === 0 && missingExampleValues.length === 0
        ? []
        : [`${node.id ?? path}: identity=${missingIdentityKeys.join(",")}; examples=${missingExampleValues.join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("models identity, provenance, location, anchors, and descriptors as source-reference components", () => {
    const expectedComponents = new Map([
      ["SourceIdentity", "SourceReference"],
      ["SourceProvenance", "SourceReference"],
      ["SourceLocation", "SourceReference"],
      ["SourceAnchor", "SourceReference"],
      ["ResourceDescriptor", "SourceReference"],
    ]);
    const byId = new Map(parsed.flatMap(({ node }) => (
      typeof node.id === "string" ? [[node.id, node] as const] : []
    )));

    for (const [id, parentId] of expectedComponents) {
      const node = byId.get(id);
      expect(node, `${id} must be retained`).toBeDefined();
      expect(node?.parent_relation?.predicate, `${id} must be a component rather than a subtype`).toBe("part_of");
      expect(targetId(node?.parent_relation?.target), `${id} must attach to ${parentId}`).toBe(parentId);
    }
  });

  it("keeps the data-governance-zone declaration locator substitutable without turning it into a trust zone", () => {
    const dataGovernanceZone = parsed.find(({ node }) => node.id === "DataGovernanceZoneReference")?.node;
    expect(dataGovernanceZone).toBeDefined();
    expect(dataGovernanceZone?.parent_relation?.predicate).toBe("is_a");
    expect(targetId(dataGovernanceZone?.parent_relation?.target)).toBe("GovernanceReference");

    const fieldSet = fieldIds(dataGovernanceZone ?? {});
    for (const fieldId of [
      "source_reference_id",
      "reference_type",
      "source_identifier",
      "governance_reference_id",
      "governance_subject_uri",
      "governance_role",
    ]) {
      expect(fieldSet, `DataGovernanceZoneReference must retain ${fieldId}`).toContain(fieldId);
    }

    for (const example of dataGovernanceZone?.examples ?? []) {
      if (example.kind !== "positive" && example.kind !== "instance") continue;
      const values = example.field_values;
      expect(values && typeof values === "object" && !Array.isArray(values)).toBe(true);
      for (const fieldId of [
        "source_reference_id",
        "reference_type",
        "source_identifier",
        "governance_reference_id",
        "governance_subject_uri",
        "governance_role",
      ]) {
        expect(values as Record<string, unknown>, `${example.id ?? "<example>"} must show ${fieldId}`).toHaveProperty(fieldId);
      }
    }
  });

  it("binds digest and version specializations to the inherited source-identity basis", () => {
    const byId = new Map(parsed.flatMap(({ node }) => (
      typeof node.id === "string" ? [[node.id, node] as const] : []
    )));

    for (const id of ["ByteSequenceDigest", "SourceVersion"]) {
      const node = byId.get(id);
      expect(node, `${id} must be retained`).toBeDefined();
      expect(node?.parent_relation?.predicate).toBe("is_a");
      expect(targetId(node?.parent_relation?.target)).toBe("SourceIdentity");

      const fields = fieldIds(node ?? {});
      for (const fieldId of ["canonical_identifier", "identity_basis", "version_or_digest_ref"]) {
        expect(fields, `${id} must retain ${fieldId}`).toContain(fieldId);
      }

      for (const example of node?.examples ?? []) {
        if (example.kind !== "positive" && example.kind !== "instance") continue;
        const values = example.field_values;
        expect(values && typeof values === "object" && !Array.isArray(values)).toBe(true);
        for (const fieldId of ["canonical_identifier", "identity_basis", "version_or_digest_ref"]) {
          expect(values as Record<string, unknown>, `${example.id ?? "<example>"} must show ${fieldId}`).toHaveProperty(fieldId);
        }
      }
    }
  });

  it("roots line, page, and LSP coordinate profiles directly in SourceLocation", () => {
    const byId = new Map(parsed.flatMap(({ node }) => (
      typeof node.id === "string" ? [[node.id, node] as const] : []
    )));

    for (const id of ["SourceLineRange", "SourcePageRange", "SourceSpan"]) {
      const node = byId.get(id);
      expect(node, `${id} must be retained`).toBeDefined();
      expect(node?.parent_relation?.predicate).toBe("is_a");
      expect(targetId(node?.parent_relation?.target)).toBe("SourceLocation");

      const fields = fieldIds(node ?? {});
      for (const fieldId of ["source_location_id", "source_reference_ref", "representation_ref", "location_kind", "coordinate_system"]) {
        expect(fields, `${id} must retain the SourceLocation field ${fieldId}`).toContain(fieldId);
      }

      for (const example of node?.examples ?? []) {
        if (example.kind !== "positive" && example.kind !== "instance") continue;
        const values = example.field_values;
        expect(values && typeof values === "object" && !Array.isArray(values)).toBe(true);
        expect(values as Record<string, unknown>, `${example.id ?? "<example>"} must show a range kind`).toHaveProperty("location_kind", "range");
        expect(values as Record<string, unknown>, `${example.id ?? "<example>"} must show its coordinate system`).toHaveProperty("coordinate_system");
      }
    }
  });

  it("uses RFC 9530's Repr-Digest field name instead of an invented representation-digest name", () => {
    const ids = new Set(parsed.flatMap(({ node }) => (
      typeof node.id === "string" ? [node.id] : []
    )));
    const reprDigestPath = join(storageRoot, "HttpReprDigest", "node.yaml");

    expect(ids).not.toContain("HttpRepresentationDigest");
    expect(ids).toContain("HttpReprDigest");
    expect(existsSync(reprDigestPath), "the canonical Repr-Digest node path must exist").toBe(true);

    const reprDigestDocument = readFileSync(reprDigestPath, "utf8");
    expect(reprDigestDocument).toContain("en: HTTP Repr-Digest Field");
    expect(reprDigestDocument).not.toContain("HttpRepresentationDigest");
  });

  it("uses the HTTP field names published by RFC 9110 and RFC 9530 in digest and validator labels", () => {
    const byId = new Map(parsed.flatMap(({ node }) => (
      typeof node.id === "string" ? [[node.id, node] as const] : []
    )));

    expect(byId.get("HttpContentDigest")?.labels?.en).toBe("HTTP Content-Digest Field");
    expect(byId.get("HttpEntityTag")?.labels?.en).toBe("HTTP ETag Field");
  });

  it("does not label an external specification fact as a local design inference", () => {
    const externalAuthorityLead = /^(RFC|W3C|MCP|OpenAI|PROV-O|FIPS|PostgreSQL|The PDF Association)\b/;
    const violations = parsed.flatMap(({ node }) => (
      (node.source_claims ?? []).flatMap((claim) => (
        claim.evidence_kind === "design-inference"
          && typeof claim.supports === "string"
          && externalAuthorityLead.test(claim.supports)
          ? [`${node.id ?? "<unknown>"}/${claim.id ?? "<unknown>"}: ${claim.supports}`]
          : []
      ))
    ));

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("uses every declared source claim in a concrete node section", () => {
    const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const violations = parsed.flatMap(({ path, node }) => {
      const document = readFileSync(path, "utf8");
      return (node.source_claims ?? []).flatMap((claim) => {
        if (typeof claim.id !== "string" || claim.id.trim().length === 0) return [];
        const occurrences = document.match(new RegExp(`\\b${escapeRegex(claim.id)}\\b`, "g"))?.length ?? 0;
        return occurrences > 1 ? [] : [`${node.id ?? path}/${claim.id}`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
