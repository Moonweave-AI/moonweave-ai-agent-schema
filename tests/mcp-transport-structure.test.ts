import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
  readonly allowed_values?: unknown;
  readonly source_claims?: readonly unknown[];
};

type Relation = {
  readonly predicate?: unknown;
  readonly target?: unknown;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly source?: unknown;
  readonly locator?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly parent_relation?: Relation | null;
  readonly structure?: {
    readonly fields?: readonly Field[];
    readonly identity_keys?: readonly unknown[];
  };
  readonly examples?: readonly {
    readonly kind?: unknown;
    readonly field_values?: Record<string, unknown>;
  }[];
  readonly engineering?: {
    readonly typical_input?: readonly {
      readonly format?: unknown;
      readonly source_claims?: readonly unknown[];
    }[];
  };
  readonly source_claims?: readonly SourceClaim[];
};

const ontologyPath = (...segments: readonly string[]): string => resolve(
  "ontology",
  "tool-plane",
  "tool-mcp-transport",
  ...segments,
);

const readNode = (...segments: readonly string[]): OntologyNode => parse(
  readFileSync(ontologyPath(...segments, "node.yaml"), "utf8"),
) as OntologyNode;

const field = (node: OntologyNode, id: string): Field | undefined => (
  node.structure?.fields?.find((candidate) => candidate.id === id)
);

const sourceClaim = (node: OntologyNode, id: string): SourceClaim | undefined => (
  node.source_claims?.find((candidate) => candidate.id === id)
);

describe("MCP transport terminology and protocol structure", () => {
  it("uses current MCP lifecycle names instead of ambiguous local aliases", () => {
    const expected = [
      ["MCPSession", "MCPMessage", "MCPRequest", "MCPInitializeRequest"],
      ["MCPSession", "MCPMessage", "MCPRequest", "MCPElicitationCreateRequest"],
      ["MCPSession", "MCPMessage", "MCPNotification", "MCPInitializedNotification"],
      ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPInitializeResult"],
      ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult"],
      ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult", "MCPListToolsResult"],
      ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPListRootsResult"],
      ["MCPSession", "MCPResourceSubscription"],
    ];

    for (const segments of expected) {
      expect(existsSync(ontologyPath(...segments, "node.yaml"))).toBe(true);
    }

    expect(existsSync(ontologyPath("MCPSession", "MCPMessage", "MCPRequest", "MCPElicitation", "node.yaml"))).toBe(false);
    expect(existsSync(ontologyPath("MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDefinitionList", "node.yaml"))).toBe(false);
    expect(existsSync(ontologyPath("MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPRootList", "node.yaml"))).toBe(false);
    expect(existsSync(ontologyPath("MCPSession", "ResourceSubscription", "node.yaml"))).toBe(false);

    const session = readNode("MCPSession");
    expect(session.parent_relation).toBeNull();
  });

  it("models initialize as its documented request, result, and initialized notification sequence", () => {
    const request = readNode("MCPSession", "MCPMessage", "MCPRequest", "MCPInitializeRequest");
    const result = readNode("MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPInitializeResult");
    const notification = readNode("MCPSession", "MCPMessage", "MCPNotification", "MCPInitializedNotification");

    expect(request.id).toBe("MCPInitializeRequest");
    expect(request.parent_relation).toMatchObject({ predicate: "is_a", target: "concept:MCPRequest" });
    expect(field(request, "method")).toMatchObject({ required: true, allowed_values: ["initialize"] });
    expect(result.id).toBe("MCPInitializeResult");
    expect(result.parent_relation).toMatchObject({ predicate: "is_a", target: "concept:MCPResultResponse" });
    expect(field(result, "result")).toMatchObject({ required: true });
    expect(notification.id).toBe("MCPInitializedNotification");
    expect(notification.parent_relation).toMatchObject({ predicate: "is_a", target: "concept:MCPNotification" });
    expect(field(notification, "method")).toMatchObject({ required: true, allowed_values: ["notifications/initialized"] });
  });

  it("keeps each retained MCP is_a branch concrete about its parent wire or local contract", () => {
    const checks: readonly [readonly string[], string][] = [
      [["MCPSession", "MCPCapability", "MCPClientCapability"], "local_capability_object"],
      [["MCPSession", "MCPCapability", "MCPServerCapability"], "local_capability_object"],
      [["MCPSession", "MCPMessage", "MCPRequest", "MCPPromptGetRequest"], "method"],
      [["MCPSession", "MCPMessage", "MCPRequest", "MCPResourceReadRequest"], "method"],
      [["MCPSession", "MCPMessage", "MCPRequest", "MCPToolCallRequest"], "method"],
      [["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult"], "result"],
      [["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult", "MCPListToolsResult"], "local_entry_set"],
      [["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPListRootsResult"], "result"],
      [["MCPSession", "MCPParticipant", "MCPClient"], "local_endpoint_role"],
      [["MCPSession", "MCPParticipant", "MCPServer"], "local_endpoint_role"],
      [["MCPSession", "MCPTransport", "MCPStdioTransport"], "local_transport_kind"],
      [["MCPSession", "MCPTransport", "MCPStreamableHTTPTransport"], "local_transport_kind"],
    ];

    for (const [segments, fieldId] of checks) {
      expect(field(readNode(...segments), fieldId)).toMatchObject({ required: true });
    }
  });

  it("carries inherited identity and wire/local fields on each same-record MCP subtype example", () => {
    const checks: readonly {
      readonly segments: readonly string[];
      readonly inheritedIdentity: readonly string[];
      readonly inheritedFields: readonly string[];
    }[] = [
      { segments: ["MCPSession", "MCPCapability", "MCPClientCapability"], inheritedIdentity: ["local_owner_role"], inheritedFields: ["local_owner_role", "local_capability_object", "local_protocol_version_context"] },
      { segments: ["MCPSession", "MCPCapability", "MCPServerCapability"], inheritedIdentity: ["local_owner_role"], inheritedFields: ["local_owner_role", "local_capability_object", "local_protocol_version_context"] },
      { segments: ["MCPSession", "MCPMessage", "MCPRequest", "MCPInitializeRequest"], inheritedIdentity: ["id", "method"], inheritedFields: ["jsonrpc", "id", "method"] },
      { segments: ["MCPSession", "MCPMessage", "MCPRequest", "MCPPromptGetRequest"], inheritedIdentity: ["id", "method"], inheritedFields: ["jsonrpc", "id", "method"] },
      { segments: ["MCPSession", "MCPMessage", "MCPRequest", "MCPResourceReadRequest"], inheritedIdentity: ["id", "method"], inheritedFields: ["jsonrpc", "id", "method"] },
      { segments: ["MCPSession", "MCPMessage", "MCPRequest", "MCPToolCallRequest"], inheritedIdentity: ["id", "method"], inheritedFields: ["jsonrpc", "id", "method"] },
      { segments: ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult", "MCPListPromptsResult"], inheritedIdentity: ["id", "local_list_variant"], inheritedFields: ["jsonrpc", "id", "result", "local_list_variant", "local_entry_set"] },
      { segments: ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult", "MCPListResourcesResult"], inheritedIdentity: ["id", "local_list_variant"], inheritedFields: ["jsonrpc", "id", "result", "local_list_variant", "local_entry_set"] },
      { segments: ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult", "MCPListResourceTemplatesResult"], inheritedIdentity: ["id", "local_list_variant"], inheritedFields: ["jsonrpc", "id", "result", "local_list_variant", "local_entry_set"] },
      { segments: ["MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse", "MCPDiscoveryListResult", "MCPListToolsResult"], inheritedIdentity: ["id", "local_list_variant"], inheritedFields: ["jsonrpc", "id", "result", "local_list_variant", "local_entry_set"] },
      { segments: ["MCPSession", "MCPParticipant", "MCPClient"], inheritedIdentity: ["local_endpoint_role"], inheritedFields: ["local_participant_reference", "local_endpoint_role", "local_implementation_name"] },
      { segments: ["MCPSession", "MCPParticipant", "MCPServer"], inheritedIdentity: ["local_endpoint_role"], inheritedFields: ["local_participant_reference", "local_endpoint_role", "local_implementation_name"] },
      { segments: ["MCPSession", "MCPTransport", "MCPStdioTransport"], inheritedIdentity: ["local_transport_kind"], inheritedFields: ["local_session_reference", "local_transport_kind", "local_message_encoding"] },
      { segments: ["MCPSession", "MCPTransport", "MCPStreamableHTTPTransport"], inheritedIdentity: ["local_transport_kind"], inheritedFields: ["local_session_reference", "local_transport_kind", "local_message_encoding"] },
    ];

    for (const check of checks) {
      const node = readNode(...check.segments);
      expect(node.structure?.identity_keys).toEqual(expect.arrayContaining(check.inheritedIdentity));
      const recordExamples = (node.examples ?? []).filter((example) => (
        example.kind === "positive" || example.kind === "instance"
      ));
      expect(recordExamples).toHaveLength(2);
      for (const example of recordExamples) {
        expect(example.field_values).toEqual(expect.objectContaining(
          Object.fromEntries(check.inheritedFields.map((id) => [id, expect.anything()])),
        ));
      }
    }
  });

  it("uses a real correlated JSON-RPC request and grounds session and authorization-role claims", () => {
    const response = readNode("MCPSession", "MCPMessage", "MCPResponse");
    const requestFormat = response.engineering?.typical_input?.[0]?.format;

    expect(typeof requestFormat).toBe("string");
    const request = JSON.parse(requestFormat as string) as Record<string, unknown>;
    expect(request).toMatchObject({
      jsonrpc: "2.0",
      id: 2,
      method: "resources/read",
      params: { uri: "file:///project/src/main.rs" },
    });
    expect(request).not.toHaveProperty("requestId");
    expect(response.engineering?.typical_input?.[0]?.source_claims).toEqual(expect.arrayContaining([
      "json-rpc-response-correlation",
      "mcp-response-session",
    ]));

    const resultResponse = readNode("MCPSession", "MCPMessage", "MCPResponse", "MCPResultResponse");
    expect(field(resultResponse, "id")?.source_claims).toEqual(expect.arrayContaining([
      "mcp-result-response-json-rpc",
      "mcp-result-response-session",
    ]));
    expect(sourceClaim(resultResponse, "mcp-result-response-session")).toMatchObject({
      source: "mcp-lifecycle-2025-11-25",
      locator: "Operation; Timeouts",
    });

    const authorization = readNode("MCPSession", "MCPTransport", "MCPStreamableHTTPTransport", "MCPAuthorization");
    expect(field(authorization, "authorization_servers")?.source_claims).toEqual(expect.arrayContaining([
      "mcp-auth-discovery",
      "mcp-auth-roles",
    ]));
  });
});
