import { addStructuredInstanceExamples } from "../../lib/ontology-reviewed-structures.mjs";

export const createRecordOperationPhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts } = context;

  const locateRelationOwner = (relationId) => {
    for (const entry of moduleDocuments.values()) {
      const index = entry.document.relations.findIndex((relation) => relation.id === relationId);
      if (index >= 0) return { entry, index };
    }
    throw new Error(`Cannot locate relation ${relationId}`);
  };

  const REVIEWED_REPLACEMENT_RELATION_DEFINITIONS = Object.freeze({
    "OutputStream-contains-OutputInformation": localized(
      "输出流按所属通道与发出顺序包含输出信息项；信息项保留自身身份，不因此成为输出流。",
      "An output stream contains output-information items under one channel and emission order; each item retains its own identity and does not thereby become a stream.",
      "出力ストリームは一つのチャネルと送出順序の下で出力情報項目を含み、各項目は固有の同一性を保ってストリーム自体にはなりません。",
    ),
    "Conversation-contains-ConversationElement": localized(
      "会话在同一会话身份与顺序边界内包含轮次、消息或其他会话元素。",
      "A conversation contains turns, messages, or other conversation elements within one conversation identity and ordering boundary.",
      "会話は一つの会話同一性と順序境界の内側に、ターン、メッセージ、その他の会話要素を含みます。",
    ),
    "MessageHistory-contains-ConversationElement": localized(
      "消息历史保存可回放的有序会话元素及其时间和来源线索；它是历史记录，不是正在进行的会话。",
      "A message history contains replayable ordered conversation elements with temporal and provenance cues; it is a historical record, not the live conversation itself.",
      "メッセージ履歴は再生可能な順序付き会話要素を時刻・由来情報と共に含む履歴記録であり、進行中の会話そのものではありません。",
    ),
    "OutputWindow-selects_from-OutputInformation": localized(
      "输出窗口从输出信息中界定满足长度、位置和披露约束的可见范围；该关系表达窗口范围，不声称窗口执行披露活动。",
      "An output window selects a visible range from output information under length, position, and disclosure constraints; the fact defines window scope without claiming that the window performs disclosure activity.",
      "出力ウィンドウは長さ・位置・開示制約に従って出力情報から可視範囲を定めます。この事実は範囲を表し、ウィンドウが開示活動を実行するとは主張しません。",
    ),
    "MappingRule-specifies-MappingArtifact": localized(
      "映射规则规定映射产物必须具有的目标形式、字段对应、约束和损失处理；规则描述交付物，但不等于已经执行生成。",
      "A mapping rule specifies the target form, field correspondences, constraints, and loss handling required of a mapping artifact; it describes the deliverable without claiming that execution has produced it.",
      "写像規則は写像成果物に必要な対象形式、項目対応、制約、損失処理を規定し、成果物を記述しますが実行済み生成を主張しません。",
    ),
    "RevisionPlan-guides-RevisionArtifact": localized(
      "修订计划为修订产物规定有序纠正动作、适用范围和验收条件；实际修改由受治理的修订活动执行。",
      "A revision plan guides a revision artifact through ordered corrective actions, applicable scope, and acceptance conditions; a governed revision activity performs the actual modification.",
      "修正計画は修正成果物に対する順序付き是正動作、適用範囲、受入条件を定め、実際の変更は統制された修正活動が実行します。",
    ),
    "DatabaseRow-is_a-IngestibleInformation": localized(
      "数据库行是一种可接入信息，其必要特征是以来源表、行身份和结构化列值表示一个可寻址记录。",
      "A database row is ingestible information distinguished by one addressable record with source-table identity, row identity, and structured column values.",
      "データベース行は、出典表、行同一性、構造化列値を持つ一つのアドレス可能な記録であることを種差とする取込可能情報です。",
    ),
    "Document-is_a-IngestibleInformation": localized(
      "文档是一种可接入信息，其必要特征是具有稳定来源身份、有限内容边界和可解析格式。",
      "A document is ingestible information distinguished by stable source identity, a bounded content extent, and a parseable format.",
      "文書は、安定した出典同一性、有限の内容境界、解析可能な形式を種差とする取込可能情報です。",
    ),
    "GraphEdge-is_a-IngestibleInformation": localized(
      "图边是一种可接入信息，其必要特征是以源端点、谓词、目标端点和可选限定条件表示一个有方向的关系断言。",
      "A graph edge is ingestible information distinguished by one directed relation assertion with source endpoint, predicate, target endpoint, and optional qualifiers.",
      "グラフ辺は、始点、述語、終点、任意の限定条件を持つ一つの有向関係表明であることを種差とする取込可能情報です。",
    ),
    "GraphNode-is_a-IngestibleInformation": localized(
      "图节点是一种可接入信息，其必要特征是具有图内稳定身份、类型和可解析属性。",
      "A graph node is ingestible information distinguished by stable graph identity, type, and parseable properties.",
      "グラフノードは、グラフ内の安定同一性、型、解析可能な属性を種差とする取込可能情報です。",
    ),
    "SourceAttachment-is_a-IngestibleInformation": localized(
      "来源附件是一种可接入信息，其必要特征是把有界载荷连同来源身份、媒体类型和完整性信息提交给接入流程。",
      "A source attachment is ingestible information distinguished by a bounded payload submitted with source identity, media type, and integrity information.",
      "出典添付は、出典同一性、媒体型、完全性情報と共に有限のペイロードを取込処理へ渡すことを種差とする取込可能情報です。",
    ),
    "TextCorpus-is_a-IngestibleCollection": localized(
      "文本语料库是一种可接入集合，其成员是按共同范围和来源策略组织、可批量接入的文本资源或片段。",
      "A text corpus is an ingestible collection whose members are text resources or spans organized under a shared scope and provenance policy for batch ingestion.",
      "テキストコーパスは、共通の範囲と由来方針の下で一括取込できるテキスト資源または区間をメンバーとする取込可能集合です。",
    ),
    "CandidateSet-is_a-RetrievalCollection": localized(
      "候选集是一种检索集合，其必要特征是保存同一次检索范围内待评分、筛选或排序的候选成员及集合身份。",
      "A candidate set is a retrieval collection distinguished by set identity and candidate members awaiting scoring, filtering, or ranking within one retrieval scope.",
      "候補集合は、一つの検索範囲で評価・絞込・順位付けを待つ候補メンバーと集合同一性を持つことを種差とする検索集合です。",
    ),
  });

  const replaceRelation = ({ oldId, newId, predicate, relationKind = "composition", targetId = null }) => {
    const { entry, index } = locateRelationOwner(oldId);
    const old = entry.document.relations[index];
    const actualTargetId = targetId ?? old.target_id;
    const planeId = entry.document.module.plane_id;
    const definitions = REVIEWED_REPLACEMENT_RELATION_DEFINITIONS[newId];
    if (!definitions) throw new Error(`Missing reviewed replacement definition for ${newId}`);
    const claims = claimsFor(old, entry.document.module).map((claim) => ({
      ...claim,
      supports: `Supports the reviewed ${predicate} relation from ${old.source_id} to ${actualTargetId}; this replaces the invalid cross-kind taxonomy assertion ${oldId}.`,
    }));
    const review = reviewFor(planeId, localized(
      `${oldId} 把不同 semantic kind 错写成分类继承；v3 用 ${predicate} 保留真实语义。`,
      `${oldId} incorrectly expressed different semantic kinds as inheritance; v3 preserves the real meaning with ${predicate}.`,
      `${oldId} は異なる semantic kind を継承として誤記していたため、v3 では ${predicate} で実際の意味を保持します。`,
    ));
    entry.document.relations[index] = makeRelation({
      id: newId,
      predicate,
      sourceId: old.source_id,
      targetId: actualTargetId,
      relationKind,
      definitions,
      sourceClaims: claims,
      review,
    });
    const concept = allConcepts().get(old.source_id);
    if (concept?.primary_parent_relation_id === oldId) concept.primary_parent_relation_id = predicate === "is_a" ? newId : null;
    return entry.document.relations[index];
  };

  const applyReviewedReplacementRelationDefinitions = () => {
    for (const [relationId, definitions] of Object.entries(
      REVIEWED_REPLACEMENT_RELATION_DEFINITIONS,
    )) {
      const { entry, index } = locateRelationOwner(relationId);
      const relation = entry.document.relations[index];
      if (relation.status !== "accepted") {
        throw new Error(`Reviewed replacement relation is not accepted: ${relationId}`);
      }
      const generatedIds = new Set([
        `${relationId}-example-positive-001`,
        `${relationId}-example-boundary-001`,
      ]);
      const generatedExamples = relationExamples({
        id: relation.id,
        predicate: relation.predicate,
        sourceId: relation.source_id,
        targetId: relation.target_id,
        definitions,
        sourceClaims: relation.source_claims,
      });
      entry.document.relations[index] = {
        ...relation,
        definitions: structuredClone(definitions),
        examples: [
          ...generatedExamples,
          ...relation.examples.filter(({ id }) => !generatedIds.has(id)),
        ],
        change_note: localized(
          "v3 以关系专属种差、方向和端点语义替换了跨关系通用模板。",
          "v3 replaced the cross-relation template with relation-specific differentia, direction, and endpoint semantics.",
          "v3 は関係横断テンプレートを、関係固有の種差・方向・端点意味へ置換しました。",
        ),
      };
    }
  };

  const addConceptTo = (moduleId, concept) => {
    const entry = moduleDocuments.get(moduleId);
    if (!entry) throw new Error(`Missing module ${moduleId}`);
    if (allConcepts().has(concept.id)) throw new Error(`Duplicate concept ${concept.id}`);
    entry.document.classes.push(concept);
  };

  const addRelationTo = (moduleId, relation) => {
    const entry = moduleDocuments.get(moduleId);
    if (!entry) throw new Error(`Missing module ${moduleId}`);
    if (allRelations().has(relation.id)) throw new Error(`Duplicate relation ${relation.id}`);
    entry.document.relations.push(relation);
  };

  const upsertReviewedConcept = (parameters) => {
    const module = moduleDocuments.get(parameters.moduleId)?.document.module;
    if (!module) throw new Error(`Missing module ${parameters.moduleId}`);
    const sourceClaims = parameters.sourceClaims ?? claimsFor(module, module);
    const review = parameters.review ?? reviewFor(module.plane_id, localized(
      `${parameters.labels.zh}已按真实身份条件、semantic kind 与关系端点完成复审。`,
      `${parameters.labels.en} was reviewed against real identity conditions, semantic kind, and relation endpoints.`,
      `${parameters.labels.ja}は実在する同一性条件、semantic kind、関係端点に基づいて再審査されました。`,
    ));
    const concept = makeConcept({ ...parameters, sourceClaims, review });
    const current = allConcepts().get(parameters.id);
    if (current && current.module_id !== parameters.moduleId) {
      throw new Error(`Cannot upsert ${parameters.id}: owned by ${current.module_id}`);
    }
    const entry = moduleDocuments.get(parameters.moduleId);
    if (current) {
      entry.document.classes = entry.document.classes.map((candidate) =>
        candidate.id === parameters.id ? concept : candidate,
      );
    } else {
      entry.document.classes = [...entry.document.classes, concept];
    }
    return concept;
  };

  const updateReviewedConcept = (conceptId, updates) => {
    const current = allConcepts().get(conceptId);
    if (!current) throw new Error(`Cannot update missing concept ${conceptId}`);
    const module = moduleDocuments.get(current.module_id)?.document.module;
    if (!module) throw new Error(`Cannot update ${conceptId}: missing owner ${current.module_id}`);
    const changeNote = localized(
      `${current.labels.zh}已按身份条件、semantic kind 与真实关系端点完成语义复审。`,
      `${current.labels.en} was semantically re-reviewed against identity conditions, semantic kind, and real relation endpoints.`,
      `${current.labels.ja}は同一性条件、semantic kind、実在する関係端点に基づいて意味を再審査されました。`,
    );
    const replacement = {
      ...current,
      ...updates,
      review: reviewFor(module.plane_id, changeNote),
      change_note: changeNote,
    };
    const entry = moduleDocuments.get(current.module_id);
    entry.document.classes = entry.document.classes.map((candidate) =>
      candidate.id === conceptId ? replacement : candidate,
    );
    return replacement;
  };

  const deprecateConcept = (conceptId, replacementIds, reason) => updateReviewedConcept(conceptId, {
    status: "deprecated",
    primary_parent_relation_id: null,
    root_status: "composition-root",
    sibling_differentiation: [],
    examples: [],
    deprecated_in: VERSION_IRI,
    replaced_by_ids: [...replacementIds],
    deprecation_reason: reason,
  });

  const upsertReviewedRelation = (parameters) => {
    const module = moduleDocuments.get(parameters.moduleId)?.document.module;
    if (!module) throw new Error(`Missing module ${parameters.moduleId}`);
    const sourceClaims = parameters.sourceClaims ?? claimsFor(module, module);
    const review = parameters.review ?? reviewFor(module.plane_id, localized(
      `${parameters.id} 已按真实谓词、方向与端点完成复审。`,
      `${parameters.id} was reviewed against its real predicate, direction, and endpoints.`,
      `${parameters.id} は実在する述語、方向、端点に基づいて再審査されました。`,
    ));
    const relation = makeRelation({ ...parameters, sourceClaims, review });
    for (const entry of moduleDocuments.values()) {
      entry.document.relations = entry.document.relations.filter((candidate) => candidate.id !== parameters.id);
    }
    moduleDocuments.get(parameters.moduleId).document.relations.push(relation);
    return relation;
  };

  const deprecateRelation = (relationId, replacementIds, reason) => {
    if (!allRelations().has(relationId)) return;
    for (const entry of moduleDocuments.values()) {
      entry.document.relations = entry.document.relations.map((relation) =>
        relation.id === relationId
          ? {
              ...relation,
              status: "deprecated",
              layout_role: "cross-link",
              layout_parent_id: null,
              layout_child_id: null,
              deprecated_in: VERSION_IRI,
              replaced_by_ids: [...replacementIds],
              deprecation_reason: reason,
              change_note: reason,
            }
          : relation,
      );
      entry.document.classes = entry.document.classes.map((concept) =>
        concept.primary_parent_relation_id === relationId
          ? { ...concept, primary_parent_relation_id: null }
          : concept,
      );
    }
  };

  const synchronizeAcceptedConceptExamples = () => {
    const canonicalSnapshot = {
      classes: [...allConcepts().values()],
      relations: [...allRelations().values()],
    };
    const effectiveStructures = buildEffectiveConceptStructures(canonicalSnapshot);
    const membershipKinds = new Set(["positive", "instance", "case-fragment"]);
    const stableValue = (value) => JSON.stringify(value);

    const reviewedExampleValue = (field) => {
      if (field.example_value === undefined || field.example_value === null) {
        throw new Error(`Required field ${field.id} has no reviewed example_value`);
      }
      const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
      const value = structuredClone(field.example_value);
      return repeatable && !Array.isArray(value) ? [value] : value;
    };

    for (const entry of moduleDocuments.values()) {
      entry.document.classes = entry.document.classes.map((concept) => {
        if (concept.status !== "accepted") return concept;
        const effective = effectiveStructures.get(concept.id);
        if (!effective) throw new Error(`Missing effective structure for ${concept.id}`);
        const fields = new Map(effective.fields.map((field) => [field.id, field]));
        const examples = concept.examples.map((example) => {
          const retained = Object.fromEntries(
            Object.entries(example.field_values ?? {}).filter(([fieldId]) => fields.has(fieldId)),
          );
          const synchronized = { ...retained };
          for (const field of fields.values()) {
            const required = field.required || field.cardinality.min > 0;
            if (required && membershipKinds.has(example.kind) && !Object.hasOwn(synchronized, field.id)) {
              synchronized[field.id] = reviewedExampleValue(field);
            }
            if (Object.hasOwn(synchronized, field.id) && (field.allowed_values?.length ?? 0) > 0) {
              const allowed = new Set(field.allowed_values.map(({ value }) => stableValue(value)));
              const current = synchronized[field.id];
              const values = Array.isArray(current) ? current : [current];
              if (values.some((value) => !allowed.has(stableValue(value)))) {
                synchronized[field.id] = reviewedExampleValue(field);
              }
            }
          }
          return { ...example, field_values: synchronized };
        });
        return { ...concept, examples };
      });
    }
  };

  const reviewedPositiveExampleValues = new Map([
    ["MemoryWrite", {
      operation_id: "memory-op-write-001",
      reason: "an approved tool result is eligible for durable memory",
    }],
    ["FrontendViewAdapter", {
      adapter_id: "adapter-explorer-view",
      scope: ["localized-labels", "filters", "inspector-panels"],
      schema_version: "explorer-view@2",
    }],
    ["GraphIRAdapter", {
      adapter_id: "adapter-graph-ir",
      scope: ["nodes", "relations", "provenance", "annotations"],
      schema_version: "graph-ir@2",
    }],
    ["JSONSchemaAdapter", {
      adapter_id: "adapter-json-schema",
      scope: ["fields", "requiredness", "constraints", "controlled-values"],
      schema_version: "JSON-Schema-2020-12",
    }],
    ["OWLExportAdapter", {
      adapter_id: "adapter-owl",
      scope: ["classes", "object-properties", "iris", "axioms"],
      schema_version: "OWL2",
    }],
    ["PydanticProfileAdapter", {
      adapter_id: "adapter-pydantic",
      scope: ["python-models", "field-constraints", "enums", "validation"],
      schema_version: "Pydantic-2",
    }],
    ["SchemaAdapter", {
      adapter_id: "adapter-json-schema",
      scope: ["fields", "requiredness", "constraints", "controlled-values"],
      schema_version: "JSON-Schema-2020-12",
    }],
    ["SemanticGraphAdapter", { schema_version: "semantic-graph@2" }],
    ["SHACLExportAdapter", {
      adapter_id: "adapter-shacl",
      scope: ["node-shapes", "property-paths", "cardinalities", "constraints"],
      schema_version: "SHACL-1.0",
    }],
    ["ShExExportAdapter", {
      adapter_id: "adapter-shex",
      scope: ["rdf-node-shapes", "property-constraints", "cardinalities"],
      schema_version: "ShEx-2.1",
    }],
    ["StructuralSchemaAdapter", { schema_version: "structural-schema@2" }],
    ["ZodProfileAdapter", {
      adapter_id: "adapter-zod",
      scope: ["typescript-fields", "unions", "enums", "refinements"],
      schema_version: "Zod-4",
    }],
  ]);

  const projectionStructureFieldBaseline = [...allConcepts().values()]
    .filter(({ id }) => ["ProjectionAdapter", "SchemaAdapter"].includes(id))
    .flatMap(({ structure }) => structure.fields)
    .filter(({ id }) => ["schema_version", "loss_kind"].includes(id))
    .map((field) => structuredClone(field));

  const repairProjectionAdapterStructure = () => {
    for (const entry of moduleDocuments.values()) {
      const schemaAdapter = entry.document.classes.find(({ id }) => id === "SchemaAdapter");
      const projectionAdapter = entry.document.classes.find(({ id }) => id === "ProjectionAdapter");
      if (!schemaAdapter || !projectionAdapter) continue;
      const promotedFieldIds = new Set(["schema_version", "loss_kind"]);
      const fieldsById = new Map(
        [...projectionStructureFieldBaseline, ...schemaAdapter.structure.fields, ...projectionAdapter.structure.fields]
          .filter(({ id }) => promotedFieldIds.has(id))
          .map((field) => [field.id, structuredClone(field)]),
      );
      if (fieldsById.size !== promotedFieldIds.size) {
        throw new Error("SchemaAdapter must define schema_version and loss_kind before promotion");
      }
      const schemaVersion = fieldsById.get("schema_version");
      const lossKind = fieldsById.get("loss_kind");
      const promotedFields = [
        {
          ...schemaVersion,
          labels: localized("投影契约版本", "projection contract version", "投影契約バージョン"),
          definitions: localized(
            "固定目标投影契约、方言及其版本，使图谱、结构模式与前端视图投影都可复现。",
            "Pins the target projection contract or dialect and its version so graph, structural-schema, and frontend-view projections remain reproducible.",
            "対象投影契約または方言とその版を固定し、グラフ・構造スキーマ・フロントエンド表示の投影を再現可能にします。",
          ),
          example_value: "projection-contract@2",
        },
        {
          ...lossKind,
          labels: localized("投影损失类型", "projection loss kind", "投影損失種別"),
          definitions: localized(
            "说明目标表示对 canonical 概念、关系、字段、基数与约束的投影是精确、有损还是不支持。",
            "States whether the target representation projects canonical concepts, relations, fields, cardinalities, and constraints exactly, lossily, or not at all.",
            "対象表現が canonical な概念・関係・項目・基数・制約を正確に、有損で、または非対応として投影するかを示します。",
          ),
        },
      ];
      entry.document.classes = entry.document.classes.map((concept) => {
        if (concept.id === "ProjectionAdapter") {
          return {
            ...concept,
            structure: {
              ...concept.structure,
              identity_keys: [...new Set([
                ...concept.structure.identity_keys,
                "schema_version",
              ])],
              fields: [
                ...concept.structure.fields.filter(({ id }) => !promotedFieldIds.has(id)),
                ...promotedFields,
              ],
            },
          };
        }
        if (concept.id === "SchemaAdapter") {
          return {
            ...concept,
            structure: {
              ...concept.structure,
              identity_keys: concept.structure.identity_keys.filter(
                (id) => !promotedFieldIds.has(id)),
              fields: concept.structure.fields.filter(({ id }) => !promotedFieldIds.has(id)),
            },
          };
        }
        return concept;
      });
    }
  };

  const applyReviewedExampleSemanticCorrections = () => {
    for (const entry of moduleDocuments.values()) {
      entry.document.classes = entry.document.classes.map((concept) => {
        const positiveValues = reviewedPositiveExampleValues.get(concept.id);
        const examples = concept.examples.map((example) => {
          if (example.kind === "positive" && positiveValues) {
            return {
              ...example,
              field_values: {
                ...example.field_values,
                ...structuredClone(positiveValues),
              },
            };
          }
          if (
            concept.id === "FrontendViewAdapter" &&
            example.kind === "boundary"
          ) {
            return {
              ...example,
              related_node_ids: [
                "FrontendViewAdapter",
                "GraphIRAdapter",
                "ProjectionAdapter",
              ],
              related_relation_ids: [
                "FrontendViewAdapter-is_a-ProjectionAdapter",
              ],
            };
          }
          return example;
        });
        return { ...concept, examples };
      });
    }
  };

  const synchronizeAcceptedConceptExampleRelations = () => {
    const acceptedRelations = [...allRelations().values()]
      .filter(({ status }) => status === "accepted")
      .sort((left, right) => left.id.localeCompare(right.id, "en"));
    const relationById = new Map(acceptedRelations.map((relation) => [relation.id, relation]));
    const incidentByConceptId = new Map();
    for (const relation of acceptedRelations) {
      for (const conceptId of [relation.source_id, relation.target_id]) {
        incidentByConceptId.set(conceptId, [
          ...(incidentByConceptId.get(conceptId) ?? []),
          relation,
        ]);
      }
    }
    const graphExampleKinds = new Set(["positive", "boundary", "counterexample"]);
    for (const entry of moduleDocuments.values()) {
      entry.document.classes = entry.document.classes.map((concept) => ({
        ...concept,
        examples: concept.examples.map((example) => {
          if (!graphExampleKinds.has(example.kind)) return example;
          const incident = incidentByConceptId.get(concept.id) ?? [];
          const retained = (example.related_relation_ids ?? [])
            .map((relationId) => relationById.get(relationId))
            .filter((relation) =>
              relation && [relation.source_id, relation.target_id].includes(concept.id));
          const preferred = concept.primary_parent_relation_id
            ? relationById.get(concept.primary_parent_relation_id)
            : incident[0];
          const relations = retained.length > 0
            ? retained
            : preferred
              ? [preferred]
              : [];
          return {
            ...example,
            related_relation_ids: relations.map(({ id }) => id),
            related_node_ids: [...new Set([
              ...example.related_node_ids,
              ...relations.flatMap(({ source_id: sourceId, target_id: targetId }) => [
                sourceId,
                targetId,
              ]),
            ])],
          };
        }),
      }));
    }
  };

  const ensureStructuredInstanceExamples = () => {
    const concepts = [...allConcepts().values()];
    const relations = [...allRelations().values()];
    const existingInstanceByConceptId = new Map(
      concepts.flatMap((concept) => {
        const instance = concept.examples.find(({ kind }) => kind === "instance");
        return instance ? [[concept.id, instance]] : [];
      }),
    );
    const effectiveStructures = buildEffectiveConceptStructures({
      classes: concepts,
      relations,
    });
    const childrenByParentId = new Map();
    for (const relation of relations) {
      if (relation.status !== "accepted" || relation.predicate !== "is_a") continue;
      childrenByParentId.set(relation.target_id, [
        ...(childrenByParentId.get(relation.target_id) ?? []),
        relation.source_id,
      ]);
    }
    const adapterDescendants = new Set(["Adapter"]);
    const pendingAdapterIds = ["Adapter"];
    while (pendingAdapterIds.length > 0) {
      const parentId = pendingAdapterIds.shift();
      for (const childId of childrenByParentId.get(parentId) ?? []) {
        if (adapterDescendants.has(childId)) continue;
        adapterDescendants.add(childId);
        pendingAdapterIds.push(childId);
      }
    }
    const reviewedAdapterFamilyByConceptId = new Map([
      ["CrewAIAdapter", "crew-ai"],
      ["DeepAgentsAdapter", "deep-agents"],
      ["FIPAAdapter", "fipa"],
      ["KQMLAdapter", "kqml"],
      ["LangGraphAdapter", "lang-graph"],
      ["OpenAIAgentsAdapter", "open-aiagents"],
    ]);
    const withInstances = addStructuredInstanceExamples(concepts, relations);
    const updatedById = new Map(
      withInstances.map((concept) => {
        const fieldIds = new Set(
          (effectiveStructures.get(concept.id)?.fields ?? []).map(({ id }) => id),
        );
        const positive = concept.examples.find(({ kind }) => kind === "positive");
        const positiveValues = Object.fromEntries(
          Object.entries(positive?.field_values ?? {}).filter(([fieldId]) =>
            fieldIds.has(fieldId)),
        );
        const existingInstance = existingInstanceByConceptId.get(concept.id);
        const reviewedAdapterFamily = reviewedAdapterFamilyByConceptId.get(concept.id);
        return [
          concept.id,
          {
            ...concept,
            examples: concept.examples.map((example) =>
              example.kind === "instance"
                ? {
                    ...(existingInstance ?? example),
                    field_values: Object.fromEntries(
                      Object.entries({
                        ...(existingInstance ?? example).field_values,
                        ...structuredClone(positiveValues),
                        ...(reviewedAdapterFamily
                          ? { adapter_family: reviewedAdapterFamily }
                          : {}),
                      }).filter(([fieldId]) =>
                        fieldId !== "adapter_family" ||
                        !adapterDescendants.has(concept.id) ||
                        Object.hasOwn(positiveValues, fieldId) ||
                        reviewedAdapterFamily !== undefined),
                    ),
                  }
                : example),
          },
        ];
      }),
    );
    for (const entry of moduleDocuments.values()) {
      entry.document.classes = entry.document.classes.map((concept) =>
        updatedById.get(concept.id) ?? concept);
    }
  };

  const removeDeprecatedRelationNarratives = () => {
    const relations = [...allRelations().values()];
    const deprecatedRelationIds = new Set(
      relations.filter(({ status }) => status === "deprecated").map(({ id }) => id),
    );
    const acceptedRelations = relations.filter(({ status }) => status === "accepted");
    const acceptedPredicates = new Set(acceptedRelations.map(({ predicate }) => predicate));
    const deprecatedNarrativeRelationIds = [...deprecatedRelationIds]
      .filter((relationId) => !acceptedPredicates.has(relationId));
    const containsDeprecatedRelation = (value) => {
      const serialized = JSON.stringify(value) ?? "";
      return deprecatedNarrativeRelationIds.some((relationId) => serialized.includes(relationId));
    };

    for (const entry of moduleDocuments.values()) {
      entry.document.classes = entry.document.classes.map((concept) => {
        if (concept.status !== "accepted" || !containsDeprecatedRelation(concept)) return concept;
        for (const [fieldName, value] of [["definitions", concept.definitions], ["structure", concept.structure], ["source_claims", concept.source_claims]]) {
          if (containsDeprecatedRelation(value)) {
            throw new Error(`${concept.id}.${fieldName} still asserts a deprecated relation and requires explicit semantic repair`);
          }
        }
        if (concept.primary_parent_relation_id && deprecatedRelationIds.has(concept.primary_parent_relation_id)) {
          throw new Error(`${concept.id} still uses deprecated primary parent ${concept.primary_parent_relation_id}`);
        }

        const incidentRelations = acceptedRelations
          .filter(({ source_id: sourceId, target_id: targetId }) => sourceId === concept.id || targetId === concept.id)
          .sort((left, right) => {
            const leftPrimary = left.id === concept.primary_parent_relation_id ? 0 : 1;
            const rightPrimary = right.id === concept.primary_parent_relation_id ? 0 : 1;
            return leftPrimary - rightPrimary || left.id.localeCompare(right.id, "en");
          });
        const anchor = incidentRelations[0];
        const regenerated = conceptExamples({
          id: concept.id,
          labels: concept.labels,
          definitions: concept.definitions,
          sourceClaims: concept.source_claims,
          relatedRelationIds: anchor ? [anchor.id] : [],
        }).map((example) => {
          if (example.kind !== "positive" || !anchor) return example;
          return {
            ...example,
            descriptions: localized(
              `${concept.id}-001 满足${concept.labels.zh}的身份条件，并作为 ${anchor.id} 的 ${anchor.source_id === concept.id ? "源" : "目标"}端点参与当前有效事实。`,
              `${concept.id}-001 satisfies the identity conditions of ${concept.labels.en} and participates as the ${anchor.source_id === concept.id ? "source" : "target"} endpoint of the current accepted fact ${anchor.id}.`,
              `${concept.id}-001 は${concept.labels.ja}の同一性条件を満たし、現行有効事実 ${anchor.id} の${anchor.source_id === concept.id ? "始点" : "終点"}として参加します。`,
            ),
            related_node_ids: [...new Set([concept.id, anchor.source_id, anchor.target_id])],
            expected_result: localized(
              `查询同时返回${concept.labels.zh}节点及有方向的 ${anchor.id} 事实。`,
              `The query returns both the ${concept.labels.en} node and the directed fact ${anchor.id}.`,
              `照会は${concept.labels.ja}ノードと方向付き事実 ${anchor.id} の両方を返します。`,
            ),
          };
        });
        const preservedCaseFragments = (concept.examples ?? []).filter(
          (example) => example.kind === "case-fragment" &&
            !containsDeprecatedRelation(example),
        );
        const replacementWhy = localized(
          `保留${concept.labels.zh}的独立身份，才能验证其定义所述边界，而不从过时关系或名称相似性推断成员资格。`,
          `An independent identity for ${concept.labels.en} is required to verify its defined boundary without inferring membership from obsolete relations or name similarity.`,
          `${concept.labels.ja}の独立同一性により、廃止関係や名称類似から所属を推論せず定義境界を検証できます。`,
        );
        const replacementIncludes = localized(
          `纳入具有独立 canonical ID 且满足${concept.labels.zh}定义和身份条件的对象。`,
          `Includes objects with an independent canonical ID that satisfy the definition and identity conditions of ${concept.labels.en}.`,
          `独立 canonical ID を持ち、${concept.labels.ja}の定義と同一性条件を満たす対象を含みます。`,
        );
        const replacementExcludes = localized(
          `排除仅与${concept.labels.zh}共现、只具名称相似性，或只是字段值和状态值的对象。`,
          `Excludes objects that merely co-occur with ${concept.labels.en}, share only a similar name, or are only field or state values.`,
          `${concept.labels.ja}と共起するだけ、名称だけが類似、または項目値・状態値にすぎない対象を除外します。`,
        );
        return {
          ...concept,
          why_needed: containsDeprecatedRelation(concept.why_needed) ? replacementWhy : concept.why_needed,
          includes: concept.includes.map((value) => containsDeprecatedRelation(value) ? replacementIncludes : value),
          excludes: concept.excludes.map((value) => containsDeprecatedRelation(value) ? replacementExcludes : value),
          sibling_differentiation: concept.sibling_differentiation.filter((value) => !containsDeprecatedRelation(value)),
          examples: [...regenerated, ...preservedCaseFragments],
          review: containsDeprecatedRelation(concept.review)
            ? reviewFor(entry.document.module.plane_id, localized(`${concept.labels.zh}的节点信息已去除弃用关系并改用当前有效事实。`, `${concept.labels.en} node information was re-reviewed against current accepted facts after removing deprecated relations.`, `${concept.labels.ja}のノード情報は廃止関係を除き現行有効事実で再審査されました。`))
            : concept.review,
          change_note: containsDeprecatedRelation(concept.change_note)
            ? localized("v3 语义审查移除了弃用关系叙述并保留当前有效边界。", "The v3 semantic review removed deprecated-relation narratives and retained the current accepted boundary.", "v3 意味審査で廃止関係記述を除き現行有効境界を保持しました。")
            : concept.change_note,
        };
      });
    }
  };

  const synchronizeAcceptedRelationExampleOwnership = () => {
    for (const entry of moduleDocuments.values()) {
      entry.document.relations = entry.document.relations.map((relation) => {
        return {
          ...relation,
          examples: (relation.examples ?? []).map((example) => ({
            ...example,
            related_node_ids: [
              ...new Set([
                ...(example.related_node_ids ?? []),
                relation.source_id,
                relation.target_id,
              ]),
            ],
            related_relation_ids: [
              ...new Set([...(example.related_relation_ids ?? []), relation.id]),
            ],
          })),
        };
      });
    }
  };

  const addReviewedAnchor = ({ moduleId, id, labels, definitions, semanticKind, parentId = null }) => {
    const module = moduleDocuments.get(moduleId).document.module;
    const sourceClaims = claimsFor(module, module);
    const retrievalQuery = allConcepts().get("RetrievalQuery");
    if (!retrievalQuery) throw new Error("RetrievalQuery is missing");
    const topKField = retrievalQuery.structure?.fields?.find(({ id }) => id === "top_k");
    const topKConstraint = retrievalQuery.structure?.constraints?.find(({ id }) => id === "retrieval-query-positive-top-k");
    const review = reviewFor(module.plane_id, localized(
      `${labels.zh}补足了该模块中由一般到具体的真实逻辑层级。`,
      `${labels.en} supplies a real general-to-specific logical layer in this module.`,
      `${labels.ja}はこのモジュールに一般から具体への実在する論理層を補います。`,
    ));
    const relationId = parentId ? `${id}-is_a-${parentId}` : null;
    const concept = makeConcept({ id, moduleId, labels, definitions, semanticKind, sourceClaims, review, primaryParentRelationId: relationId });
    addConceptTo(moduleId, concept);
    if (parentId) {
      addRelationTo(moduleId, makeRelation({
        id: relationId,
        predicate: "is_a",
        sourceId: id,
        targetId: parentId,
        relationKind: "hierarchy",
        definitions: localized(`${labels.zh}是一种${allConcepts().get(parentId)?.labels.zh ?? parentId}。`, `${labels.en} is a kind of ${allConcepts().get(parentId)?.labels.en ?? parentId}.`, `${labels.ja}は${allConcepts().get(parentId)?.labels.ja ?? parentId}の一種です。`),
        sourceClaims,
        review,
      }));
    }
    return concept;
  };

  return Object.freeze({ locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, repairProjectionAdapterStructure, applyReviewedExampleSemanticCorrections, synchronizeAcceptedConceptExampleRelations, ensureStructuredInstanceExamples, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor });
};
\n
