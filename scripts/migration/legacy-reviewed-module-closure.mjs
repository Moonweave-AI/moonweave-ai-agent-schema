import { enrichConceptExamplesWithRelations } from "../lib/ontology-concept-examples.mjs";
import { additionalRootConstraints } from "../lib/ontology-legacy-migration.mjs";
import {
  acceptedReview,
  claimsFor,
  localized,
  positiveAndBoundaryExamples,
  versionIri,
} from "../lib/ontology-migration-factories.mjs";

export const buildReviewedModuleClosure = (context) => {
  let {
    concepts,
    relations,
    legacyModuleEntries,
    legacyModuleById,
    moduleDecisionById,
    moduleIdByConcept,
    productEntry,
    legacyPlaneById,
    sourceRegistryById,
    caseNodeIds,
    caseRelationIds,
    caseReviewer,
  } = context;

const requiredCardinalityByFact = new Map();
const registerRequiredCardinality = ({ concept, constraint }) => {
  const outgoing = constraint.direction === "outgoing";
  const sourceId = outgoing ? concept.id : constraint.target_concept_id;
  const targetId = outgoing ? constraint.target_concept_id : concept.id;
  const endpoint = outgoing ? "target" : "source";
  const factKey = `${sourceId}\0${constraint.predicate}\0${targetId}`;
  const current = requiredCardinalityByFact.get(factKey) ?? {};
  const existing = current[endpoint];
  if (
    existing &&
    (existing.min !== constraint.cardinality.min ||
      existing.max !== constraint.cardinality.max)
  ) {
    throw new Error(
      `Required relation constraints disagree on ${sourceId} ${constraint.predicate} ${targetId} ${endpoint} cardinality`,
    );
  }
  requiredCardinalityByFact.set(factKey, {
    ...current,
    [endpoint]: structuredClone(constraint.cardinality),
  });
};
for (const concept of concepts) {
  for (const constraint of concept.structure?.required_relation_constraints ?? []) {
    registerRequiredCardinality({ concept, constraint });
  }
}
const resolvedRequiredCardinalityFacts = new Set();
relations = relations.map((relation) => {
  const factKey = `${relation.source_id}\0${relation.predicate}\0${relation.target_id}`;
  const reviewed = requiredCardinalityByFact.get(factKey);
  if (!reviewed) return relation;
  resolvedRequiredCardinalityFacts.add(factKey);
  return {
    ...relation,
    cardinality: {
      source: reviewed.source ?? { min: 0, max: null },
      target: reviewed.target ?? { min: 0, max: null },
    },
    cardinality_not_applicable_reason: null,
  };
});
const unresolvedRequiredCardinalityFacts = [...requiredCardinalityByFact.keys()].filter(
  (factKey) => !resolvedRequiredCardinalityFacts.has(factKey),
);
if (unresolvedRequiredCardinalityFacts.length > 0) {
  throw new Error(
    `Required relation cardinality has no canonical fact: ${unresolvedRequiredCardinalityFacts.join(", ")}`,
  );
}
concepts = enrichConceptExamplesWithRelations({ concepts, relations });

const interactionMode = (moduleId) =>
  new Set([
    "runtime-actors",
    "info-content-block-modality",
    "info-storage-sources",
    "memory-stores-scopes",
    "tool-registry-definition",
    "adapter-protocols",
    "adapter-frameworks",
    "adapter-benchmarks",
    "adapter-statecharts",
    "adapter-schema-export",
  ]).has(moduleId)
    ? "descriptive"
    : moduleId === "adapter-mapping-infrastructure"
      ? "mixed"
      : "operational";
const interactionPredicatePatterns = Object.freeze({
  input: Object.freeze([
    /consumes|reads|receives|requests|queries|uses|observes|evaluates|applies/u,
    /selects_from|responds_to|based_on|references|refers_to|scans/u,
    /governed_by|constrained_by|requires|belongs_to|sourced_from|derived_from/u,
    /triggered_by|informs|targets|measures|assessed_against|has_source/u,
  ]),
  output: Object.freeze([
    /produces|produced_by|emits|writes|returns|records|recorded_by/u,
    /exports|publishes|generates|creates|materializes|makes_available/u,
    /delivered_to|displayed_to|released_to|appended|summarizes/u,
    /selects|resolves|updates|triggers|raises|routes|stores/u,
    /opens|closes|captures|restores|retrieves|orders|fills|flags/u,
    /maps_|projects|warns|verifies|elaborated_by|prescribes/u,
  ]),
  failure: Object.freeze([
    /error|failure|warning|warns|blocks|denied|rejects|risk/u,
    /threatens|suppresses|may_cause|prevents|conflict|flags|raises|diagnostic/u,
  ]),
  recovery: Object.freeze([
    /recover|retr(?:y|ies)|rollback|restore|resume|replay|refresh/u,
    /supersed|resolve|correct|renegotiat|fallback|revision|compensat/u,
  ]),
});
// These facets are not inferred from labels. Every override names an already reviewed,
// accepted fact whose semantics directly express a Module-level failure or recovery path.
// Cross-Module facts are valid here because canonical endpoint ownership is unchanged.
const reviewedInteractionRelationIds = new Map([
  ["runtime-system", { failure: "blocking_error_blocks_run_attempt" }],
  ["runtime-artifacts", { recovery: "correction_applies_to_artifact" }],
  ["orchestration-routing-control", { recovery: "RetryPolicy-creates_new-RunAttempt" }],
  ["tool-mcp-transport", { failure: "MCPSession-may_emit-ToolError" }],
  ["feedback-logging", { recovery: "ErrorListener-triggers-RecoveryAction" }],
  ["feedback-metrics-evaluation", { recovery: "CorrectionActivity-followed_by-EvaluationRun" }],
  ["feedback-review-optimization", { failure: "retryable_error_triggers_recovery_plan" }],
]);
const interactionRelation = (relationsForModule, facet) =>
  [...relationsForModule]
    .sort((left, right) => left.id.localeCompare(right.id))
    .find((relation) =>
      interactionPredicatePatterns[facet].some((pattern) => pattern.test(relation.predicate)),
    ) ?? null;
const interactionFacet = ({ relation, moduleLabels, facet, mode }) => ({
  applicable: relation !== null,
  not_applicable_reason:
    relation !== null
      ? null
      : localized(
          mode === "descriptive"
            ? `${moduleLabels.zh}是描述型模块；${facet} 不构成模块级运行事实，因此不为通过门禁而虚构关系。`
            : `${moduleLabels.zh}当前没有已接受的 canonical ${facet} 关系；本发布将该项明确标为不适用，而不以字段或示例伪造一条边。`,
          mode === "descriptive"
            ? `${moduleLabels.en} is descriptive; ${facet} is not a Module-level runtime fact, so no relation is invented to satisfy a gate.`
            : `${moduleLabels.en} has no accepted canonical ${facet} relation in this release; the facet is explicitly not applicable instead of being fabricated from fields or examples.`,
          mode === "descriptive"
            ? `${moduleLabels.ja}は記述型モジュールであり、${facet} はモジュール単位の実行事実ではないため、ゲート通過用の関係を捏造しません。`
            : `${moduleLabels.ja}には本リリースで承認済み canonical ${facet} 関係がなく、項目や例から辺を捏造せず明示的に非適用とします。`,
        ),
});
const mergeRelationClaims = (relationList) => {
  const claims = new Map();
  for (const claim of relationList.flatMap((relation) => relation?.source_claims ?? [])) {
    const key = `${claim.source_id}\0${claim.supports}\0${claim.locator}`;
    claims.set(key, claim);
  }
  return [...claims.values()];
};

const updatedModules = legacyModuleEntries.map(({ value }) => {
  const base = value.module;
  const old = legacyModuleById.get(base.id);
  const decision = moduleDecisionById.get(base.id);
  const ownedConcepts = concepts.filter(({ module_id: moduleId }) => moduleId === base.id);
  if (ownedConcepts.length === 0) throw new Error(`Reviewed Module ${base.id} has no retained Concepts`);
  const mode = interactionMode(base.id);
  const moduleSemanticRelations = relations.filter(
    (relation) =>
      relation.predicate !== "is_a" &&
      moduleIdByConcept.get(relation.source_id) === base.id,
  );
  const interactionEvidence = Object.fromEntries(
    ["input", "output", "failure", "recovery"].map((facet) => [
      facet,
      mode === "descriptive" ? null : interactionRelation(moduleSemanticRelations, facet),
    ]),
  );
  for (const [facet, relationId] of Object.entries(
    reviewedInteractionRelationIds.get(base.id) ?? {},
  )) {
    const relation = relations.find(({ id }) => id === relationId);
    if (!relation || relation.status !== "accepted" || relation.predicate === "is_a") {
      throw new Error(`Reviewed ${facet} relation ${relationId} for ${base.id} is unresolved`);
    }
    const sourceModule = moduleIdByConcept.get(relation.source_id);
    const targetModule = moduleIdByConcept.get(relation.target_id);
    if (sourceModule !== base.id && targetModule !== base.id) {
      throw new Error(`Reviewed ${facet} relation ${relationId} is not incident to ${base.id}`);
    }
    interactionEvidence[facet] = relation;
  }
  if (mode !== "descriptive" && (!interactionEvidence.input || !interactionEvidence.output)) {
    throw new Error(
      `${mode} Module ${base.id} must resolve accepted canonical input and output relations`,
    );
  }
  const representativeRelation = (decision.semantic_relations ?? [])
    .map((relation) =>
      relations.find(
        (candidate) =>
          candidate.source_id === relation.source_id &&
          candidate.predicate === relation.predicate &&
          candidate.target_id === relation.target_id,
      ),
    )
    .find(Boolean);
  if (!representativeRelation) {
    throw new Error(`Reviewed Module ${base.id} has no resolvable semantic closure relation`);
  }
  const moduleRelationCount = relations.filter(
    (relation) => moduleIdByConcept.get(relation.source_id) === base.id,
  ).length;
  const taxonomyRelation = relations.find(
    (relation) =>
      relation.predicate === "is_a" &&
      moduleIdByConcept.get(relation.source_id) === base.id &&
      moduleIdByConcept.get(relation.target_id) === base.id,
  );
  if (decision.taxonomy_applicability === "specialization" && !taxonomyRelation) {
    throw new Error(`Specialization Module ${base.id} has no module-local is_a relation`);
  }
  const [moduleExampleBase] = positiveAndBoundaryExamples({
    ownerId: base.id,
    labels: base.labels,
    definitions: base.definitions,
    relatedNodeIds: [
      base.id,
      representativeRelation.source_id,
      representativeRelation.target_id,
    ],
    relatedRelationIds: [representativeRelation.id],
    positiveDescriptions: localized(
      `在 ${base.labels.zh} 的合成审计场景中，${representativeRelation.source_id} 通过 ${representativeRelation.predicate} 指向 ${representativeRelation.target_id}；该事实直接复用 canonical 节点与关系，定义、字段、约束、实例和来源都作为对应节点或关系的信息呈现。`,
      `In a synthetic audit scenario for ${base.labels.en}, ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id}. The fact reuses canonical nodes and one canonical relation, while definitions, fields, constraints, instances, and sources remain information on those nodes or the relation.`,
      `${base.labels.ja}の合成監査シナリオで、${representativeRelation.source_id} は ${representativeRelation.predicate} により ${representativeRelation.target_id} を指します。この事実は canonical ノードと単一の canonical 関係を再利用し、定義・項目・制約・インスタンス・出典は対応ノードまたは関係の情報として保持します。`,
    ),
  });
  const semanticQuestion = {
    id: `${base.id}-cq-semantic-closure`,
    questions: localized(
      `本模块能否以唯一 canonical 关系证明 ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id}，且不创建影子节点或平行实例图？`,
      `Can this Module prove ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} through one canonical relation without creating shadow nodes or a parallel instance graph?`,
      `本モジュールはシャドーノードや並行インスタンスグラフを作らず、単一の canonical 関係で ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} を証明できるか。`,
    ),
    query: `relation(source=${representativeRelation.source_id}, predicate=${representativeRelation.predicate}, target=${representativeRelation.target_id})`,
    expected_assertion: `${representativeRelation.id} is the unique accepted canonical fact for this source/predicate/target triple`,
    positive_example_ids: [`${representativeRelation.id}-example-positive-001`],
    counterexample_ids: [`${representativeRelation.id}-example-boundary-001`],
    source_claims: representativeRelation.source_claims,
    review: acceptedReview(decision.reviewer, decision.rationale),
  };
  const taxonomyQuestion = taxonomyRelation
    ? {
        id: `${base.id}-cq-taxonomy`,
        questions: localized(
          `专业化事实 ${taxonomyRelation.source_id} is_a ${taxonomyRelation.target_id} 是否保持具体到一般方向、具有经审查种差且不形成环？`,
          `Does the specialization fact ${taxonomyRelation.source_id} is_a ${taxonomyRelation.target_id} preserve the specific-to-general direction, carry a reviewed differentia, and remain acyclic?`,
          `特殊化事実 ${taxonomyRelation.source_id} is_a ${taxonomyRelation.target_id} は具体から一般への方向、審査済み種差、非循環性を保つか。`,
        ),
        query: `relation(id=${taxonomyRelation.id}, predicate=is_a) AND acyclic=true`,
        expected_assertion: `${taxonomyRelation.id} resolves from ${taxonomyRelation.source_id} to ${taxonomyRelation.target_id} with accepted review evidence`,
        positive_example_ids: [`${taxonomyRelation.id}-example-positive-001`],
        counterexample_ids: [`${taxonomyRelation.id}-example-boundary-001`],
        source_claims: taxonomyRelation.source_claims,
        review: acceptedReview(decision.reviewer, decision.rationale),
      }
    : {
        id: `${base.id}-cq-taxonomy`,
        questions: localized(
          "本模块的平坦根例外是否具有已接受理由，且没有伪造专业化边？",
          "Does this Module's flat-root exception have an accepted rationale without fabricated specialization edges?",
          "本モジュールの平坦ルート例外は承認済み理由を持ち、偽の特殊化辺を作っていないか。",
        ),
        query: `taxonomy(module=${base.id}, applicability=flat-root-exception)`,
        expected_assertion: `Module ${base.id} resolves an accepted flat-root-exception without a fabricated is_a relation`,
        positive_example_ids: [`${ownedConcepts[0].id}-example-positive-001`],
        counterexample_ids: [`${ownedConcepts[0].id}-example-boundary-001`],
        source_claims: [],
        review: acceptedReview(decision.reviewer, decision.rationale),
      };
  const evidencedInteractionRelations = [
    ...new Map(
      [
        interactionEvidence.input,
        interactionEvidence.output,
        interactionEvidence.failure,
        interactionEvidence.recovery,
      ]
        .filter(Boolean)
        .map((relation) => [relation.id, relation]),
    ).values(),
  ];
  const moduleCaseRelations = [
    ...new Map(
      [representativeRelation, ...evidencedInteractionRelations].map((relation) => [
        relation.id,
        relation,
      ]),
    ).values(),
  ];
  const moduleCaseRelationIds = moduleCaseRelations.map(({ id }) => id);
  const moduleCaseNodeIds = [
    ...new Set(
      moduleCaseRelations.flatMap(({ source_id: sourceId, target_id: targetId }) => [
        sourceId,
        targetId,
      ]),
    ),
  ];
  const moduleExample = {
    ...moduleExampleBase,
    id: `${base.id}-case-software-defect-repair`,
    kind: "case-fragment",
    scenario_id: "software-defect-repair",
    labels: localized(
      `软件缺陷修复：${base.labels.zh}片段`,
      `Software defect repair: ${base.labels.en} fragment`,
      `ソフトウェア欠陥修復：${base.labels.ja}断片`,
    ),
    descriptions: localized(
      `在软件缺陷修复场景中，本模块只复用已接受关系 ${moduleCaseRelationIds.join("、")}；片段把 ${moduleCaseNodeIds.join("、")} 作为同一 canonical 图中的可选审查分支，不把字段、实例或来源提升为影子节点。`,
      `In the software-defect-repair scenario, this Module reuses only accepted relations ${moduleCaseRelationIds.join(", ")}. The fragment treats ${moduleCaseNodeIds.join(", ")} as an optional review branch of the same canonical graph without promoting fields, instances, or sources to shadow nodes.`,
      `ソフトウェア欠陥修復シナリオで、本モジュールは承認済み関係 ${moduleCaseRelationIds.join("、")} だけを再利用します。${moduleCaseNodeIds.join("、")} を同じ canonical グラフの任意レビュー分岐として扱い、項目・インスタンス・出典をシャドーノードへ昇格しません。`,
    ),
    related_node_ids: moduleCaseNodeIds,
    related_relation_ids: moduleCaseRelationIds,
    expected_result: localized(
      "查询逐一解析这些关系及端点；未被本次修复运行触发的可选分支保持未断言，而不是伪造事件。",
      "The query resolves every listed relation and endpoint; optional branches not exercised by this repair run remain unasserted rather than becoming fabricated events.",
      "照会は列挙された各関係と端点を解決し、この修復実行で使われない任意分岐は偽イベントにせず未アサートのままにします。",
    ),
    why_valid_or_invalid: localized(
      "片段仅引用 source 中已有的 accepted 事实，并明确区分“该模块可解释此场景”与“本次运行已经发生该事件”。",
      "The fragment cites only accepted facts already present in source and distinguishes a Module that can explain the scenario from an event asserted to have occurred in this run.",
      "断片は source に既存の accepted 事実だけを参照し、「シナリオを説明できるモジュール」と「今回の実行で発生したと断言するイベント」を区別します。",
    ),
    source_claims: mergeRelationClaims(moduleCaseRelations),
  };
  const interactionQuestion =
    mode === "descriptive"
      ? {
          id: `${base.id}-cq-interaction-closure`,
          questions: localized(
            "本描述型模块是否明确拒绝虚构运行输入、输出、失败或恢复边，同时仍通过代表性 canonical 关系解释其专业边界？",
            "Does this descriptive Module explicitly reject invented runtime input, output, failure, or recovery edges while still explaining its professional boundary through a representative canonical relation?",
            "本記述型モジュールは実行入力・出力・失敗・回復の辺を捏造せず、代表 canonical 関係で専門境界を説明しているか。",
          ),
          query: `interaction(module=${base.id}, applicability=descriptive, invented_runtime_relations=0)`,
          expected_assertion: `${base.id} marks input, output, failure, and recovery not applicable and retains ${representativeRelation.id} only as a reviewed domain fact`,
          positive_example_ids: [`${representativeRelation.id}-example-positive-001`],
          counterexample_ids: [`${representativeRelation.id}-example-boundary-001`],
          source_claims: representativeRelation.source_claims,
          review: acceptedReview(decision.reviewer, decision.rationale),
        }
      : {
          id: `${base.id}-cq-interaction-closure`,
          questions: localized(
            `本模块能否由唯一关系集合证明输入 ${interactionEvidence.input.id} 与输出 ${interactionEvidence.output.id}，并对失败与恢复分别给出 canonical 关系或明确不适用结论？`,
            `Can this Module prove input ${interactionEvidence.input.id} and output ${interactionEvidence.output.id} from the sole relation set while giving either a canonical relation or an explicit not-applicable decision for failure and recovery?`,
            `本モジュールは唯一の関係集合から入力 ${interactionEvidence.input.id} と出力 ${interactionEvidence.output.id} を証明し、失敗と回復に canonical 関係または明示的な非適用判断を示せるか。`,
          ),
          query: [
            `interaction(module=${base.id}`,
            `input=${interactionEvidence.input.id}`,
            `output=${interactionEvidence.output.id}`,
            `failure=${interactionEvidence.failure?.id ?? "not-applicable"}`,
            `recovery=${interactionEvidence.recovery?.id ?? "not-applicable"})`,
          ].join(","),
          expected_assertion: evidencedInteractionRelations
            .map(({ id }) => id)
            .join(" + "),
          positive_example_ids: evidencedInteractionRelations.map(
            ({ id }) => `${id}-example-positive-001`,
          ),
          counterexample_ids: evidencedInteractionRelations.map(
            ({ id }) => `${id}-example-boundary-001`,
          ),
          source_claims: mergeRelationClaims(evidencedInteractionRelations),
          review: acceptedReview(decision.reviewer, decision.rationale),
        };
  return {
    id: base.id,
    plane_id: base.plane_id,
    labels: base.labels,
    definitions: base.definitions,
    purpose: localized(
      `本模块在“${base.labels.zh}”边界内，以 ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} 为代表闭包，把概念层级、语义关系和节点内信息组织成可查询、可验证的一张统一图。`,
      `Within the ${base.labels.en} boundary, this Module uses ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} as a representative closure fact and organizes taxonomy, semantic relations, and node information as one queryable, verifiable graph.`,
      `${base.labels.ja}の境界内で、${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} を代表閉包事実とし、分類・意味関係・ノード内情報を検索・検証可能な単一グラフとして組織します。`,
    ),
    includes: [
      localized(
        `本模块直接拥有 ${ownedConcepts.length} 个概念和 ${moduleRelationCount} 条 source-owned 关系；定义、字段、约束、实例、引用和解释附着在对应 canonical 节点或关系上。`,
        `${ownedConcepts.length} directly owned Concepts and ${moduleRelationCount} source-owned relations; definitions, fields, constraints, instances, citations, and explanations are attached to the corresponding canonical node or relation.`,
        `本モジュールが直接所有する ${ownedConcepts.length} 個の概念と ${moduleRelationCount} 本の source-owned 関係。定義・項目・制約・インスタンス・引用・説明は対応する canonical ノードまたは関係に付属します。`,
      ),
    ],
    excludes: [
      localized(
        "兄弟模块拥有的概念，以及与主图并行的 schema 图、实例图或案例影子图；跨模块语义只通过 canonical ID 和唯一关系事实引用。",
        "Concepts owned by sibling Modules and any schema, instance, or case shadow graph parallel to the primary graph; cross-Module meaning is referenced only through canonical IDs and one relation fact.",
        "兄弟モジュール所有の概念、および主グラフと並行する schema・instance・事例のシャドーグラフ。モジュール横断意味は canonical ID と一つの関係事実だけで参照します。",
      ),
    ],
    interaction_contract: {
      applicability: mode,
      facets: {
        input: interactionFacet({
          relation: interactionEvidence.input,
          moduleLabels: base.labels,
          facet: "input",
          mode,
        }),
        output: interactionFacet({
          relation: interactionEvidence.output,
          moduleLabels: base.labels,
          facet: "output",
          mode,
        }),
        failure: interactionFacet({
          relation: interactionEvidence.failure,
          moduleLabels: base.labels,
          facet: "failure",
          mode,
        }),
        recovery: interactionFacet({
          relation: interactionEvidence.recovery,
          moduleLabels: base.labels,
          facet: "recovery",
          mode,
        }),
      },
      review: acceptedReview(decision.reviewer, decision.rationale),
    },
    taxonomy_contract: {
      applicability: decision.taxonomy_applicability,
      not_applicable_reason:
        decision.taxonomy_applicability === "flat-root-exception" ? decision.rationale : null,
      review: acceptedReview(decision.reviewer, decision.rationale),
    },
    examples: [
      {
        ...moduleExample,
        expected_result: localized(
          `查询唯一解析到关系 ${representativeRelation.id}，并从模块页直接追踪两个端点及其内嵌信息。`,
          `The query resolves uniquely to ${representativeRelation.id} and traces both endpoints and their embedded information directly from the Module page.`,
          `照会は関係 ${representativeRelation.id} に一意に解決し、モジュールページから両端点と内蔵情報を直接追跡できます。`,
        ),
        why_valid_or_invalid: localized(
          "该例复用唯一 canonical 事实，不复制节点、关系、schema 或实例层。",
          "The example reuses one canonical fact without duplicating nodes, relations, schema, or an instance layer.",
          "この例は単一の canonical 事実を再利用し、ノード・関係・schema・instance 層を複製しません。",
        ),
      },
    ],
    competency_questions: [semanticQuestion, taxonomyQuestion, interactionQuestion],
    source_claims: claimsFor({
      sourceIds: old.source_ids,
      ownerId: base.id,
      assertion: `Provides evidence for the reviewed Module boundary of ${base.id}: ${decision.rationale.en}`,
      sourceRegistryById,
    }),
    status: "accepted",
    review: acceptedReview(decision.reviewer, decision.rationale),
    introduced_in: versionIri,
    change_note: decision.rationale,
  };
});

const planeReviewer = {
  reviewer_id: "codex-domain-architecture-reviewer",
  reviewer_role: "architecture",
  reviewer_kind: "automated-agent",
  reviewed_on: "2026-07-13",
};
const updatedPlanes = productEntry.value.planes.map((base) => {
  const old = legacyPlaneById.get(base.id);
  const moduleCount = updatedModules.filter(({ plane_id: planeId }) => planeId === base.id).length;
  const note = localized(
    `保留该一级领域，并在其 ${moduleCount} 个模块内建立专业化层级和语义闭环。`,
    `Retains this first-level Domain while establishing specialization and semantic closure inside its ${moduleCount} Modules.`,
    `この第一階層ドメインを維持し、配下の ${moduleCount} モジュール内に特殊化と意味閉包を確立します。`,
  );
  const examples = positiveAndBoundaryExamples({
    ownerId: base.id,
    labels: base.labels,
    definitions: base.definitions,
    relatedNodeIds: [base.id],
  });
  return {
    id: base.id,
    labels: base.labels,
    definitions: base.definitions,
    purpose: localized(
      `该领域界定${base.labels.zh}相关的完整 Agent 工程问题空间。`,
      `This Domain bounds the complete Agent-engineering problem space associated with ${base.labels.en}.`,
      `このドメインは${base.labels.ja}に関する完全な Agent 工学問題空間を区切ります。`,
    ),
    includes: [
      localized(
        `直属的 ${moduleCount} 个模块及其 canonical 概念。`,
        `${moduleCount} directly owned Modules and their canonical Concepts.`,
        `直接所有する ${moduleCount} モジュールと canonical 概念。`,
      ),
    ],
    excludes: [
      localized(
        "其他一级领域直接拥有的概念；跨域关系不改变规范归属。",
        "Concepts directly owned by other first-level Domains; cross-Domain relations do not change canonical ownership.",
        "他の第一階層ドメインが直接所有する概念。ドメイン横断関係は canonical 所有を変更しません。",
      ),
    ],
    examples: [examples[0]],
    source_claims: claimsFor({
      sourceIds: old.source_ids,
      ownerId: base.id,
      assertion: `Provides evidence for the reviewed Domain boundary of ${base.id}: ${base.definitions.en}`,
      sourceRegistryById,
    }),
    status: "accepted",
    review: acceptedReview(planeReviewer, note),
    introduced_in: versionIri,
    change_note: note,
  };
});

const rootReviewNote = localized(
  `${updatedPlanes.length} 个领域、${updatedModules.length} 个模块、逐层概念专业化和内嵌信息合同已完成统一图谱审查。`,
  `${updatedPlanes.length} Domains, ${updatedModules.length} Modules, layered Concept specialization, and the inline information contract passed unified-graph review.`,
  `${updatedPlanes.length} ドメイン、${updatedModules.length} モジュール、段階的概念特殊化、埋め込み情報契約が統一グラフレビューを通過しました。`,
);
const product = {
  ...productEntry.value.product,
  status: "accepted",
  review: acceptedReview(planeReviewer, rootReviewNote),
  canonical_version: versionIri,
};
const migratedRootConstraints = additionalRootConstraints({ sourceRegistryById });
const migratedRootConstraintIds = new Set(
  migratedRootConstraints.map(({ id }) => id),
);
const casePath = {
  id: "software-defect-repair",
  labels: localized("软件缺陷修复闭环", "Software defect repair loop", "ソフトウェア欠陥修復ループ"),
  descriptions: localized(
    "从目标、计划、任务步骤、工具调用和结果，经过评估与反馈写入记忆的原图高亮路径。",
    "A highlight path over existing nodes from goal, plan, task step, tool call and result through evaluation and feedback into memory.",
    "目標、計画、タスクステップ、ツール呼び出しと結果から、評価とフィードバックを経て記憶へ書き込む既存ノード上の強調経路。",
  ),
  steps: caseNodeIds.map((nodeId, index) => ({
    order: index + 1,
    case_fragment_example_id: `${nodeId}-case-software-defect-repair-${String(index + 1).padStart(2, "0")}`,
    traversal_relation_id: index === 0 ? null : caseRelationIds[index - 1],
  })),
  source_claims: claimsFor({
    sourceIds: ["lit-agent-conductor", "lit-mech-reflexion", "eng-fw-openai-tracing"],
    ownerId: "software-defect-repair",
    assertion: "Supports the observable plan-execute-evaluate-feedback case path.",
    sourceRegistryById,
  }),
  status: "accepted",
  review: acceptedReview(caseReviewer, rootReviewNote),
};
const productSource = {
  source_kind: "agent-ontology-product",
  contract_version: productEntry.value.contract_version,
  product,
  planes: updatedPlanes,
  global_constraints: [
    ...productEntry.value.global_constraints.filter(
      ({ id }) => !migratedRootConstraintIds.has(id),
    ),
    ...migratedRootConstraints,
  ],
  case_paths: [casePath],
  hygiene_gates: productEntry.value.hygiene_gates,
};


  return { concepts, relations, updatedModules, updatedPlanes, productSource };
};
