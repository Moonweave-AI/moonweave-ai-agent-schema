import fs from "node:fs";
import path from "node:path";

import {
  ONTOLOGY_V3_MODULE_BOUNDARIES,
  validateOntologyV3ModuleBoundaries,
} from "./data/ontology-v3-module-boundaries.mjs";
import {
  ONTOLOGY_V3_INTERACTION_CONTRACTS,
  validateOntologyV3InteractionContracts,
} from "./data/ontology-v3-interaction-contracts.mjs";
import {
  ONTOLOGY_V3_OVERLAP_CANDIDATES,
  validateOntologyV3OverlapCandidates,
} from "./data/ontology-v3-overlap-candidates.mjs";
import {
  ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS,
  validateOntologyV3DirectionalDistinctFacts,
} from "./data/ontology-v3-directional-distinct-facts.mjs";
import {
  ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS,
  validateOntologyV3RepresentativeInverseReadings,
} from "./data/ontology-v3-representative-inverse-readings.mjs";
import {
  ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS,
  ONTOLOGY_V3_ROOT_STATUS_DECISIONS,
  ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS,
  validateOntologyV3BackboneDecisions,
} from "./data/ontology-v3-backbone-decisions.mjs";
import { buildEffectiveConceptStructures } from "./lib/ontology-concept-structure.mjs";
import { stableJson } from "./lib/stable-json.mjs";
import { loadFrozenV2SemanticBaseline } from "./lib/ontology-v2-semantic-baseline.mjs";
import { reviewedConceptHistoryDecision } from "./lib/ontology-v3-concept-history.mjs";
import {
  assertObjectEvidenceQuality,
  objectClaimKey,
  rewriteConceptDirectClaims,
  rewriteGenericConceptExamples,
  rewriteObjectEvidenceTree,
  rewriteObjectReview,
  rewriteRelationDirectClaims,
} from "./lib/ontology-v3-object-evidence.mjs";
import { writeFileTransaction } from "./lib/atomic-write.mjs";

import { createLegacyStructurePhases } from "./migration/semantic-depth-v3/legacy-structure.mjs";
import { createRecordOperationPhases } from "./migration/semantic-depth-v3/record-operations.mjs";
import { createSemanticFoundationPhases } from "./migration/semantic-depth-v3/semantic-foundations.mjs";
import { createSemanticFlowPhases } from "./migration/semantic-depth-v3/semantic-flows.mjs";
import { createDelegationNodeInformationPhases } from "./migration/semantic-depth-v3/delegation-node-information.mjs";
import { createSemanticRepairPhases } from "./migration/semantic-depth-v3/semantic-repairs.mjs";
import { createAgencyCorrectionPhases } from "./migration/semantic-depth-v3/agency-corrections.mjs";
import { createModuleMetadataPhases } from "./migration/semantic-depth-v3/module-metadata.mjs";
import { createConceptTerminologyPhases } from "./migration/semantic-depth-v3/concept-terminology.mjs";
import { createObjectEvidencePhases } from "./migration/semantic-depth-v3/object-evidence.mjs";
import { createPersistencePhases } from "./migration/semantic-depth-v3/persistence.mjs";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "ontology", "source");
const REVIEW_DATE = "2026-07-14";
const VERSION_IRI = "https://moonweave.ai/ontology/agent-system/2.0.0/";
const pendingWrites = new Map();

const stageFile = (filePath, contents) => {
  pendingWrites.set(path.resolve(filePath), contents);
};

const localized = (zh, en, ja) => ({ zh, en, ja });

const MODULE_CONFIG = {
  "info-container-command": ["执行观测", "Execution observations", "実行観測", "ExecutionObservation", "runtime-observability"],
  "info-content-block-modality": ["内容表示", "Content representation", "内容表現", "ContentBlock", "info-messages-instructions"],
  "info-indexing": ["上下文发现", "Context discovery", "コンテキスト発見", "DiscoveryActivity", "memory-retrieval-ranking"],
  "info-messages-instructions": ["消息与会话", "Messages and conversations", "メッセージと会話", "Conversation", "info-prompts-instructions"],
  "info-prompts-instructions": ["提示与指令", "Prompts and instructions", "プロンプトと指示", "Instruction", "info-messages-instructions"],
  "info-output-disclosure": ["输出披露", "Output disclosure", "出力開示", "DisclosureActivity", "safety-disclosure-redaction"],
  "info-storage-sources": ["来源与定位", "Sources and locations", "出典と位置", "SourceReference", "memory-ingestion"],
  "orchestration-task-planning": ["目标与任务规划", "Goals and task planning", "目標とタスク計画", "WorkSpecification", "runtime-execution-attempts"],
  "orchestration-actors-delegation": ["协同角色", "Coordination roles", "協調ロール", "CoordinationRole", "orchestration-delegation-handoff"],
  "orchestration-delegation-handoff": ["委派与移交", "Delegation and handoff", "委任と引き継ぎ", "DelegationProcess", "orchestration-actors-delegation"],
  "orchestration-routing-control": ["路由与门控", "Routing and gates", "経路制御とゲート", "RoutingSpecification", "orchestration-composition"],
  "orchestration-composition": ["协作组合", "Collaboration composition", "協働構成", "CompositionPattern", "orchestration-routing-control"],
  "orchestration-evaluation": ["改进循环编排", "Improvement-loop orchestration", "改善ループ編成", "ImprovementLoop", "feedback-review-optimization"],
  "runtime-actors": ["运行参与者与绑定", "Runtime participants and bindings", "実行参加者とバインディング", "Actor", "orchestration-actors-delegation"],
  "runtime-system": ["运行环境与会话", "Runtime environments and sessions", "実行環境とセッション", "AgentSystem", "runtime-execution-attempts"],
  "runtime-execution-attempts": ["执行尝试与结果", "Execution attempts and outcomes", "実行試行と結果", "Execution", "runtime-system"],
  "runtime-observability": ["追踪与检查点", "Tracing and checkpoints", "トレースとチェックポイント", "ObservabilityRecord", "feedback-logging"],
  "runtime-artifacts": ["运行产物", "Runtime artifacts", "実行成果物", "Artifact", "runtime-observability"],
  "adapter-mapping-infrastructure": ["映射规则与验证", "Mapping rules and validation", "写像規則と検証", "Adapter", "adapter-frameworks"],
  "adapter-protocols": ["协议映射", "Protocol mappings", "プロトコル写像", "ProtocolAdapter", "adapter-mapping-infrastructure"],
  "adapter-frameworks": ["框架映射", "Framework mappings", "フレームワーク写像", "FrameworkAdapter", "adapter-mapping-infrastructure"],
  "adapter-benchmarks": ["基准映射", "Benchmark mappings", "ベンチマーク写像", "BenchmarkAdapter", "adapter-mapping-infrastructure"],
  "adapter-statecharts": ["状态图映射", "Statechart mappings", "ステートチャート写像", "StatechartAdapter", "adapter-mapping-infrastructure"],
  "adapter-schema-export": ["模式导出", "Schema exports", "スキーマ出力", "ProjectionAdapter", "adapter-mapping-infrastructure"],
  "tool-registry-definition": ["能力定义与注册", "Capability definition and registration", "能力定義と登録", "Tool", "tool-discovery-selection"],
  "tool-discovery-selection": ["能力发现与选择", "Capability discovery and selection", "能力発見と選択", "ToolSearch", "tool-registry-definition"],
  "tool-invocation-execution": ["调用与执行", "Invocation and execution", "呼び出しと実行", "Invocation", "runtime-execution-attempts"],
  "tool-mcp-transport": ["MCP 交互", "MCP interactions", "MCP インタラクション", "MCPSession", "adapter-protocols"],
  "safety-trust-boundary": ["信任边界与数据区", "Trust boundaries and data zones", "信頼境界とデータゾーン", "TrustBoundary", "safety-permission-policy"],
  "safety-permission-policy": ["授权与策略决策", "Authorization and policy decisions", "認可とポリシー判断", "PolicySpecification", "safety-trust-boundary"],
  "safety-sandbox-network": ["执行隔离", "Execution isolation", "実行分離", "IsolationSpecification", "safety-network-control"],
  "safety-network-control": ["网络访问控制", "Network access control", "ネットワークアクセス制御", "NetworkInteraction", "safety-sandbox-network"],
  "safety-injection-defense": ["注入与内容投毒防御", "Injection and content-poisoning defense", "注入とコンテンツ汚染防御", "ThreatSignal", "info-prompts-instructions"],
  "safety-commit-redaction": ["副作用提交控制", "Side-effect commit control", "副作用コミット制御", "CommitGate", "safety-disclosure-redaction"],
  "safety-disclosure-redaction": ["披露与脱敏", "Disclosure and redaction", "開示と墨消し", "DisclosureControlActivity", "info-output-disclosure"],
  "feedback-warning-error": ["故障与诊断", "Failures and diagnostics", "障害と診断", "DiagnosticSignal", "runtime-observability"],
  "feedback-metrics-evaluation": ["评估与度量", "Evaluation and measurement", "評価と測定", "EvaluationSpecification", "orchestration-evaluation"],
  "feedback-review-optimization": ["审查与纠正", "Review and correction", "レビューと修正", "ReviewActivity", "feedback-optimization-learning"],
  "feedback-optimization-learning": ["优化与学习", "Optimization and learning", "最適化と学習", "OptimizationLoop", "feedback-review-optimization"],
  "feedback-logging": ["日志与遥测", "Logging and telemetry", "ログとテレメトリ", "LogArtifact", "runtime-observability"],
  "memory-ingestion": ["记忆接入", "Memory ingestion", "記憶取り込み", "IngestionRun", "info-storage-sources"],
  "memory-chunking-situating": ["分块与语境化", "Chunking and contextualization", "チャンク化と文脈化", "ChunkProcessingActivity", "memory-ingestion"],
  "memory-embedding-indexes": ["表示与索引", "Representations and indexes", "表現と索引", "Representation", "memory-retrieval-ranking"],
  "memory-retrieval-ranking": ["检索与排序", "Retrieval and ranking", "検索と順位付け", "RetrievalArtifact", "info-indexing"],
  "memory-context": ["上下文组装", "Context assembly", "コンテキスト組み立て", "ContextAssembly", "info-output-disclosure"],
  "memory-lifecycle": ["记忆生命周期", "Memory lifecycle", "記憶ライフサイクル", "MemoryOperation", "memory-stores-scopes"],
  "memory-stores-scopes": ["记忆对象与存储", "Memory objects and stores", "記憶オブジェクトとストア", "MemoryEntity", "memory-lifecycle"],
};

const SPLITS = [
  {
    from: "info-messages-instructions",
    to: "info-prompts-instructions",
    move: ["FewShotExample", "Instruction", "InstructionApplicability", "InstructionAuthority", "InstructionMetadata", "InstructionOverride", "InstructionPriority", "InstructionProvenance", "InstructionResolution", "InstructionScope", "PromptTemplateInstance", "SystemPrompt"],
  },
  {
    from: "orchestration-actors-delegation",
    to: "orchestration-delegation-handoff",
    move: ["AgentAsToolInvocation", "ContextIsolation", "DelegatedAuthority", "DelegationBudget", "DelegationContract", "DelegationEvent", "DelegationOwnership", "DelegationProcess", "DelegationResult", "Handoff", "HandoffTarget", "ResponsibilityTransfer", "SubagentContext", "TaskDistribution", "WorkerAvailability", "WorkerCapabilityMatch", "WorkerPool", "WorkerSelection"],
  },
  {
    from: "runtime-system",
    to: "runtime-execution-attempts",
    move: ["RunAttempt", "RunOutcome", "RuntimeBudget"],
  },
  {
    from: "safety-sandbox-network",
    to: "safety-network-control",
    move: ["DeniedNetworkCall", "DomainSocket", "HTTPProxy", "InboundResponse", "NetworkCall", "NetworkEndpoint", "NetworkInteraction", "NetworkPolicy", "NetworkResource", "OutboundRequest", "Proxy", "ProxyRoute", "Socket", "SOCKSProxy"],
  },
  {
    from: "safety-commit-redaction",
    to: "safety-disclosure-redaction",
    move: ["AuditDisclosure", "DisclosureControlActivity", "DisclosureFilter", "DisclosureRule", "ProgressiveDisclosure", "Redaction", "RedactionRule", "SensitiveSpan", "SuppressedOutput"],
  },
  {
    from: "feedback-review-optimization",
    to: "feedback-optimization-learning",
    move: ["LearningSignal", "OptimizationLoop", "OptimizationTarget"],
  },
];

const PLANE_BOUNDARIES = {
  "info-plane": ["把外部或运行信息转成可定位、可选择、可披露的上下文证据。", "Turns external and runtime information into locatable, selectable, and disclosable context evidence.", "外部情報と実行情報を、位置付け・選択・開示可能なコンテキスト証拠へ変換します。"],
  "orchestration-plane": ["把目标分解为任务，并通过角色、委派、路由和组合控制协作。", "Decomposes goals into tasks and controls collaboration through roles, delegation, routing, and composition.", "目標をタスクへ分解し、ロール、委任、経路制御、構成で協働を制御します。"],
  "runtime-plane": ["记录参与者、环境、会话、执行尝试、轨迹和有版本的运行产物。", "Records participants, environments, sessions, execution attempts, traces, and versioned runtime artifacts.", "参加者、環境、セッション、実行試行、軌跡、版管理された実行成果物を記録します。"],
  "adapter-plane": ["把外部协议、框架、基准、状态图和模式投影到同一核心语义。", "Projects external protocols, frameworks, benchmarks, statecharts, and schemas onto one core semantics.", "外部プロトコル、フレームワーク、ベンチマーク、状態図、スキーマを一つの中核意味へ投影します。"],
  "tool-plane": ["从能力定义和发现，连续描述到调用、尝试、结果、影响与 MCP 交互。", "Describes the continuous path from capability definition and discovery to invocation, attempts, results, effects, and MCP interactions.", "能力定義と発見から呼び出し、試行、結果、影響、MCP インタラクションまでを連続的に記述します。"],
  "safety-plane": ["围绕信任边界、授权、隔离、网络、注入防御、提交和脱敏形成控制闭环。", "Closes the control loop across trust boundaries, authorization, isolation, networking, injection defense, commit, and redaction.", "信頼境界、認可、分離、ネットワーク、注入防御、コミット、墨消しにまたがる制御ループを閉じます。"],
  "feedback-plane": ["把故障、测量、审查、纠正、优化和遥测连接成可追溯改进证据。", "Connects failures, measurements, reviews, corrections, optimization, and telemetry into traceable improvement evidence.", "障害、測定、レビュー、修正、最適化、テレメトリを追跡可能な改善証拠へ接続します。"],
  "memory-plane": ["把内容接入、分块、表示、检索、组装、生命周期和存储组织成持久记忆闭环。", "Organizes ingestion, chunking, representation, retrieval, assembly, lifecycle, and storage into a persistent-memory loop.", "取り込み、チャンク化、表現、検索、組み立て、ライフサイクル、保存を永続記憶ループへ編成します。"],
};

const listSourceFiles = () => {
  const result = [];
  for (const entry of fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(SOURCE_ROOT, entry.name);
    for (const filename of fs.readdirSync(directory)) {
      if (filename.endsWith(".json")) result.push(path.join(directory, filename));
    }
  }
  return result.sort();
};

const moduleDocuments = new Map();
let productDocument = null;
for (const filePath of [path.join(SOURCE_ROOT, "agent-ontology.product.json"), ...listSourceFiles()]) {
  const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (document.source_kind === "agent-ontology-product") productDocument = { filePath, document };
  if (document.source_kind === "agent-ontology-module") {
    moduleDocuments.set(document.module.id, { filePath, document });
  }
}

if (!productDocument || ![41, 47].includes(moduleDocuments.size)) {
  throw new Error(`Expected the frozen v2 baseline or migrated v3 source set (1 product, 41/47 modules); found ${Boolean(productDocument)}/${moduleDocuments.size}`);
}

const allConcepts = () => new Map([...moduleDocuments.values()].flatMap(({ document }) => document.classes.map((concept) => [concept.id, concept])));
const allRelations = () => new Map([...moduleDocuments.values()].flatMap(({ document }) => document.relations.map((relation) => [relation.id, relation])));

const reviewFor = (planeId, note) => ({
  review_status: "accepted",
  reviewers: [
    {
      reviewer_id: `moonweave-${planeId.replace("-plane", "")}-domain-reviewer`,
      reviewer_role: "domain",
      reviewer_kind: "automated-agent",
      reviewed_on: REVIEW_DATE,
      decision_note: note,
    },
    {
      reviewer_id: "moonweave-ontology-structure-reviewer",
      reviewer_role: "ontology",
      reviewer_kind: "automated-agent",
      reviewed_on: REVIEW_DATE,
      decision_note: note,
    },
  ],
});

const claimsFor = (object, fallback) => {
  const claims = object?.source_claims?.length ? object.source_claims : fallback?.source_claims ?? [];
  if (!claims.length) throw new Error(`No reviewed source claim is available for ${object?.id ?? "new object"}`);
  return claims.map((claim) => ({ ...claim, review_status: "accepted" }));
};

const reviewedModuleEvidenceClaims = ({
  module,
  keyConcept,
  sourceClaims,
  peerModuleId = null,
  disambiguationTest = null,
  candidateConceptIds = [],
  ownerModuleId = null,
  result = null,
}) => sourceClaims.map((claim) => {
  const sourceContext = `Source ${claim.source_id} at ${claim.locator}`;
  const keyNotion = `${keyConcept.id} (${keyConcept.labels.en})`;
  const ownershipRule = module.owns_when.en;
  if (peerModuleId === null) {
    return {
      ...claim,
      supports: `${sourceContext} supports operational notions used in ${module.id}, including key notion ${keyNotion}. ` +
        `The source does not define Moonweave Module ${module.id}, its class or relation placement, or its ownership boundary. ` +
        `Treating objects under owns_when "${ownershipRule}" as owned by ${module.id} is a Moonweave design inference over the registered evidence.`,
      review_status: "accepted",
    };
  }
  if (!disambiguationTest?.en) {
    throw new Error(`${module.id}->${peerModuleId} needs a reviewed disambiguation test for evidence`);
  }
  const comparedConcepts = candidateConceptIds.length > 0
    ? candidateConceptIds.join(", ")
    : keyConcept.id;
  return {
    ...claim,
    supports: `${sourceContext} supports operational notions used to compare ${module.id} with ${peerModuleId}, ` +
      `including ${comparedConcepts}. The source does not define Moonweave Modules ${module.id} or ${peerModuleId}, ` +
      `their class or relation placement, or their ownership split. Under ${module.id}'s owns_when "${ownershipRule}", ` +
      `Moonweave applies the disambiguation test "${disambiguationTest.en}"; result=${result ?? "reviewed"} and ` +
      `owner=${ownerModuleId ?? module.id} are a Moonweave design inference over the registered evidence.`,
    review_status: "accepted",
  };
});

const shortDefinition = (definitions) => localized(
  `${definitions.zh.split(/[。！？]/u)[0]}。`,
  definitions.en.split(/(?<=[.!?])\s/u)[0],
  `${definitions.ja.split(/[。！？]/u)[0]}。`,
);

const conceptExamples = ({ id, labels, definitions, sourceClaims, relatedRelationIds = [] }) => [
  {
    id: `${id}-example-positive-001`,
    kind: "positive",
    labels: localized(`${labels.zh}正例`, `Positive example of ${labels.en}`, `${labels.ja}の正例`),
    scenario_id: null,
    descriptions: localized(
      `在可审计 Agent 运行中，${id}-001 满足“${definitions.zh}”并以 canonical ID 参与相关关系。`,
      `In an auditable agent run, ${id}-001 satisfies “${definitions.en}” and participates in related facts under its canonical ID.`,
      `監査可能なエージェント実行で、${id}-001 は「${definitions.ja}」を満たし、canonical ID で関連事実に参加します。`,
    ),
    field_values: {},
    related_node_ids: [id],
    related_relation_ids: relatedRelationIds,
    expected_result: localized(`该对象被识别为${labels.zh}。`, `The object is identified as ${labels.en}.`, `対象は${labels.ja}として識別されます。`),
    why_valid_or_invalid: localized("对象满足定义中的上位种类与区分特征。", "The object satisfies both the broader kind and the stated differentia.", "対象は上位種と明示された種差の両方を満たします。"),
    synthetic: true,
    verified_version: VERSION_IRI,
    source_claims: sourceClaims,
  },
  {
    id: `${id}-example-boundary-001`,
    kind: "boundary",
    labels: localized(`${labels.zh}边界例`, `Boundary case for ${labels.en}`, `${labels.ja}の境界例`),
    scenario_id: null,
    descriptions: localized(`一个相关对象缺少${labels.zh}的区分特征。`, `A related object lacks the differentia required by ${labels.en}.`, `関連対象は${labels.ja}に必要な種差を欠きます。`),
    field_values: {},
    related_node_ids: [id],
    related_relation_ids: [],
    expected_result: localized(`不得把该对象归类为${labels.zh}。`, `The object must not be classified as ${labels.en}.`, `対象を${labels.ja}として分類してはなりません。`),
    why_valid_or_invalid: localized("仅有名称相似或共现，不能证明概念成员资格。", "Name similarity or co-occurrence alone does not prove concept membership.", "名称の類似や共起だけでは概念所属を証明できません。"),
    synthetic: true,
    verified_version: VERSION_IRI,
    source_claims: sourceClaims,
  },
];

const makeConcept = ({
  id,
  moduleId,
  labels,
  definitions,
  semanticKind,
  sourceClaims,
  review,
  primaryParentRelationId = null,
  whyNeeded = localized(`需要${labels.zh}作为可查询的语义边界。`, `${labels.en} is needed as a queryable semantic boundary.`, `${labels.ja}は検索可能な意味境界として必要です。`),
  includes = [localized(`满足${labels.zh}定义与身份条件的对象。`, `Objects satisfying the definition and identity conditions of ${labels.en}.`, `${labels.ja}の定義と同一性条件を満たす対象。`)],
  excludes = [localized("仅作为字段值、状态值或无独立身份的片段。", "Field values, status values, or fragments without independent identity.", "フィールド値、状態値、独立した同一性を持たない断片。")],
  structure = { identity_keys: [], fields: [], constraints: [], required_relation_constraints: [] },
}) => ({
  id,
  module_id: moduleId,
  labels,
  short_definitions: shortDefinition(definitions),
  definitions,
  why_needed: whyNeeded,
  includes,
  excludes,
  semantic_kind: semanticKind,
  primary_parent_relation_id: primaryParentRelationId,
  root_status: null,
  lexical_aliases: [],
  sibling_differentiation: [],
  structure,
  examples: conceptExamples({ id, labels, definitions, sourceClaims }),
  source_claims: sourceClaims,
  external_mappings: [],
  applicability: ["core"],
  status: "accepted",
  review,
  introduced_in: VERSION_IRI,
  deprecated_in: null,
  replaced_by_ids: [],
  deprecation_reason: null,
  change_note: localized(`在 v3 语义纵深审查中新增${labels.zh}。`, `${labels.en} was added by the v3 semantic-depth review.`, `v3 意味深度レビューで${labels.ja}を追加しました。`),
});

const relationExamples = ({ id, predicate, sourceId, targetId, definitions, sourceClaims }) => [
  {
    id: `${id}-example-positive-001`, kind: "positive",
    labels: localized(`${predicate} 关系正例`, `Positive ${predicate} relation`, `${predicate} 関係の正例`), scenario_id: null,
    descriptions: localized(`${sourceId} 通过 ${predicate} 明确连接到 ${targetId}。`, `${sourceId} is explicitly connected to ${targetId} by ${predicate}.`, `${sourceId} は ${predicate} により ${targetId} へ明示的に接続されます。`),
    field_values: {}, related_node_ids: [...new Set([sourceId, targetId])], related_relation_ids: [id],
    expected_result: localized("查询返回这一条有方向的 canonical 事实。", "The query returns this directed canonical fact.", "照会はこの方向付き canonical 事実を返します。"),
    why_valid_or_invalid: definitions, synthetic: true, verified_version: VERSION_IRI, source_claims: sourceClaims,
  },
  {
    id: `${id}-example-boundary-001`, kind: "boundary",
    labels: localized(`${predicate} 关系边界例`, `Boundary case for ${predicate}`, `${predicate} 関係の境界例`), scenario_id: null,
    descriptions: localized(`${sourceId} 与 ${targetId} 仅共现，缺少 ${predicate} 断言。`, `${sourceId} and ${targetId} merely co-occur without a ${predicate} assertion.`, `${sourceId} と ${targetId} は共起するだけで ${predicate} アサーションがありません。`),
    field_values: {}, related_node_ids: [...new Set([sourceId, targetId])], related_relation_ids: [id],
    expected_result: localized("不得由共现推导该关系。", "The relation must not be inferred from co-occurrence.", "共起からこの関係を推論してはなりません。"),
    why_valid_or_invalid: localized("关系需要明确谓词、方向和端点。", "The relation requires an explicit predicate, direction, and endpoints.", "関係には明示的な述語、方向、端点が必要です。"), synthetic: true, verified_version: VERSION_IRI, source_claims: sourceClaims,
  },
];

const makeRelation = ({
  id,
  predicate,
  sourceId,
  targetId,
  relationKind,
  definitions,
  sourceClaims,
  review,
  cardinality = null,
  conditions = [],
  inverseReading = null,
}) => ({
  id, predicate, source_id: sourceId, target_id: targetId, direction: "source-to-target", relation_kind: relationKind,
  labels: localized(predicate.replaceAll("_", " "), predicate.replaceAll("_", " "), predicate.replaceAll("_", " ")),
  definitions,
  cardinality,
  cardinality_not_applicable_reason: cardinality === null
    ? localized("该语义事实不对所有运行实例施加统一基数。", "This semantic fact does not impose one universal cardinality on every runtime instance.", "この意味事実はすべての実行インスタンスに一律の基数を課しません。")
    : null,
  inverse_reading: inverseReading ?? {
    predicate: `inverse_of_${predicate}`,
    labels: localized(`反向 ${predicate}`, `inverse ${predicate}`, `逆 ${predicate}`),
  },
  conditions: structuredClone(conditions), temporal_scope: "timeless", boundary_context: null, constraints: [],
  examples: relationExamples({ id, predicate, sourceId, targetId, definitions, sourceClaims }),
  source_claims: sourceClaims, distinct_fact_rationale: null,
  layout_role: "cross-link", layout_parent_id: null, layout_child_id: null,
  status: "accepted", review, introduced_in: VERSION_IRI, deprecated_in: null, replaced_by_ids: [], deprecation_reason: null,
  change_note: localized("v3 审查确认了谓词、方向、端点和布局职责。", "The v3 review confirmed predicate, direction, endpoints, and layout responsibility.", "v3 レビューで述語、方向、端点、レイアウト責務を確認しました。"),
});

const coreMigrationContext = Object.freeze({ fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction });
const legacystructurePhases = createLegacyStructurePhases(coreMigrationContext);
const { moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts } = legacystructurePhases;
const migrationContext1 = Object.freeze({ ...coreMigrationContext, ...legacystructurePhases });
const recordoperationsPhases = createRecordOperationPhases(migrationContext1);
const { locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, repairProjectionAdapterStructure, applyReviewedExampleSemanticCorrections, synchronizeAcceptedConceptExampleRelations, ensureStructuredInstanceExamples, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor } = recordoperationsPhases;
const migrationContext2 = Object.freeze({ ...migrationContext1, ...recordoperationsPhases });
const semanticfoundationsPhases = createSemanticFoundationPhases(migrationContext2);
const { fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop } = semanticfoundationsPhases;
const migrationContext3 = Object.freeze({ ...migrationContext2, ...semanticfoundationsPhases });
const semanticflowsPhases = createSemanticFlowPhases(migrationContext3);
const { completeEvaluationGoldenFlow, completeContextAssemblySemantics, completeRetrievalExecutionSemantics, repairEvaluationCompositionAndAgency, completeGovernedOptimizationApplication, completeMemoryPipelineSemantics, completeInstructionAndDisclosureProcessing, completeDelegationSelectionAndHandoff, completeInvocationAndRetrySemantics, completeMemoryOperationAndStorageSemantics } = semanticflowsPhases;
const migrationContext4 = Object.freeze({ ...migrationContext3, ...semanticflowsPhases });
const delegationNodeInformationPhases = createDelegationNodeInformationPhases(migrationContext4);
const { applyDelegationNodeInformation } = delegationNodeInformationPhases;
const migrationContextDelegation = Object.freeze({
  ...migrationContext4,
  ...delegationNodeInformationPhases,
});
const semanticrepairsPhases = createSemanticRepairPhases(migrationContextDelegation);
const { completeImprovementLoopCoordination, repairResidualAgencyAndCompositionSemantics, completePlannedOperationalGaps, completeTransportAndRecoveryGaps, completePolicyEffectAndProjectionGaps, migrateWorkerRole, repairFinalResidualAgencySemantics, repairSoftwareDefectCasePathForToolCallPlan } = semanticrepairsPhases;
const migrationContext5 = Object.freeze({ ...migrationContext4, ...semanticrepairsPhases });
const agencyCorrectionPhases = createAgencyCorrectionPhases(migrationContext5);
const { repairRemainingInformationAgency } = agencyCorrectionPhases;
const migrationContextAgency = Object.freeze({ ...migrationContext5, ...agencyCorrectionPhases });
const modulemetadataPhases = createModuleMetadataPhases(migrationContextAgency);
const { ensureReview, applyReviewedModuleDecision, applyDirectionalDistinctFactRationales, applyReviewedRepresentativeInverseReadings, addModuleMetadata, assignLogicalBackbone, completeSiblingDifferentiation } = modulemetadataPhases;
const migrationContext6 = Object.freeze({
  ...migrationContext5,
  ...modulemetadataPhases,
  deferConceptTerminologyObjectEvidenceRewrite: true,
});
const conceptTerminologyPhases = createConceptTerminologyPhases(migrationContext6);
const { completeConceptGenusDifferentia } = conceptTerminologyPhases;
const migrationContextTerminology = Object.freeze({ ...migrationContext6, ...conceptTerminologyPhases });
const objectevidencePhases = createObjectEvidencePhases(migrationContextTerminology);
const { operationalNotionsForConcept, operationalNotionsForRelation, rewriteAcceptedObjectEvidence } = objectevidencePhases;
const migrationContext7 = Object.freeze({ ...migrationContext6, ...objectevidencePhases });
const persistencePhases = createPersistencePhases(migrationContext7);
const { updateProduct, csvCell, writeCsv, backboneDepths, writeLedgersAndAudit, writeCurrentCqLedger, appendRegistrySources, persistSources } = persistencePhases;
const migrationContext8 = Object.freeze({ ...migrationContext7, ...persistencePhases });
let conceptTerminologyAudit = null;

const baseline = loadFrozenV2SemanticBaseline();
if (moduleDocuments.size === 41) {
  moveSplitModules();
  fixCrossKindTaxonomy();
  normalizeReclassifiedConcepts();
  addExecutionBackbone();
  migrateWorkerRole();
  applyOwnerAndIdentityCorrections();
  repairSourceAttachmentEvidence();
  addDelegationSemanticBackbone();
  completeContextDiscoveryFlow();
  completePromptInstructionBackbone();
  repairNetworkSemantics();
  completeExecutionResultSemantics();
  completeOptimizationLearningLoop();
  completeEvaluationGoldenFlow();
  completeContextAssemblySemantics();
  completeRetrievalExecutionSemantics();
  repairEvaluationCompositionAndAgency();
  completeGovernedOptimizationApplication();
  completeMemoryPipelineSemantics();
  completeInstructionAndDisclosureProcessing();
  completeDelegationSelectionAndHandoff();
  applyDelegationNodeInformation();
  completeInvocationAndRetrySemantics();
  completeMemoryOperationAndStorageSemantics();
  completeImprovementLoopCoordination();
  repairResidualAgencyAndCompositionSemantics();
  completePlannedOperationalGaps();
  completeTransportAndRecoveryGaps();
  completePolicyEffectAndProjectionGaps();
  repairFinalResidualAgencySemantics();
  repairSoftwareDefectCasePathForToolCallPlan();
  repairRemainingInformationAgency();
  applyReviewedReplacementRelationDefinitions();
  normalizeTerminology();
  completeCrossDomainBoundaryContexts();
  applyDirectionalDistinctFactRationales();
  applyReviewedRepresentativeInverseReadings();
  addModuleMetadata();
  assignLogicalBackbone();
  completeSiblingDifferentiation();
  conceptTerminologyAudit = completeConceptGenusDifferentia();
  removeDeprecatedRelationNarratives();
  synchronizeAcceptedRelationExampleOwnership();
  repairProjectionAdapterStructure();
  applyReviewedExampleSemanticCorrections();
  synchronizeAcceptedConceptExampleRelations();
  ensureStructuredInstanceExamples();
  synchronizeAcceptedConceptExamples();
  rewriteAcceptedObjectEvidence();
  synchronizeAcceptedConceptExampleRelations();
  updateProduct();
  writeLedgersAndAudit(baseline);
  appendRegistrySources();
  persistSources();
} else {
  normalizeReclassifiedConcepts();
  applyOwnerAndIdentityCorrections();
  repairSourceAttachmentEvidence();
  addDelegationSemanticBackbone();
  completeContextDiscoveryFlow();
  completePromptInstructionBackbone();
  repairNetworkSemantics();
  completeExecutionResultSemantics();
  completeOptimizationLearningLoop();
  completeEvaluationGoldenFlow();
  completeContextAssemblySemantics();
  completeRetrievalExecutionSemantics();
  repairEvaluationCompositionAndAgency();
  completeGovernedOptimizationApplication();
  completeMemoryPipelineSemantics();
  completeInstructionAndDisclosureProcessing();
  completeDelegationSelectionAndHandoff();
  applyDelegationNodeInformation();
  completeInvocationAndRetrySemantics();
  completeMemoryOperationAndStorageSemantics();
  completeImprovementLoopCoordination();
  repairResidualAgencyAndCompositionSemantics();
  completePlannedOperationalGaps();
  completeTransportAndRecoveryGaps();
  completePolicyEffectAndProjectionGaps();
  repairFinalResidualAgencySemantics();
  repairSoftwareDefectCasePathForToolCallPlan();
  repairRemainingInformationAgency();
  applyReviewedReplacementRelationDefinitions();
  normalizeTerminology();
  completeCrossDomainBoundaryContexts();
  applyDirectionalDistinctFactRationales();
  applyReviewedRepresentativeInverseReadings();
  addModuleMetadata();
  assignLogicalBackbone();
  completeSiblingDifferentiation();
  conceptTerminologyAudit = completeConceptGenusDifferentia();
  removeDeprecatedRelationNarratives();
  synchronizeAcceptedRelationExampleOwnership();
  repairProjectionAdapterStructure();
  applyReviewedExampleSemanticCorrections();
  synchronizeAcceptedConceptExampleRelations();
  ensureStructuredInstanceExamples();
  synchronizeAcceptedConceptExamples();
  rewriteAcceptedObjectEvidence();
  synchronizeAcceptedConceptExampleRelations();
  updateProduct();
  writeLedgersAndAudit(baseline);
  appendRegistrySources();
  persistSources();
}
writeCurrentCqLedger();
writeFileTransaction(pendingWrites, { transactionRoot: ROOT });

console.log(stableJson({
  modules: moduleDocuments.size,
  concepts: allConcepts().size,
  relations: allRelations().size,
  baseline: { concepts: baseline.concepts.size, relations: baseline.relationCount, roots: baseline.rootCount, max_depth: baseline.maxDepth },
  concept_terminology: conceptTerminologyAudit,
}).trim());
