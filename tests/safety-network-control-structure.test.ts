import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Relation = {
  readonly id?: string;
  readonly predicate?: string;
  readonly relation_kind?: string;
  readonly target?: string;
};

type Field = {
  readonly id?: string;
  readonly required?: boolean;
};

type Node = {
  readonly parent_relation?: Relation | null;
  readonly relations?: readonly Relation[];
  readonly structure?: {
    readonly fields?: readonly Field[];
  };
};

const networkNode = (...segments: readonly string[]): Node => parse(readFileSync(resolve(
  "ontology",
  "safety-plane",
  "safety-network-control",
  ...segments,
  "node.yaml",
), "utf8")) as Node;

const relation = (node: Node, id: string): Relation | undefined => (
  node.relations?.find((candidate) => candidate.id === id)
);

const requiredFieldIds = (node: Node): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    field.required === true && typeof field.id === "string" ? [field.id] : []
  )) ?? []
);

const fieldIds = (node: Node): ReadonlySet<string> => new Set(
  node.structure?.fields?.flatMap((field) => (
    typeof field.id === "string" ? [field.id] : []
  )) ?? [],
);

describe("safety network-control structure", () => {
  it("keeps message and route records outside the request-attempt activity tree", () => {
    const root = resolve("ontology", "safety-plane", "safety-network-control");
    const call = networkNode("NetworkInteraction", "NetworkCall");
    const message = networkNode("NetworkMessage");
    const route = networkNode("NetworkRoute");
    const response = networkNode("NetworkMessage", "InboundResponse");

    expect(existsSync(resolve(root, "NetworkInteraction", "NetworkCall", "NetworkMessage"))).toBe(false);
    expect(existsSync(resolve(root, "NetworkInteraction", "NetworkCall", "NetworkRoute"))).toBe(false);
    expect(message.parent_relation ?? null).toBeNull();
    expect(route.parent_relation ?? null).toBeNull();
    expect(relation(call, "NetworkCall-uses-OutboundRequest")).toMatchObject({
      predicate: "uses",
      relation_kind: "causal",
      target: "concept:OutboundRequest",
    });
    expect(relation(call, "NetworkCall-uses-NetworkRoute")).toMatchObject({
      predicate: "uses",
      relation_kind: "causal",
      target: "concept:NetworkRoute",
    });
    expect(relation(response, "InboundResponse-was_generated_by-NetworkCall")).toMatchObject({
      predicate: "was_generated_by",
      relation_kind: "provenance",
      target: "concept:NetworkCall",
    });
  });

  it("uses real proxy protocol subtypes and keeps policy distinct from its governed call", () => {
    const proxy = networkNode("NetworkEndpoint", "Proxy");
    const httpProxy = networkNode("NetworkEndpoint", "Proxy", "HTTPProxy");
    const socksProxy = networkNode("NetworkEndpoint", "Proxy", "SOCKSProxy");
    const policy = networkNode("NetworkPolicy");

    expect(httpProxy.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
    });
    expect(socksProxy.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
    });
    expect(relation(proxy, "Proxy-is_a-NetworkEndpoint")).toBeUndefined();
    expect(relation(policy, "NetworkPolicy-governs-NetworkCall")).toMatchObject({
      predicate: "governs",
      relation_kind: "governance",
      target: "concept:NetworkCall",
    });
  });

  it("physically retains direct-parent required fields for every true network subtype", () => {
    const pairs: readonly [readonly string[], readonly string[]][] = [
      [["NetworkEndpoint", "Proxy"], ["NetworkEndpoint"]],
      [["NetworkEndpoint", "Proxy", "HTTPProxy"], ["NetworkEndpoint", "Proxy"]],
      [["NetworkEndpoint", "Proxy", "SOCKSProxy"], ["NetworkEndpoint", "Proxy"]],
      [["NetworkInteraction", "NetworkCall"], ["NetworkInteraction"]],
      [["NetworkMessage", "OutboundRequest"], ["NetworkMessage"]],
      [["NetworkMessage", "InboundResponse"], ["NetworkMessage"]],
      [["NetworkRoute", "ProxyRoute"], ["NetworkRoute"]],
    ];

    for (const [childPath, parentPath] of pairs) {
      const child = networkNode(...childPath);
      const parent = networkNode(...parentPath);
      const missing = requiredFieldIds(parent).filter((id) => !fieldIds(child).has(id));

      expect(missing, `${childPath.at(-1)} is missing direct-parent fields`).toEqual([]);
    }
  });
});
