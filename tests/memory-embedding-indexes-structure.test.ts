import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
  readonly allowed_values?: readonly unknown[];
};

type Example = {
  readonly kind?: unknown;
  readonly field_values?: Record<string, unknown>;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly source?: unknown;
  readonly locator?: unknown;
  readonly supports?: unknown;
  readonly evidence_kind?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly target?: unknown;
  } | null;
  readonly semantics?: {
    readonly definition?: { readonly en?: unknown };
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly engineering?: {
    readonly typical_input?: readonly { readonly format?: unknown }[];
    readonly typical_output?: readonly { readonly format?: unknown }[];
  };
  readonly examples?: readonly Example[];
  readonly source_claims?: readonly SourceClaim[];
};

const ontologyPath = (...segments: readonly string[]): string => resolve(
  "ontology",
  "memory-plane",
  "memory-embedding-indexes",
  ...segments,
);

const readNode = (...segments: readonly string[]): OntologyNode => parse(
  readFileSync(ontologyPath(...segments, "node.yaml"), "utf8"),
) as OntologyNode;

const field = (node: OntologyNode, id: string): Field | undefined => (
  node.structure?.fields?.find((candidate) => candidate.id === id)
);

const example = (node: OntologyNode, kind: string): Example | undefined => (
  node.examples?.find((candidate) => candidate.kind === kind)
);

const sourceClaim = (node: OntologyNode, id: string): SourceClaim | undefined => (
  node.source_claims?.find((candidate) => candidate.id === id)
);

const allOntologyNodes = (directory = ontologyPath()): readonly OntologyNode[] => (
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return allOntologyNodes(entryPath);
    }
    return entry.name === "node.yaml"
      ? [parse(readFileSync(entryPath, "utf8")) as OntologyNode]
      : [];
  })
);

describe("memory embedding and index ontology contracts", () => {
  it("uses one Index identity across each concrete index subtype, while keeping metric vector-specific", () => {
    const index = readNode("Index");
    const vector = readNode("Index", "VectorIndex");
    const tfidf = readNode("Index", "TfIdfIndex");
    const hybrid = readNode("Index", "HybridIndex");

    expect(field(index, "metric")).toBeUndefined();

    expect(vector.structure?.identity_keys).toEqual(["index_id"]);
    expect(field(vector, "vector_index_id")).toBeUndefined();
    expect(field(vector, "index_kind")).toMatchObject({ required: true, allowed_values: ["vector"] });
    expect(field(vector, "metric")).toMatchObject({ required: true });
    expect(example(vector, "positive")?.field_values).toEqual(expect.objectContaining({
      index_id: "vector-index-support-v3",
      index_kind: "vector",
      schema_ref: "support-vector-schema-v1",
    }));
    expect(example(vector, "instance")?.field_values).toEqual(expect.objectContaining({
      index_id: "vector-index-pgvector-17",
      index_kind: "vector",
      active_version_ref: "pgvector-build-17",
    }));

    expect(tfidf.structure?.identity_keys).toEqual(["index_id"]);
    expect(field(tfidf, "tfidf_index_id")).toBeUndefined();
    expect(field(tfidf, "index_kind")).toMatchObject({ required: true, allowed_values: ["tfidf"] });
    expect(field(tfidf, "schema_ref")).toMatchObject({ required: true });
    expect(example(tfidf, "positive")?.field_values).toEqual(expect.objectContaining({
      index_id: "tfidf-index-support-v2",
      index_kind: "tfidf",
      vocabulary_ref: "support-vocabulary-v2",
    }));
    expect(example(tfidf, "instance")?.field_values).toEqual(expect.objectContaining({
      index_id: "tfidf-index-scikit-17",
      index_kind: "tfidf",
      active_version_ref: "scikit-tfidf-build-17",
    }));

    expect(hybrid.structure?.identity_keys).toEqual(["index_id"]);
    expect(field(hybrid, "hybrid_index_id")).toBeUndefined();
    expect(field(hybrid, "index_kind")).toMatchObject({ required: true, allowed_values: ["hybrid"] });
    expect(field(hybrid, "schema_ref")).toMatchObject({ required: true });
    expect(example(hybrid, "positive")?.field_values).toEqual(expect.objectContaining({
      index_id: "hybrid-index-support-v2",
      index_kind: "hybrid",
      fusion_policy_ref: "rrf-k60",
    }));
    expect(example(hybrid, "instance")?.field_values).toEqual(expect.objectContaining({
      index_id: "hybrid-index-pinecone-17",
      index_kind: "hybrid",
      active_version_ref: "pinecone-hybrid-build-17",
    }));
  });

  it("materializes the shared Representation record once through vector, dense, sparse, and embedding records", () => {
    const vector = readNode("Representation", "VectorRepresentation");
    const dense = readNode("Representation", "VectorRepresentation", "DenseVector");
    const sparse = readNode("Representation", "VectorRepresentation", "SparseVector");
    const embedding = readNode("Representation", "VectorRepresentation", "EmbeddingVector");

    expect(vector.structure?.identity_keys).toEqual(["representation_id"]);
    expect(field(vector, "vector_representation_id")).toBeUndefined();
    expect(field(vector, "representation_kind")).toMatchObject({ required: true });
    expect(field(vector, "encoding_schema_ref")).toMatchObject({ required: true });
    expect(field(vector, "encoding_run_ref")).toMatchObject({ required: true });
    expect(field(vector, "representation_digest")).toMatchObject({ required: true });
    expect(example(vector, "positive")?.field_values).toEqual(expect.objectContaining({
      representation_id: "vector-auth-42",
      representation_kind: "embedding_vector",
      encoding_run_ref: "embedding-run-auth-42",
    }));

    expect(dense.structure?.identity_keys).toEqual(["representation_id"]);
    expect(field(dense, "dense_vector_id")).toBeUndefined();
    expect(field(dense, "representation_kind")).toMatchObject({ allowed_values: ["dense_vector"] });
    expect(field(dense, "encoding_schema_ref")).toMatchObject({ required: true });
    expect(field(dense, "encoding_run_ref")).toMatchObject({ required: true });
    expect(field(dense, "representation_digest")).toMatchObject({ required: true });
    expect(example(dense, "instance")?.field_values).toEqual(expect.objectContaining({
      representation_id: "dense-pgvector-17",
      representation_kind: "dense_vector",
      vector_space_ref: "support-embedding-768",
    }));

    expect(sparse.structure?.identity_keys).toEqual(["representation_id"]);
    expect(field(sparse, "sparse_vector_id")).toBeUndefined();
    expect(field(sparse, "representation_kind")).toMatchObject({ allowed_values: ["sparse_vector"] });
    expect(field(sparse, "vector_space_ref")).toMatchObject({ required: true });
    expect(field(sparse, "encoding_schema_ref")).toMatchObject({ required: true });
    expect(example(sparse, "positive")?.field_values).toEqual(expect.objectContaining({
      representation_id: "sparse-search-42",
      representation_kind: "sparse_vector",
      vector_space_ref: "bm25-vocabulary-v1",
    }));

    expect(embedding.structure?.identity_keys).toEqual(["representation_id"]);
    expect(field(embedding, "embedding_vector_id")).toBeUndefined();
    expect(field(embedding, "embedding_model")).toMatchObject({ required: true });
    expect(field(embedding, "coordinate_encoding")).toMatchObject({ required: true });
    expect(field(embedding, "encoding_run_ref")).toMatchObject({ required: true });
    expect(example(embedding, "instance")?.field_values).toEqual(expect.objectContaining({
      representation_id: "embedding-st-17",
      representation_kind: "embedding_vector",
      embedding_model: "all-MiniLM-L6-v2",
    }));
  });

  it("keeps TextEmbedding and GraphEmbedding as auditably complete EmbeddingVector records", () => {
    const text = readNode("Representation", "VectorRepresentation", "EmbeddingVector", "TextEmbedding");
    const graph = readNode("Representation", "VectorRepresentation", "EmbeddingVector", "GraphEmbedding");

    expect(text.structure?.identity_keys).toEqual(["representation_id"]);
    expect(field(text, "embedding_id")).toBeUndefined();
    expect(field(text, "source_artifact_ref")).toMatchObject({ required: true });
    expect(field(text, "representation_kind")).toMatchObject({ allowed_values: ["text_embedding"] });
    expect(field(text, "embedding_model")).toMatchObject({ required: true });
    expect(field(text, "encoding_run_ref")).toMatchObject({ required: true });
    expect(example(text, "positive")?.field_values).toEqual(expect.objectContaining({
      representation_id: "text-emb-001",
      representation_kind: "text_embedding",
      embedding_model: "text-embedding-3-small",
      coordinate_encoding: "float",
    }));
    expect(example(text, "instance")?.field_values).toEqual(expect.objectContaining({
      representation_id: "text-emb-jwt-01",
      vector_space_ref: "text-embedding-3-small-1536",
      encoding_run_ref: "embedding-run-jwt-01",
    }));

    expect(graph.structure?.identity_keys).toEqual(["representation_id"]);
    expect(field(graph, "graph_embedding_id")).toBeUndefined();
    expect(field(graph, "source_artifact_ref")).toMatchObject({ required: true });
    expect(field(graph, "representation_kind")).toMatchObject({ allowed_values: ["graph_embedding"] });
    expect(field(graph, "embedding_model")).toMatchObject({ required: true });
    expect(field(graph, "encoding_schema_ref")).toMatchObject({ required: true });
    expect(example(graph, "positive")?.field_values).toEqual(expect.objectContaining({
      representation_id: "graph-embedding-policy-42",
      graph_snapshot_ref: "knowledge-graph-v7",
      embedding_model: "node2vec",
    }));
    expect(example(graph, "instance")?.field_values).toEqual(expect.objectContaining({
      representation_id: "graph-embedding-neo4j-17",
      representation_kind: "graph_embedding",
      encoding_run_ref: "graph-embedding-run-neo4j-17",
    }));
  });

  it("separates membership-building from Elasticsearch visibility refresh, and puts refresh beneath IndexActivity", () => {
    expect(existsSync(ontologyPath("IndexActivity", "IndexBuildRun", "IndexRefreshRun", "node.yaml"))).toBe(false);
    expect(existsSync(ontologyPath("IndexActivity", "IndexRefreshRun", "node.yaml"))).toBe(true);

    const activity = readNode("IndexActivity");
    const build = readNode("IndexActivity", "IndexBuildRun");
    const refresh = readNode("IndexActivity", "IndexRefreshRun");
    const version = readNode("Index", "IndexVersion");

    expect(field(activity, "activity_kind")).toMatchObject({
      allowed_values: ["build", "upsert", "delete", "visibility_refresh"],
    });
    expect(field(activity, "target_index_ref")).toMatchObject({ required: true });
    expect(field(activity, "representation_refs")).toMatchObject({ required: false });

    expect(build.parent_relation).toMatchObject({ predicate: "is_a", target: "concept:IndexActivity" });
    expect(build.structure?.identity_keys).toEqual(["activity_id"]);
    expect(field(build, "index_build_run_id")).toBeUndefined();
    expect(field(build, "representation_refs")).toMatchObject({ required: true });
    expect(example(build, "positive")?.field_values).toEqual(expect.objectContaining({
      activity_id: "build-p-88-4",
      activity_kind: "build",
      target_index_ref: "project-index-p-88",
    }));

    expect(refresh.parent_relation).toMatchObject({ predicate: "is_a", target: "concept:IndexActivity" });
    expect(refresh.structure?.identity_keys).toEqual(["activity_id"]);
    expect(field(refresh, "index_refresh_run_id")).toBeUndefined();
    expect(field(refresh, "activity_kind")).toMatchObject({ allowed_values: ["visibility_refresh"] });
    expect(field(refresh, "shard_summary")).toMatchObject({ required: false });
    expect(field(refresh, "prior_version_ref")).toBeUndefined();
    expect(field(refresh, "target_version_ref")).toBeUndefined();
    expect(refresh.engineering?.typical_input?.[0]?.format).toContain("POST /support-index/_refresh");
    expect(JSON.parse(refresh.engineering?.typical_output?.[0]?.format as string)).toMatchObject({
      _shards: { total: 2, successful: 2, failed: 0 },
    });
    expect(sourceClaim(refresh, "claim-index-refresh-run")).toMatchObject({
      source: "elasticsearch-refresh-api",
      locator: "Refresh an index: target expression and synchronous shard response",
    });
    expect(example(refresh, "instance")?.field_values).toEqual(expect.objectContaining({
      activity_id: "index-refresh-elastic-17",
      activity_kind: "visibility_refresh",
      target_index_ref: "elastic-support-index",
    }));
    expect(version.semantics?.definition?.en).not.toContain("IndexRefreshRun");
  });

  it("keeps the OpenAI Text Embeddings request and response shapes native while preserving the inherited record", () => {
    const text = readNode("Representation", "VectorRepresentation", "EmbeddingVector", "TextEmbedding");
    const request = text.engineering?.typical_input?.[0]?.format;
    const response = text.engineering?.typical_output?.[0]?.format;

    expect(typeof request).toBe("string");
    const requestLines = (request as string).trim().split("\n");
    expect(requestLines[0]).toBe("POST /v1/embeddings");
    expect(JSON.parse(requestLines[1] ?? "")).toMatchObject({
      model: "text-embedding-3-small",
      input: "How to implement JWT authentication in Express.js",
      dimensions: 2,
      encoding_format: "float",
    });
    expect(typeof response).toBe("string");
    expect(JSON.parse(response as string)).toMatchObject({
      object: "list",
      data: [{ object: "embedding", index: 0, embedding: [0.015, -0.032] }],
      model: "text-embedding-3-small",
    });
  });

  it("keeps refresh observation separate from the API call and from any IndexVersion", () => {
    const event = readNode("IndexRefreshEvent");

    expect(event.structure?.identity_keys).toEqual(["index_refresh_event_id"]);
    expect(field(event, "refresh_run_ref")).toMatchObject({ required: true });
    expect(field(event, "target_index_ref")).toMatchObject({ required: true });
    expect(field(event, "index_expression")).toMatchObject({ required: true });
    expect(field(event, "target_version_ref")).toBeUndefined();
    expect(field(event, "shard_summary")).toMatchObject({ required: false });
    expect(example(event, "positive")?.field_values).toEqual(expect.objectContaining({
      refresh_run_ref: "index-refresh-support-42",
      target_index_ref: "support-index",
      index_expression: "support-index",
      event_type: "completed",
    }));
    expect(sourceClaim(event, "claim-index-refresh-event-lifecycle")).toMatchObject({
      source: "elasticsearch-refresh-api",
      locator: "Refresh an index: target expression and synchronous shard response",
    });
  });

  it("keeps external facts separate from Moonweave ontology design in every source claim", () => {
    const authorityNames = /\b(OpenAI|Pinecone|Elasticsearch|FAISS|pgvector|scikit-learn|PROV-O|OpenTelemetry|Neo4j|SentenceTransformers|PyTorch|W3C)\b/i;

    for (const node of allOntologyNodes()) {
      for (const claim of node.source_claims ?? []) {
        const support = String(claim.supports);
        expect(claim.source).toEqual(expect.any(String));
        expect(claim.locator).toEqual(expect.any(String));

        if (claim.evidence_kind === "ontology-design-inference") {
          expect(support).toMatch(/^Moonweave\b/);
          expect(support).not.toMatch(authorityNames);
        } else {
          expect(["official-documentation", "standard"]).toContain(claim.evidence_kind);
          expect(support).not.toContain("Moonweave");
        }
      }
    }
  });
});
