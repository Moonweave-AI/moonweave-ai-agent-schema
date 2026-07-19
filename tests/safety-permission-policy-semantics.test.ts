import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type NodeDocument = {
  readonly id?: string;
  readonly semantics?: { readonly semantic_kind?: string };
  readonly structure?: {
    readonly identity_keys?: readonly string[];
    readonly fields?: readonly {
      readonly id?: string;
      readonly required?: boolean;
      readonly allowed_values?: readonly (string | boolean)[];
      readonly cardinality?: { readonly min?: number; readonly max?: number | null };
    }[];
  };
  readonly parent_relation?: { readonly id?: string } | null;
  readonly relations?: readonly {
    readonly id?: string;
    readonly predicate?: string;
    readonly target?: string;
    readonly cardinality?: {
      readonly source?: { readonly min?: number; readonly max?: number | null };
      readonly target?: { readonly min?: number; readonly max?: number | null };
    };
    readonly conditions?: readonly { readonly id?: string; readonly expression?: string }[];
  }[];
  readonly examples?: readonly {
    readonly related_node_ids?: readonly string[];
    readonly related_relation_ids?: readonly string[];
    readonly field_values?: Readonly<Record<string, unknown>>;
  }[];
  readonly sources?: readonly { readonly id?: string; readonly url?: string }[];
  readonly source_claims?: readonly {
    readonly id?: string;
    readonly source?: string;
    readonly supports?: string;
    readonly evidence_kind?: string;
  }[];
};

const moduleRoot = resolve("ontology/safety-plane/safety-permission-policy");

const readNode = (relativePath: string): NodeDocument => parse(readFileSync(
  join(moduleRoot, relativePath, "node.yaml"),
  "utf8",
)) as NodeDocument;

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(path);
  return entry.isFile() && entry.name === "node.yaml" ? [path] : [];
});

const fieldIds = (node: NodeDocument): readonly string[] => (
  node.structure?.fields?.flatMap((field) => field.id ? [field.id] : []) ?? []
);

const requiredFieldIds = (node: NodeDocument): readonly string[] => (
  node.structure?.fields?.flatMap((candidate) => candidate.required && candidate.id
    ? [candidate.id]
    : []) ?? []
);

const relatedNodeIds = (node: NodeDocument): readonly string[] => (
  node.examples?.flatMap((example) => example.related_node_ids ?? []) ?? []
);

const field = (node: NodeDocument, id: string) => (
  node.structure?.fields?.find((candidate) => candidate.id === id)
);

const evidenceKinds = (value: unknown): readonly string[] => Array.isArray(value)
  ? value.filter((candidate): candidate is string => typeof candidate === "string")
  : typeof value === "string" ? [value] : [];

describe("safety permission-policy semantic boundaries", () => {
  it("keeps human approval as call-specific evidence rather than an authorization lifecycle event", () => {
    expect(existsSync(join(moduleRoot, "HumanApproval", "node.yaml"))).toBe(true);
    expect(existsSync(join(moduleRoot, "AuthorizationEvent", "HumanApproval", "node.yaml"))).toBe(false);

    const approval = readNode("HumanApproval");
    expect(approval.semantics?.semantic_kind).toBe("entity");
    expect(approval.parent_relation).toBeFalsy();
  });

  it("uses only allow or deny as Cedar-compatible policy effects and represents review as a local record", () => {
    expect(existsSync(join(moduleRoot, "ManualReviewRequired", "node.yaml"))).toBe(true);
    expect(existsSync(join(moduleRoot, "PolicyDecision", "DeferDecision", "node.yaml"))).toBe(false);

    const decision = readNode("PolicyDecision");
    const decisionEffect = decision.structure?.fields?.find((field) => field.id === "decision_effect");
    expect(decisionEffect?.allowed_values).toEqual(["allow", "deny"]);

    const review = readNode("ManualReviewRequired");
    expect(review.parent_relation).toBeFalsy();
    expect(review.relations).toContainEqual(expect.objectContaining({
      id: "ManualReviewRequired-was_generated_by-PolicyEvaluation",
      predicate: "was_generated_by",
      target: "activity:PolicyEvaluation",
    }));
  });

  it("uses a local authorization credential name and makes lifecycle events identify that credential", () => {
    expect(existsSync(join(moduleRoot, "AuthorizationCredential", "node.yaml"))).toBe(true);
    expect(existsSync(join(moduleRoot, "AuthorizationCredential", "CapabilityCredential", "node.yaml"))).toBe(true);
    expect(existsSync(join(moduleRoot, "AuthorizationGrant", "node.yaml"))).toBe(false);

    const credential = readNode("AuthorizationCredential");
    expect(credential.id).toBe("AuthorizationCredential");
    expect(fieldIds(credential)).toContain("authorization_credential_id");

    const event = readNode("AuthorizationEvent");
    expect(fieldIds(event)).toEqual(expect.arrayContaining([
      "authorization_credential_id",
      "effective_at",
    ]));
  });

  it("does not link module examples to an undeclared Authentication node", () => {
    const ids = nodeFiles(moduleRoot).flatMap((path) => relatedNodeIds(
      parse(readFileSync(path, "utf8")) as NodeDocument,
    ));
    expect(ids).not.toContain("Authentication");
  });

  it("uses a static needs-approval requirement and names each required evidence type", () => {
    expect(existsSync(join(moduleRoot, "ToolApprovalRequirement", "node.yaml"))).toBe(true);
    expect(existsSync(join(moduleRoot, "ToolApprovalGate", "node.yaml"))).toBe(false);

    const requirement = readNode("ToolApprovalRequirement");
    expect(fieldIds(requirement)).not.toContain("control_evidence_reference");
    expect(fieldIds(requirement)).toEqual(expect.arrayContaining([
      "tool_definition_id",
      "needs_approval",
      "required_evidence_kind",
    ]));
    expect(requirement.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "concept:ToolDefinition" }),
      expect.objectContaining({ target: "entity:PolicyDecision" }),
      expect.objectContaining({ target: "local-profile:AuthorizationCredential" }),
      expect.objectContaining({ target: "entity:HumanApproval" }),
      expect.objectContaining({ target: "activity:PreExecutionSafetyCheck" }),
    ]));
  });

  it("keeps all 22 retained nodes free of the retired grant, gate, and defer identities", () => {
    const paths = nodeFiles(moduleRoot);
    expect(paths).toHaveLength(22);

    const serialized = paths.map((path) => readFileSync(path, "utf8")).join("\n");
    for (const retiredIdentity of [
      "AuthorizationGrant",
      "CapabilityGrant",
      "ToolApprovalGate",
      "DeferDecision",
      "control_evidence_reference",
    ]) {
      expect(serialized).not.toContain(retiredIdentity);
    }
  });

  it("keeps policy vocabulary at allow-or-deny and puts review outside policy effects", () => {
    for (const [path, id] of [
      ["PolicyDecision", "decision_effect"],
      ["PolicySpecification", "default_effect"],
      ["PolicySpecification/PolicyRule", "declared_effect"],
      ["PolicySpecification/PolicyRule/PolicyEffect", "effect_name"],
    ] as const) {
      expect(field(readNode(path), id)?.allowed_values).toEqual(["allow", "deny"]);
    }

    const review = readNode("ManualReviewRequired");
    expect(review.semantics?.semantic_kind).toBe("entity");
    expect(review.source_claims).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "cedar-authorization" }),
      expect.objectContaining({ source: "moonweave-local-manual-review" }),
    ]));
  });

  it("makes local credentials explicitly verifiable and lifecycle-bound", () => {
    const credential = readNode("AuthorizationCredential");
    expect(credential.semantics?.semantic_kind).toBe("local-profile");
    expect(fieldIds(credential)).toEqual(expect.arrayContaining([
      "holder_reference",
      "authorized_scope",
      "effective_at",
      "expires_at",
      "verification_reference",
      "allow_decision_id",
    ]));
    expect(credential.sources?.map((source) => source.id)).not.toContain("rfc6749-scope");
    expect(credential.source_claims).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "moonweave-local-authorization-credential" }),
    ]));

    const event = readNode("AuthorizationEvent");
    expect(field(event, "authorization_event_type")?.allowed_values).toEqual([
      "credential-issued",
      "revocation",
      "expiry",
    ]);
  });

  it("does not let static tool requirements contain runtime evidence instances", () => {
    const requirement = readNode("ToolApprovalRequirement");
    expect(field(requirement, "required_evidence_kind")?.cardinality).toEqual({ min: 1, max: null });
    expect(field(requirement, "required_evidence_kind")?.allowed_values).toEqual([
      "policy-decision",
      "authorization-credential",
      "human-approval",
      "pre-execution-safety-check",
    ]);
    expect(fieldIds(requirement)).not.toEqual(expect.arrayContaining([
      "pending_tool_call_id",
      "gate_state",
      "approval_outcome",
      "authorization_credential_id",
    ]));
  });

  it("keeps credential, event, and decision variants as true is_a subtypes with parent contracts", () => {
    for (const [parentPath, childPath] of [
      ["AuthorizationCredential", "AuthorizationCredential/CapabilityCredential"],
      ["AuthorizationEvent", "AuthorizationEvent/AuthorizationRevocation"],
      ["PolicyDecision", "PolicyDecision/AllowDecision"],
      ["PolicyDecision", "PolicyDecision/DenyDecision"],
    ] as const) {
      const parent = readNode(parentPath);
      const child = readNode(childPath);

      expect(child.parent_relation).toEqual(expect.objectContaining({
        predicate: "is_a",
        relation_kind: "hierarchy",
      }));
      expect(child.structure?.identity_keys).toEqual(expect.arrayContaining(
        parent.structure?.identity_keys ?? [],
      ));
      expect(fieldIds(child)).toEqual(expect.arrayContaining(requiredFieldIds(parent)));
      for (const example of child.examples ?? []) {
        expect(Object.keys(example.field_values ?? {})).toEqual(expect.arrayContaining(
          requiredFieldIds(child),
        ));
      }
    }

    const capability = readNode("AuthorizationCredential/CapabilityCredential");
    expect(fieldIds(capability)).not.toContain("capability_credential_id");
    expect(field(capability, "parent_credential_ref")?.required).toBe(false);
    expect(capability.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "CapabilityCredential-is_derived_from-AuthorizationCredential",
        target: "local-profile:AuthorizationCredential",
      }),
    ]));

    const revocation = readNode("AuthorizationEvent/AuthorizationRevocation");
    expect(field(revocation, "authorization_event_type")?.allowed_values).toEqual(["revocation"]);

    expect(field(readNode("PolicyDecision/AllowDecision"), "decision_effect")?.allowed_values)
      .toEqual(["allow"]);
    expect(field(readNode("PolicyDecision/DenyDecision"), "decision_effect")?.allowed_values)
      .toEqual(["deny"]);
  });

  it("uses auditable source bases and keeps static evidence declarations conditionally consistent", () => {
    const nodes = nodeFiles(moduleRoot).map((path) => parse(readFileSync(path, "utf8")) as NodeDocument);
    for (const node of nodes) {
      const sources = new Map((node.sources ?? []).flatMap((source) => source.id ? [[source.id, source]] : []));
      for (const source of sources.values()) {
        expect(source.url).not.toBe("https://moonweave.ai/ontology");
      }
      for (const claim of node.source_claims?.filter(
        (candidate) => candidate.evidence_kind === "design-inference",
      ) ?? []) {
        const source = sources.get(claim.source ?? "");
        expect(source?.url).toMatch(/^https:\/\//u);
        if (source?.id?.startsWith("moonweave-local")) {
          expect(claim.supports).toMatch(/Moonweave design inference/iu);
        }
      }
    }

    const credential = readNode("AuthorizationCredential");
    expect(field(credential, "allow_decision_id")?.cardinality).toEqual({ min: 1, max: 1 });
    expect(credential.relations).toContainEqual(expect.objectContaining({
      id: "AuthorizationCredential-issued-after-AllowDecision",
      cardinality: {
        source: { min: 1, max: 1 },
        target: { min: 0, max: null },
      },
    }));

    const requirement = readNode("ToolApprovalRequirement");
    const relationByEvidenceKind = new Map([
      ["policy-decision", "ToolApprovalRequirement-requires-PolicyDecision"],
      ["authorization-credential", "ToolApprovalRequirement-requires-AuthorizationCredential"],
      ["human-approval", "ToolApprovalRequirement-requires-HumanApproval"],
      ["pre-execution-safety-check", "ToolApprovalRequirement-requires-PreExecutionSafetyCheck"],
    ] as const);
    for (const [kind, relationId] of relationByEvidenceKind) {
      expect(requirement.relations).toContainEqual(expect.objectContaining({
        id: relationId,
        conditions: expect.arrayContaining([
          expect.objectContaining({ id: `tool-approval-requires-${kind}` }),
        ]),
      }));
    }
    for (const example of requirement.examples ?? []) {
      const kinds = evidenceKinds(example.field_values?.required_evidence_kind);
      const expectedRelations = kinds.flatMap((kind) => relationByEvidenceKind.get(kind) ?? []);
      const actualRelations = (example.related_relation_ids ?? []).filter((id) =>
        id.startsWith("ToolApprovalRequirement-requires-"),
      );
      expect(actualRelations.sort()).toEqual(expectedRelations.sort());
    }
  });
});
