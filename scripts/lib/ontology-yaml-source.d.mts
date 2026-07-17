export type OntologyNodeKind = "ontology" | "domain" | "module" | "concept";

export interface LoadedOntologyNode {
  readonly schema: "moonweave.ai/ontology-node/v1";
  readonly id: string;
  readonly kind: OntologyNodeKind;
  readonly source_path: string;
  readonly [key: string]: unknown;
}

export interface LoadedOntologyTree {
  readonly root: LoadedOntologyNode;
  readonly rootId: string;
  readonly nodes: readonly LoadedOntologyNode[];
  readonly nodesById: ReadonlyMap<string, LoadedOntologyNode>;
  readonly parentById: ReadonlyMap<string, string>;
  readonly pathById: ReadonlyMap<string, string>;
  readonly sourceFiles: readonly string[];
  readonly sourceTreeSha256: string;
}

export class OntologySourceError extends Error {
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export function loadOntologyTree(options: Readonly<{
  sourceDir: string;
  limits?: Readonly<{
    maxNodes?: number;
    maxDepth?: number;
    maxFileBytes?: number;
    maxTotalBytes?: number;
  }>;
}>): Promise<LoadedOntologyTree>;

