import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";

import { stableJson } from "./lib/stable-json.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const canonical = JSON.parse(
  readFileSync(resolve(repositoryRoot, "ontology/agent-ontology.json"), "utf8"),
);
const appSource = readFileSync(resolve(repositoryRoot, "src/App.tsx"), "utf8");
const outputRoot = resolve(repositoryRoot, "ontology/source");

const propertyName = (property) => {
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) return property.name.text;
  return null;
};

const extractLabelOverrides = () => {
  const sourceFile = ts.createSourceFile(
    "App.tsx",
    appSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let initializer;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "entityLabelOverrides"
    ) {
      initializer = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    throw new Error("Unable to extract the frozen entityLabelOverrides baseline from App.tsx");
  }

  const result = { zh: {}, ja: {} };
  for (const languageProperty of initializer.properties) {
    if (!ts.isPropertyAssignment(languageProperty)) continue;
    const language = propertyName(languageProperty);
    if (!(language in result) || !ts.isObjectLiteralExpression(languageProperty.initializer)) continue;
    for (const entry of languageProperty.initializer.properties) {
      if (!ts.isPropertyAssignment(entry)) continue;
      const id = propertyName(entry);
      if (!id || !ts.isStringLiteral(entry.initializer)) continue;
      result[language][id] = entry.initializer.text;
    }
  }
  return result;
};

const labelOverrides = extractLabelOverrides();
const labelsFor = (record) => {
  const labels = { en: record.label };
  if (labelOverrides.zh[record.id]) labels.zh = labelOverrides.zh[record.id];
  if (labelOverrides.ja[record.id]) labels.ja = labelOverrides.ja[record.id];
  return labels;
};

const localized = (zh, en, ja) => ({ zh, en, ja });
const draftReview = {
  review_status: "draft",
  reviewers: [],
};
const pendingFacet = {
  applicable: false,
  not_applicable_reason: localized(
    "旧版只读基线没有可接受的模块交互合同，等待领域审查。",
    "The frozen legacy baseline has no accepted Module interaction contract; domain review is pending.",
    "凍結された旧基準には承認済みのモジュール相互作用契約がなく、ドメインレビュー待ちです。",
  ),
};

const rootExample = {
  id: "agent-system-ontology-example-unified-graph",
  kind: "positive",
  labels: localized("统一 Agent 构建图谱", "Unified agent-building graph", "統一エージェント構築グラフ"),
  scenario_id: null,
  descriptions: localized(
    "工程师沿领域、模块和概念层级定位 Agent 构件，并在同一节点查看结构、案例与来源。",
    "An engineer follows Domain, Module, and Concept hierarchy and reads structure, cases, and sources on the same node.",
    "技術者はドメイン、モジュール、概念階層を辿り、同じノードで構造、事例、情報源を確認します。",
  ),
  field_values: {},
  related_node_ids: [],
  related_relation_ids: [],
  expected_result: localized(
    "不需要切换到第二张 Schema、实例或治理图。",
    "No second Schema, instance, or governance graph is needed.",
    "第二のスキーマ、インスタンス、ガバナンスグラフへ切り替える必要がありません。",
  ),
  why_valid_or_invalid: localized(
    "案例复用同一 canonical 节点和边。",
    "The case reuses the same canonical nodes and relations.",
    "事例は同じ正規ノードと関係を再利用します。",
  ),
  synthetic: true,
  verified_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
  source_claims: [],
};

const architectureReview = {
  review_status: "accepted",
  reviewers: [
    {
      reviewer_id: "codex-rfc-contract-architect",
      reviewer_role: "architecture",
      reviewer_kind: "automated-agent",
      reviewed_on: "2026-07-13",
      decision_note: localized(
        "接受八域、统一图谱和内嵌信息架构；不自动接受旧领域语义。",
        "Approved the eight-Domain, unified-graph, inline-information architecture without accepting legacy domain semantics.",
        "八ドメイン、統一グラフ、インライン情報アーキテクチャを承認しましたが、旧ドメイン意味論は自動承認していません。",
      ),
    },
  ],
};

const root = canonical;
const productSource = {
  source_kind: "agent-ontology-product",
  contract_version: "1.0.0",
  product: {
    id: root.id,
    labels: localized(
      "智能体系统本体",
      "Agent System Ontology",
      "エージェントシステム本体",
    ),
    short_definitions: localized(
      "为 Agent 构建、运行与治理提供闭环逻辑的一张统一概念图。",
      "One unified concept graph providing closed-loop logic for building, running, and governing agents.",
      "エージェントの構築、実行、統治に閉ループ論理を提供する一つの統一概念グラフ。",
    ),
    definitions: root.definitions,
    why_needed: localized(
      "统一标识、专业化层级和关系合同使实现、验证、案例和外部映射共享同一语义依据。",
      "Shared identifiers, specialization hierarchy, and relation contracts give implementation, validation, cases, and external mappings one semantic basis.",
      "共通識別子、特殊化階層、関係契約により、実装、検証、事例、外部写像が同じ意味基盤を共有します。",
    ),
    includes: [
      localized(
        "八个 Agent 工程领域、四十一个模块及其可审查的概念和关系。",
        "Eight agent-engineering Domains, forty-one Modules, and their reviewable Concepts and Relations.",
        "八つのエージェント工学ドメイン、四十一のモジュール、およびレビュー可能な概念と関係。",
      ),
    ],
    excludes: [
      localized(
        "私有思维链，以及仅用于解释节点的 Schema、实例、来源或案例影子节点。",
        "Private chain of thought and Schema, instance, source, or case shadow nodes that only explain another node.",
        "非公開の思考連鎖と、別ノードを説明するだけのスキーマ、インスタンス、情報源、事例のシャドーノード。",
      ),
    ],
    examples: [rootExample],
    source_claims: [
      {
        source_id: "eng-ont-fibo-viewer",
        supports: "FIBO demonstrates modular, stable-identifier ontology publication and hierarchical browsing.",
        locator: "FIBO Viewer domain/module/ontology navigation",
        evidence_kind: "official",
        confidence: "high",
        review_status: "accepted",
      },
      {
        source_id: "eng-ont-microsoft-fabric-iq-ontology",
        supports: "Entity types, properties, constraints, and typed directional relationships form a unified semantic graph.",
        locator: "Ontology overview / Core concepts",
        evidence_kind: "official",
        confidence: "high",
        review_status: "accepted",
      },
      {
        source_id: "eng-ont-skan-agentic-ontology-of-work",
        supports: "Canonical entities, relationships, governance constraints, lifecycle, and examples jointly support an explainable agent-work model.",
        locator: "Inside the document",
        evidence_kind: "vendor",
        confidence: "medium",
        review_status: "accepted",
      },
    ],
    status: "draft-hierarchy-upgrade",
    review: architectureReview,
    date: "2026-07-13",
    canonical_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
  },
  planes: canonical.planes.map((plane) => ({
    id: plane.id,
    labels: labelsFor(plane),
    definitions: plane.definitions,
    status: "draft",
    review: draftReview,
  })),
  global_constraints: [
    {
      id: "global-no-hidden-chain-of-thought",
      severity: "error",
      expression_language: "plain",
      expression: "Canonical information describes observable plans, actions, decisions, summaries, state changes, results, and evidence; it never requires private chain-of-thought.",
      explanations: localized(
        "canonical 信息不得要求保存私有思维链。",
        "Canonical information must not require private chain-of-thought storage.",
        "正規情報は非公開の思考連鎖の保存を要求してはなりません。",
      ),
      source_claims: [
        {
          source_id: "eng-fw-openai-tracing",
          supports: "Observable traces can record spans and events without requiring private reasoning text.",
          locator: "Tracing overview",
          evidence_kind: "official",
          confidence: "high",
          review_status: "accepted",
        },
      ],
    },
  ],
  case_paths: [],
  hygiene_gates: [
    {
      id: "no-annotation-shadow-graph-elements",
      labels: localized("禁止注解影子图元", "No annotation shadow graph elements", "注釈シャドーグラフ要素禁止"),
      descriptions: localized(
        "结构字段、约束、例子、来源和案例不得投影为 GraphNode 或 canonical Relation。",
        "Structure fields, constraints, examples, sources, and cases cannot be projected as GraphNodes or canonical Relations.",
        "構造フィールド、制約、例、情報源、事例を GraphNode または正規 Relation として投影してはなりません。",
      ),
      severity: "error",
      check_kind: "ui",
      expression: "annotation_graph_node_count == 0 && annotation_graph_edge_count == 0",
      status: "accepted",
      source_claims: [],
    },
  ],
};

mkdirSync(outputRoot, { recursive: true });
writeFileSync(
  resolve(outputRoot, "agent-ontology.product.json"),
  stableJson(productSource),
  "utf8",
);

const moduleById = new Map(canonical.modules.map((module) => [module.id, module]));
const conceptsByModule = new Map();
for (const concept of canonical.classes) {
  conceptsByModule.set(concept.module_id, [
    ...(conceptsByModule.get(concept.module_id) ?? []),
    concept,
  ]);
}

for (const module of canonical.modules) {
  const domainDirectory = module.plane_id.replace(/-plane$/, "");
  const directory = resolve(outputRoot, domainDirectory);
  mkdirSync(directory, { recursive: true });
  const source = {
    source_kind: "agent-ontology-module",
    contract_version: "1.0.0",
    module: {
      id: module.id,
      plane_id: module.plane_id,
      labels: labelsFor(module),
      definitions: module.definitions,
      interaction_contract: {
        applicability: "mixed",
        facets: {
          input: pendingFacet,
          output: pendingFacet,
          failure: pendingFacet,
          recovery: pendingFacet,
        },
        review: draftReview,
      },
      taxonomy_contract: {
        applicability: "specialization",
        not_applicable_reason: null,
        review: draftReview,
      },
      status: "draft",
      review: draftReview,
    },
    classes: (conceptsByModule.get(module.id) ?? []).map((concept) => ({
      id: concept.id,
      module_id: concept.module_id,
      labels: labelsFor(concept),
      definitions: concept.definitions,
      semantic_kind: null,
      status: "draft",
      review: draftReview,
    })),
    relations: [],
  };
  writeFileSync(resolve(directory, `${module.id}.json`), stableJson(source), "utf8");
}

const legacyModuleCount = 41;
if (moduleById.size !== legacyModuleCount) {
  throw new Error(`Expected ${legacyModuleCount} frozen v1 Modules, found ${moduleById.size}`);
}
