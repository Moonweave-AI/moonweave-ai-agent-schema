import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { compileOntologyBundle } from "../scripts/lib/ontology-yaml-compiler.mjs";

interface CanonicalRecord {
  readonly id: string;
  readonly [key: string]: unknown;
}

interface CompiledOntologyBundle {
  readonly canonical: {
    readonly id: string;
    readonly planes: readonly CanonicalRecord[];
    readonly modules: readonly CanonicalRecord[];
    readonly classes: readonly CanonicalRecord[];
    readonly relations: readonly CanonicalRecord[];
    readonly artifact_metadata: {
      readonly release_channel: "candidate" | "release";
      readonly releasable: boolean;
    };
  };
  readonly communityGraph: {
    readonly communities: readonly CanonicalRecord[];
    readonly nodes: readonly {
      readonly ref: string;
      readonly community_id: number;
      readonly degree: number;
    }[];
    readonly edges: readonly {
      readonly id: string;
      readonly source: string;
      readonly target: string;
      readonly relation: string;
      readonly evidence: "canonical" | "derived";
      readonly relation_kind: string;
      readonly layout_role: string;
    }[];
  };
  readonly sourceIndex: {
    readonly sources: readonly CanonicalRecord[];
  };
  readonly sourceTreeSha256: string;
}

const compile = compileOntologyBundle as (options: {
  readonly sourceDir: string;
}) => CompiledOntologyBundle | Promise<CompiledOntologyBundle>;

const temporaryRoots: string[] = [];

const rootNode = `schema: moonweave.ai/ontology-node/v1
id: agent-system-ontology
kind: ontology
status: accepted
labels:
  zh: 智能体系统本体
  en: Agent System Ontology
  ja: エージェントシステムオントロジー
semantics:
  short_definition: {zh: 智能体系统概念树。, en: The agent-system concept tree., ja: エージェントシステム概念ツリー。}
  definition: {zh: 智能体系统的唯一规范本体源。, en: The sole canonical ontology source for agent systems., ja: エージェントシステムの唯一の正規オントロジー源。}
  why_needed: {zh: 统一组织概念和证据。, en: Organizes concepts and evidence once., ja: 概念と証拠を一度だけ整理する。}
  includes: []
  excludes: []
  semantic_kind: null
  aliases: []
structure: null
examples: []
source_claims: []
parent_relation: null
relations: []
release:
  version: 1.0.0
  date: 2026-07-17
sources:
  - id: mcp-specification
    title: Model Context Protocol Specification
    publisher: Linux Foundation
    url: https://modelcontextprotocol.io/specification/
    version: 2025-11-25
    accessed_on: 2026-07-17
    source_type: official-specification
    review:
      status: accepted
      reviewed_on: 2026-07-17
      note: Manually verified against the cited specification.
review:
  status: accepted
  method: manual-semantic
  reviewer: yaml-tree-test-reviewer
  reviewed_on: 2026-07-17
  note: {zh: 已人工核查。, en: Manually reviewed., ja: 手動確認済み。}
  sections: {semantics: accepted, hierarchy: accepted, relations: accepted, structure: accepted, examples: accepted, source_claims: accepted}
`;

const domainNode = `schema: moonweave.ai/ontology-node/v1
id: information
kind: domain
status: accepted
labels: {zh: 信息, en: Information, ja: 情報}
semantics:
  short_definition: {zh: 可观察信息的领域。, en: The domain of observable information., ja: 観測可能な情報の領域。}
  definition: {zh: 组织进入智能体上下文的信息。, en: Organizes information entering agent context., ja: エージェントのコンテキストに入る情報を整理する。}
  why_needed: {zh: 区分信息与记忆。, en: Separates information from memory., ja: 情報と記憶を区別する。}
  includes: []
  excludes: []
  semantic_kind: null
  aliases: []
structure: null
examples: []
source_claims: []
parent_relation: null
relations: []
review:
  status: accepted
  method: manual-semantic
  reviewer: yaml-tree-test-reviewer
  reviewed_on: 2026-07-17
  note: {zh: 已人工核查。, en: Manually reviewed., ja: 手動確認済み。}
  sections: {semantics: accepted, hierarchy: accepted, relations: accepted, structure: accepted, examples: accepted, source_claims: accepted}
`;

const moduleNode = `schema: moonweave.ai/ontology-node/v1
id: context-ingress
kind: module
status: accepted
labels: {zh: 上下文摄入, en: Context Ingress, ja: コンテキスト取り込み}
semantics:
  short_definition: {zh: 上下文进入调用的模块。, en: Context entering a call., ja: コンテキストが呼び出しに入るモジュール。}
  definition: {zh: 组织一次调用可见信息的摄入边界。, en: Organizes the ingress boundary for information visible to one call., ja: 一回の呼び出しに見える情報の取り込み境界を整理する。}
  why_needed: {zh: 明确模块所有权。, en: Makes module ownership explicit., ja: モジュール所有権を明確にする。}
  includes: []
  excludes: []
  semantic_kind: null
  aliases: []
structure: null
examples: []
source_claims: []
parent_relation: null
relations: []
review:
  status: accepted
  method: manual-semantic
  reviewer: yaml-tree-test-reviewer
  reviewed_on: 2026-07-17
  note: {zh: 已人工核查。, en: Manually reviewed., ja: 手動確認済み。}
  sections: {semantics: accepted, hierarchy: accepted, relations: accepted, structure: accepted, examples: accepted, source_claims: accepted}
`;

const parentConceptNode = `schema: moonweave.ai/ontology-node/v1
id: context-container
kind: concept
status: accepted
labels: {zh: 上下文容器, en: Context Container, ja: コンテキストコンテナ}
semantics:
  short_definition: {zh: 承载上下文内容的容器。, en: A container of contextual content., ja: コンテキスト内容を保持するコンテナ。}
  definition: {zh: 为一次处理范围组织上下文内容。, en: Organizes contextual content for one processing scope., ja: 一つの処理範囲のコンテキスト内容を整理する。}
  why_needed: {zh: 提供上下文窗口的上位概念。, en: Provides the genus for a context window., ja: コンテキストウィンドウの上位概念を提供する。}
  includes: []
  excludes: []
  semantic_kind: information
  aliases: []
structure:
  identity_keys: []
  fields: []
  constraints: []
  required_relations: []
examples: []
source_claims: []
parent_relation: null
relations: []
review:
  status: accepted
  method: manual-semantic
  reviewer: yaml-tree-test-reviewer
  reviewed_on: 2026-07-17
  note: {zh: 已人工核查。, en: Manually reviewed., ja: 手動確認済み。}
  sections: {semantics: accepted, hierarchy: accepted, relations: accepted, structure: accepted, examples: accepted, source_claims: accepted}
`;

const childConceptNode = `schema: moonweave.ai/ontology-node/v1
id: context-window
kind: concept
status: accepted
labels: {zh: 上下文窗口, en: Context Window, ja: コンテキストウィンドウ}
semantics:
  short_definition: {zh: 一次调用可见的有限上下文。, en: Bounded context visible to one call., ja: 一回の呼び出しに見える有限のコンテキスト。}
  definition: {zh: 上下文窗口是为一次模型调用选择的有限内容集合。, en: A context window is the bounded content selected for one model invocation., ja: コンテキストウィンドウは一回のモデル呼び出し用に選択された有限の内容集合。}
  why_needed: {zh: 明确一次调用的信息边界。, en: Defines the information boundary of one call., ja: 一回の呼び出しの情報境界を定義する。}
  includes: []
  excludes: []
  semantic_kind: information
  aliases: []
structure:
  identity_keys: [window-id]
  fields:
    - id: window-id
      labels: {zh: 窗口标识, en: Window ID, ja: ウィンドウID}
      definition: {zh: 一次窗口的稳定标识。, en: Stable identity of one window., ja: 一つのウィンドウの安定した識別子。}
      datatype: string
      required: true
      cardinality: {min: 1, max: 1}
      pattern: '^[a-z0-9-]+$'
      example_value: call-842
      allowed_values:
        - id: standard-window
          value: standard
          labels: {zh: 标准窗口, en: Standard window, ja: 標準ウィンドウ}
          definition: {zh: 标准调用窗口。, en: A standard invocation window., ja: 標準呼び出しウィンドウ。}
          source_claims: [claim-context-window-boundary]
      source_claims: [claim-context-window-boundary]
  constraints:
    - id: rule-token-budget
      severity: error
      language: plain
      expression: token_count <= model_limit
      explanation: {zh: 窗口不得超过模型限制。, en: The window must not exceed the model limit., ja: ウィンドウはモデル制限を超えてはならない。}
      source_claims: [claim-context-window-boundary]
  required_relations: []
examples:
  - id: context-window-instance-call-842
    kind: instance
    labels: {zh: 调用 842, en: Call 842, ja: 呼び出し842}
    description: {zh: 调用 842 使用标准窗口。, en: Call 842 uses a standard window., ja: 呼び出し842は標準ウィンドウを使用する。}
    field_values: {window-id: call-842}
    related_nodes: [concept:context-window]
    related_relations: [context-window-is-a-context-container]
    expected_result: {zh: 窗口可按标识定位。, en: The window is addressable by ID., ja: ウィンドウはIDで特定できる。}
    rationale: {zh: 满足标识与限制。, en: It satisfies identity and bounds., ja: 識別子と制限を満たす。}
    synthetic: true
    source_claims: []
source_claims:
  - id: claim-context-window-boundary
    source: mcp-specification
    supports: MCP messages and content establish the observable boundary used by this concept.
    locator: Architecture > Messages and content
    evidence_kind: official
    confidence: high
    review_status: accepted
parent_relation:
  id: context-window-is-a-context-container
  predicate: is_a
  relation_kind: hierarchy
  labels: {zh: 是一种, en: is a, ja: の一種}
  definition: {zh: 上下文窗口是一种上下文容器。, en: A context window is a context container., ja: コンテキストウィンドウはコンテキストコンテナの一種。}
  cardinality: null
  inverse_reading: null
  conditions: []
  temporal_scope: timeless
  boundary_context: null
  constraints: []
  examples: []
  source_claims: [claim-context-window-boundary]
  distinct_fact_rationale: null
  review_status: accepted
relations: []
review:
  status: accepted
  method: manual-semantic
  reviewer: yaml-tree-test-reviewer
  reviewed_on: 2026-07-17
  note: {zh: 已逐字段人工核查。, en: Manually reviewed field by field., ja: フィールドごとに手動確認済み。}
  sections: {semantics: accepted, hierarchy: accepted, relations: accepted, structure: accepted, examples: accepted, source_claims: accepted}
`;

const createSourceTree = (): string => {
  const root = mkdtempSync(join(tmpdir(), "ontology-yaml-build-"));
  temporaryRoots.push(root);
  const sourceDir = join(root, "ontology");
  const domainDir = join(sourceDir, "information");
  const moduleDir = join(domainDir, "context-ingress");
  const parentConceptDir = join(moduleDir, "context-container");
  const childConceptDir = join(parentConceptDir, "context-window");
  for (const directory of [sourceDir, domainDir, moduleDir, parentConceptDir, childConceptDir]) {
    mkdirSync(directory, { recursive: true });
  }
  for (const [directory, contents] of [
    [sourceDir, rootNode],
    [domainDir, domainNode],
    [moduleDir, moduleNode],
    [parentConceptDir, parentConceptNode],
    [childConceptDir, childConceptNode],
  ] as const) {
    writeFileSync(join(directory, "node.yaml"), contents, "utf8");
  }
  return sourceDir;
};

const yamlFiles = (root: string): string[] => readdirSync(root, { withFileTypes: true })
  .flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? yamlFiles(path) : entry.name === "node.yaml" ? [path] : [];
  })
  .sort((left, right) => left.localeCompare(right));

const sourceSnapshot = (root: string) => new Map(yamlFiles(root).map((path) => [
  relative(root, path).replaceAll("\\", "/"),
  {
    bytes: readFileSync(path),
    mtimeNs: statSync(path, { bigint: true }).mtimeNs,
  },
]));

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("YAML ontology bundle compiler", () => {
  it("marks a bundle releasable only when every node, source, and embedded review is accepted", async () => {
    const sourceDir = createSourceTree();

    const accepted = await compile({ sourceDir });
    expect(accepted.canonical.artifact_metadata).toMatchObject({
      release_channel: "release",
      releasable: true,
    });

    const childPath = join(
      sourceDir,
      "information",
      "context-ingress",
      "context-container",
      "context-window",
      "node.yaml",
    );
    writeFileSync(
      childPath,
      childConceptNode.replace("  review_status: accepted", "  review_status: pending"),
      "utf8",
    );
    const pendingRelation = await compile({ sourceDir });
    expect(pendingRelation.canonical.artifact_metadata).toMatchObject({
      release_channel: "candidate",
      releasable: false,
    });

    writeFileSync(childPath, childConceptNode.replace("status: accepted", "status: review"), "utf8");
    const pendingNode = await compile({ sourceDir });
    expect(pendingNode.canonical.artifact_metadata).toMatchObject({
      release_channel: "candidate",
      releasable: false,
    });

    writeFileSync(childPath, childConceptNode, "utf8");
    writeFileSync(
      join(sourceDir, "node.yaml"),
      rootNode.replace("      status: accepted", "      status: pending"),
      "utf8",
    );
    const pendingSource = await compile({ sourceDir });
    expect(pendingSource.canonical.artifact_metadata).toMatchObject({
      release_channel: "candidate",
      releasable: false,
    });
  });

  it("allows only classification or existential-part relations in an accepted directory backbone", async () => {
    const sourceDir = createSourceTree();
    const childPath = join(
      sourceDir,
      "information",
      "context-ingress",
      "context-container",
      "context-window",
      "node.yaml",
    );

    writeFileSync(
      childPath,
      childConceptNode
        .replace("predicate: is_a", "predicate: produces")
        .replace("relation_kind: hierarchy", "relation_kind: causal"),
      "utf8",
    );
    await expect(compile({ sourceDir })).rejects.toMatchObject({
      code: "INVALID_PRIMARY_PARENT",
    });

    writeFileSync(
      childPath,
      childConceptNode
        .replace("predicate: is_a", "predicate: part_of")
        .replace("relation_kind: hierarchy", "relation_kind: composition"),
      "utf8",
    );
    const partOfBundle = await compile({ sourceDir });
    expect(partOfBundle.canonical.relations).toEqual([
      expect.objectContaining({
        predicate: "part_of",
        relation_kind: "composition",
        source_id: "context-window",
        target_id: "context-container",
      }),
    ]);
  });

  it("compiles the minimal directory tree into the current UI canonical and community contracts", async () => {
    const sourceDir = createSourceTree();

    const { canonical, communityGraph } = await compile({ sourceDir });

    expect(canonical).toMatchObject({ id: "agent-system-ontology" });
    expect(canonical.planes.map(({ id }) => id)).toEqual(["information"]);
    expect(canonical.modules).toEqual([
      expect.objectContaining({ id: "context-ingress", plane_id: "information" }),
    ]);
    expect(canonical.classes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "context-container", module_id: "context-ingress" }),
      expect.objectContaining({
        id: "context-window",
        module_id: "context-ingress",
        primary_parent_relation_id: "context-window-is-a-context-container",
      }),
    ]));
    expect(canonical.relations).toEqual([
      expect.objectContaining({
        id: "context-window-is-a-context-container",
        predicate: "is_a",
        source_id: "context-window",
        target_id: "context-container",
        relation_kind: "hierarchy",
        layout_role: "primary-backbone",
        layout_parent_id: "context-container",
        layout_child_id: "context-window",
      }),
    ]);

    expect(communityGraph.nodes.map(({ ref }) => ref).sort()).toEqual([
      "concept:context-container",
      "concept:context-window",
      "module:context-ingress",
      "plane:information",
      "root:agent-system-ontology",
    ]);
    expect(communityGraph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "context-window-is-a-context-container",
        source: "concept:context-window",
        target: "concept:context-container",
        evidence: "canonical",
      }),
      expect.objectContaining({
        id: "derived:ontology-plane:information",
        source: "root:agent-system-ontology",
        target: "plane:information",
        evidence: "derived",
      }),
      expect.objectContaining({
        id: "derived:plane-module:information:context-ingress",
        source: "plane:information",
        target: "module:context-ingress",
        evidence: "derived",
      }),
      expect.objectContaining({
        id: "derived:module-root:context-ingress:context-container",
        source: "module:context-ingress",
        target: "concept:context-container",
        evidence: "derived",
      }),
    ]));
    expect(communityGraph.communities).toHaveLength(2);
  });

  it("does not rewrite, normalize, touch, or add YAML source files", async () => {
    const sourceDir = createSourceTree();
    const before = sourceSnapshot(sourceDir);

    await compile({ sourceDir });

    const after = sourceSnapshot(sourceDir);
    expect([...after.keys()]).toEqual([...before.keys()]);
    for (const [path, expected] of before) {
      const actual = after.get(path);
      expect(actual?.bytes.equals(expected.bytes), `${path} bytes changed`).toBe(true);
      expect(actual?.mtimeNs, `${path} was touched or rewritten`).toBe(expected.mtimeNs);
    }
  });

  it("is byte-semantically deterministic for an unchanged source tree", async () => {
    const sourceDir = createSourceTree();

    const first = await compile({ sourceDir });
    const second = await compile({ sourceDir });

    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(first.sourceTreeSha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("keeps rules, fields, constraints, controlled values, instances, and sources as node detail rather than graph nodes", async () => {
    const sourceDir = createSourceTree();

    const { canonical, communityGraph, sourceIndex } = await compile({ sourceDir });
    const contextWindow = canonical.classes.find(({ id }) => id === "context-window");

    expect(contextWindow).toMatchObject({
      structure: {
        identity_keys: ["window-id"],
        fields: [expect.objectContaining({
          id: "window-id",
          allowed_values: [expect.objectContaining({ id: "standard-window" })],
        })],
        constraints: [expect.objectContaining({ id: "rule-token-budget" })],
      },
      examples: [expect.objectContaining({
        id: "context-window-instance-call-842",
        kind: "instance",
      })],
      source_claims: [expect.objectContaining({
        source_id: "mcp-specification",
      })],
    });
    expect(sourceIndex.sources).toEqual([{
      id: "mcp-specification",
      title: "Model Context Protocol Specification",
      publisher: "Linux Foundation",
      url: "https://modelcontextprotocol.io/specification/",
      version: "2025-11-25",
      accessed_on: "2026-07-17",
      source_type: "official-specification",
      review: {
        status: "accepted",
        reviewed_on: "2026-07-17",
        note: "Manually verified against the cited specification.",
      },
    }]);

    const nodeRefs = new Set(communityGraph.nodes.map(({ ref }) => ref));
    expect(nodeRefs).toEqual(new Set([
      "root:agent-system-ontology",
      "plane:information",
      "module:context-ingress",
      "concept:context-container",
      "concept:context-window",
    ]));
    for (const detailId of [
      "window-id",
      "rule-token-budget",
      "standard-window",
      "context-window-instance-call-842",
      "mcp-specification",
      "claim-context-window-boundary",
    ]) {
      expect([...nodeRefs].some((ref) => ref.endsWith(`:${detailId}`)), detailId).toBe(false);
    }
  });
});
