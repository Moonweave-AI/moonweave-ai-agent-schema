import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  acceptedConceptDisplayLabelViolations,
  conceptGenusDifferentiaViolations,
} from "../scripts/lib/ontology-concept-genus-differentia.mjs";
import { buildOntologyParentIndexes } from "../scripts/lib/ontology-shared-prefix-audit.mjs";
import { createConceptTerminologyPhases } from "../scripts/migration/semantic-depth-v3/concept-terminology.mjs";
import { reviewedSharedPrefixSiblingPairs } from "../scripts/migration/semantic-depth-v3/reviewed-shared-prefix-sibling-pairs.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

const localized = (zh: string, en: string, ja: string) => ({ zh, en, ja });

const concept = ({
  id,
  labels,
  definitions,
  semanticKind = "activity",
}: {
  id: string;
  labels: ReturnType<typeof localized>;
  definitions: ReturnType<typeof localized>;
  semanticKind?: string;
}) => ({
  id,
  labels,
  definitions,
  short_definitions: definitions,
  semantic_kind: semanticKind,
  status: "accepted",
  primary_parent_relation_id: null,
});

describe("accepted Concept terminology gates", () => {
  it("carries one explicit reviewed decision for every unresolved same-parent prefix pair", () => {
    const keys = reviewedSharedPrefixSiblingPairs.map(([left, right]) => `${left}\0${right}`);
    expect(reviewedSharedPrefixSiblingPairs).toHaveLength(179);
    expect(new Set(keys)).toHaveLength(keys.length);
    expect(keys).toEqual([...keys].sort((left, right) => left.localeCompare(right, "en")));
    expect(reviewedSharedPrefixSiblingPairs.every(([left, right]) =>
      left.localeCompare(right, "en") < 0,
    )).toBe(true);
  });

  it("reports normalized display-label collisions independently in each language", () => {
    const concepts = [
      concept({
        id: "MatchEvidence",
        labels: localized("匹配证据", "match evidence", "照合証拠"),
        definitions: localized(
          "匹配证据是一种信息记录，保留候选项与需求之间的逐项比较。",
          "Match evidence is an information record that preserves a criterion-by-criterion comparison between a candidate and its requirements.",
          "照合証拠は情報記録の一種であり、候補と要件の項目別比較を保持します。",
        ),
        semanticKind: "information",
      }),
      concept({
        id: "SecondEvidence",
        labels: localized(" 匹配证据 ", "different evidence", "別の証拠"),
        definitions: localized(
          "第二证据是一种信息记录，保留另一种可审计比较。",
          "Second evidence is an information record that preserves another auditable comparison.",
          "第二証拠は情報記録の一種であり、別の監査可能な比較を保持します。",
        ),
        semanticKind: "information",
      }),
    ];

    expect(acceptedConceptDisplayLabelViolations(concepts)).toEqual([
      {
        language: "zh",
        normalizedLabel: "匹配证据",
        conceptIds: ["MatchEvidence", "SecondEvidence"],
      },
    ]);
  });

  it("uses a real accepted is_a parent before falling back to semantic kind", () => {
    const concepts = [
      concept({
        id: "SelectionActivity",
        labels: localized("选择活动", "selection activity", "選択活動"),
        definitions: localized(
          "选择活动是一种活动，根据明确准则从候选集合中作出选择。",
          "Selection activity is an activity that chooses from a candidate set under explicit criteria.",
          "選択活動は活動の一種であり、明示された基準で候補集合から選択します。",
        ),
      }),
      concept({
        id: "CapabilityMatching",
        labels: localized("能力匹配", "capability matching", "能力照合"),
        definitions: localized(
          "能力匹配是一种选择活动，把任务需求逐项比对候选能力与权限。",
          "Capability matching is a selection activity that compares task requirements with candidate capability and authority.",
          "能力照合は選択活動の一種であり、タスク要件を候補の能力と権限に照合します。",
        ),
      }),
      concept({
        id: "InvalidMatching",
        labels: localized("无父级匹配", "parentless matching", "親なし照合"),
        definitions: localized(
          "无父级匹配是一种活动，把需求与候选能力进行比较。",
          "Parentless matching is an activity that compares requirements with candidate capability.",
          "親なし照合は活動の一種であり、要件と候補能力を比較します。",
        ),
      }),
    ];
    const relations = [
      {
        id: "CapabilityMatching-is_a-SelectionActivity",
        predicate: "is_a",
        source_id: "CapabilityMatching",
        target_id: "SelectionActivity",
        status: "accepted",
      },
      {
        id: "InvalidMatching-is_a-SelectionActivity",
        predicate: "is_a",
        source_id: "InvalidMatching",
        target_id: "SelectionActivity",
        status: "accepted",
      },
    ];

    expect(conceptGenusDifferentiaViolations({ classes: concepts, relations })).toEqual([
      expect.objectContaining({
        conceptId: "InvalidMatching",
        language: "zh",
        reason: "missing-real-parent-genus",
      }),
      expect.objectContaining({
        conceptId: "InvalidMatching",
        language: "en",
        reason: "missing-real-parent-genus",
      }),
      expect.objectContaining({
        conceptId: "InvalidMatching",
        language: "ja",
        reason: "missing-real-parent-genus",
      }),
    ]);
  });

  it("accepts the canonical id of a real parent as an unambiguous genus", () => {
    const concepts = [
      concept({
        id: "Candidate",
        labels: localized("候选记录", "candidate record", "候補レコード"),
        definitions: localized(
          "候选记录是一种信息记录，保存待审议对象。",
          "A candidate record is an information record that retains an object under consideration.",
          "候補レコードは情報記録の一種であり、検討対象を保持します。",
        ),
        semanticKind: "information",
      }),
      concept({
        id: "ToolCandidate",
        labels: localized("工具候选", "tool candidate", "ツール候補"),
        definitions: localized(
          "工具候选是一种候选记录（Candidate），其被考虑对象限定为工具。",
          "A ToolCandidate is a Candidate whose considered object is a Tool and whose evidence is represented by ToolMatch-assesses-ToolCandidate.",
          "ツール候補は候補レコード（Candidate）の一種で、検討対象をツールに限定します。",
        ),
        semanticKind: "information",
      }),
    ];
    const relations = [{
      id: "ToolCandidate-is_a-Candidate",
      predicate: "is_a",
      source_id: "ToolCandidate",
      target_id: "Candidate",
      status: "accepted",
    }];

    expect(conceptGenusDifferentiaViolations({ classes: concepts, relations })).toEqual([]);
  });

  it("requires explicit classification syntax and rejects known malformed clauses", () => {
    const concepts = [
      concept({
        id: "Instruction",
        labels: localized("指令", "instruction", "指示"),
        definitions: localized(
          "指令记录约束智能体行为的规范性内容，并携带权威与作用域。",
          "Instruction is a specification that records normative content with authority and scope.",
          "指示は仕様の一種であり、権威と適用範囲を持つ規範的内容を記録します。",
        ),
        semanticKind: "specification",
      }),
      concept({
        id: "ContextWindow",
        labels: localized("上下文窗口", "context window", "コンテキスト窓"),
        definitions: localized(
          "上下文窗口是一种信息记录，保存一次步骤可见的有界内容集合。",
          "Context window is an information record that differs from broader members in that bounded visible set of messages, memory records, summaries, and tool results available to one step.",
          "コンテキスト窓は情報記録の一種であり、一回のステップで見える内容集合を保持します。",
        ),
        semanticKind: "information",
      }),
      concept({
        id: "Tool",
        labels: localized("工具", "tool", "ツール"),
        definitions: localized(
          "工具是一种实体，在权限约束下公开可调用操作。",
          "Tool is an entity whose defining condition is that A it is a callable capability under permission constraints.",
          "ツールは実体の一種であり、それ定義と権限制約の下で操作を公開します。",
        ),
        semanticKind: "entity",
      }),
    ];

    expect(conceptGenusDifferentiaViolations({ classes: concepts, relations: [] }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({
          conceptId: "Instruction",
          language: "zh",
          reason: "missing-semantic-kind-genus",
        }),
        expect.objectContaining({
          conceptId: "ContextWindow",
          language: "en",
          reason: "malformed-definition-syntax",
        }),
        expect.objectContaining({
          conceptId: "Tool",
          language: "en",
          reason: "malformed-definition-syntax",
        }),
        expect.objectContaining({
          conceptId: "Tool",
          language: "ja",
          reason: "malformed-definition-syntax",
        }),
      ]));
  });

  it("rejects a repeated label and a generic or empty differentia", () => {
    const concepts = [
      concept({
        id: "RepeatedLabel",
        labels: localized("重复活动", "repeated activity", "反復活動"),
        definitions: localized(
          "重复活动是一种活动，重复活动具有独立身份。",
          "Repeated activity is an activity; repeated activity has independent identity.",
          "反復活動は活動の一種であり、反復活動は独立した同一性を持ちます。",
        ),
      }),
    ];

    const violations = conceptGenusDifferentiaViolations({ classes: concepts, relations: [] });
    expect(violations.map(({ language, reason }) => `${language}:${reason}`).sort()).toEqual([
      "en:display-label-repeated",
      "en:generic-differentia",
      "ja:display-label-repeated",
      "ja:generic-differentia",
      "zh:display-label-repeated",
      "zh:generic-differentia",
    ]);
  });

  it("preserves concept-specific facts while adding a natural trilingual genus", () => {
    type FixtureClaim = {
      source_id: string;
      locator: string;
      evidence_kind: string;
      supports: string;
    };
    const directClaim = (conceptId: string) => ({
      source_id: "fixture-source",
      locator: "Fixture > reviewed fact",
      evidence_kind: "design-inference",
      supports: `Source fixture-source supports Concept ${conceptId}'s reviewed operational fact.`,
    }) satisfies FixtureClaim;
    const example = (id: string) => ({
      id,
      kind: "positive",
      descriptions: localized("可审计示例。", "An auditable example.", "監査可能な例です。"),
      related_node_ids: [] as string[],
      related_relation_ids: [] as string[],
      expected_result: localized("保留类型。", "The type is retained.", "型を保持します。"),
      why_valid_or_invalid: localized("满足定义。", "It satisfies the definition.", "定義を満たします。"),
      source_claims: [] as FixtureClaim[],
    });
    const record = {
      ...concept({
        id: "MatchEvidence",
        labels: localized("匹配证据", "match evidence", "照合証拠"),
        definitions: localized(
          "记录任务要求、候选能力和逐项比对依据。",
          "records task requirements, candidate capability, and criterion-by-criterion rationale.",
          "タスク要件、候補能力、項目別の照合根拠を記録します。",
        ),
        semanticKind: "information",
      }),
      source_claims: [directClaim("MatchEvidence")],
      examples: [example("MatchEvidence-positive")],
    };
    const returnedCandidate = {
      ...concept({
        id: "DiscoveryCandidate",
        labels: localized("发现候选", "discovery candidate", "発見候補"),
        definitions: localized(
          "由发现或过滤返回，仍须经过选择决定。",
          "returned by discovery or filtering and still requires a selection decision.",
          "発見またはフィルタリングによって返され、引き続き選択判断を必要とします。",
        ),
        semanticKind: "information",
      }),
      source_claims: [directClaim("DiscoveryCandidate")],
      examples: [example("DiscoveryCandidate-positive")],
    };
    const relation = {
      id: "MatchEvidence-documents-DiscoveryCandidate",
      predicate: "documents",
      source_id: "MatchEvidence",
      target_id: "DiscoveryCandidate",
      status: "accepted",
      source_claims: [{
        ...directClaim("MatchEvidence-documents-DiscoveryCandidate"),
        supports: "Source fixture-source supports Relation MatchEvidence-documents-DiscoveryCandidate's reviewed operational fact.",
      }],
    };
    const moduleDocument = { classes: [record, returnedCandidate], relations: [relation] };
    const staged = new Map<string, string>();
    const phases = createConceptTerminologyPhases({
      fs: { existsSync: () => false, readFileSync: () => "" },
      path: { join: (...parts: string[]) => parts.join("/") },
      ROOT: "fixture-root",
      moduleDocuments: new Map([["fixture", { document: moduleDocument }]]),
      allConcepts: () => new Map(moduleDocument.classes.map((item) => [item.id, item])),
      allRelations: () => new Map([[relation.id, relation]]),
      shortDefinition: (definitions: ReturnType<typeof localized>) => definitions,
      stageFile: (filePath: string, contents: string) => staged.set(filePath, contents),
      stableJson: (value: unknown) => `${JSON.stringify(value)}\n`,
    });

    const audit = phases.completeConceptGenusDifferentia();
    const rewritten = moduleDocument.classes[0];
    expect(rewritten.definitions.zh).toContain("信息记录");
    expect(rewritten.definitions.zh).toContain("任务要求、候选能力和逐项比对依据");
    expect(rewritten.definitions.en).toContain("information record");
    expect(rewritten.definitions.en).toContain(
      "records task requirements, candidate capability, and criterion-by-criterion rationale",
    );
    expect(rewritten.definitions.ja).toContain("情報記録");
    expect(rewritten.definitions.ja).toContain("タスク要件、候補能力、項目別の照合根拠");
    expect(moduleDocument.classes[1].definitions.en).toContain(
      "that it is returned by discovery or filtering and still requires a selection decision",
    );
    expect(rewritten.examples[0].source_claims[0].supports).toContain(
      "Root object MatchEvidence; nested object MatchEvidence-positive at $.examples[0]",
    );
    expect(rewritten.examples[0].source_claims[0].supports).toContain(
      "Moonweave contextualization",
    );
    expect(audit.current.invalid_concept_count).toBe(0);
    expect(audit.migration.transformed_concept_count).toBe(2);
    expect(staged.has("fixture-root/research/generated/ontology-concept-genus-differentia-audit.json")).toBe(true);
  });

  it("passes every accepted Concept in the generated candidate", () => {
    const artifact = JSON.parse(readFileSync(ontologyArtifactPath(), "utf8")) as {
      classes: Array<{
        id: string;
        status: string;
        semantic_kind: string;
        definitions?: ReturnType<typeof localized>;
        primary_parent_relation_id?: string | null;
        sibling_differentiation?: Array<{
          sibling_concept_id: string;
          shared_parent_concept_id: string;
          differentia: ReturnType<typeof localized>;
          source_claims: Array<{ supports: string }>;
        }>;
      }>;
      relations: Array<{
        id: string;
        predicate: string;
        source_id: string;
        target_id: string;
        status: string;
        layout_role: string;
        layout_parent_id: string | null;
        layout_child_id: string | null;
      }>;
    };

    expect(acceptedConceptDisplayLabelViolations(artifact.classes)).toEqual([]);
    expect(conceptGenusDifferentiaViolations(artifact)).toEqual([]);

    const elicitation = artifact.classes.find(({ id }) => id === "MCPElicitation");
    expect(elicitation?.definitions).toEqual({
      zh: "MCP 引导交互是一种 MCP 请求（MCPRequest），用于在进行中的协议交互内，由 MCP 服务器请求客户端或用户提供附加输入（AdditionalInput）；该请求发生于 MCPInteraction 中，并受客户端同意与策略约束。",
      en: "MCP Elicitation is an MCP request (MCPRequest) in which an MCP server asks a client or user for AdditionalInput during an active MCPInteraction, subject to client consent and policy.",
      ja: "MCP 誘導対話は MCP 要求（MCPRequest）の一種であり、進行中の MCPInteraction 内で MCP サーバーがクライアントまたはユーザーへ追加入力（AdditionalInput）を求め、クライアントの同意とポリシーに従う要求です。",
    });

    const conceptById = new Map(artifact.classes.map((item) => [item.id, item]));
    const parentIndexes = buildOntologyParentIndexes({
      concepts: artifact.classes.filter(({ status }) => status === "accepted"),
      relations: artifact.relations,
    });
    for (const [leftId, rightId] of reviewedSharedPrefixSiblingPairs) {
      const left = conceptById.get(leftId);
      const right = conceptById.get(rightId);
      const sharedParentIds = [
        parentIndexes.taxonomy_parent_by_concept_id[leftId] &&
        parentIndexes.taxonomy_parent_by_concept_id[leftId] ===
          parentIndexes.taxonomy_parent_by_concept_id[rightId]
          ? parentIndexes.taxonomy_parent_by_concept_id[leftId]
          : null,
        parentIndexes.logical_parent_by_concept_id[leftId] &&
        parentIndexes.logical_parent_by_concept_id[leftId] ===
          parentIndexes.logical_parent_by_concept_id[rightId]
          ? parentIndexes.logical_parent_by_concept_id[leftId]
          : null,
      ].filter((id): id is string => id !== null);
      expect(sharedParentIds, `${leftId}/${rightId}/shared-parent`).not.toEqual([]);
      const contract = left?.sibling_differentiation?.find((item) =>
        item.sibling_concept_id === rightId && sharedParentIds.includes(item.shared_parent_concept_id),
      ) ?? right?.sibling_differentiation?.find((item) =>
        item.sibling_concept_id === leftId && sharedParentIds.includes(item.shared_parent_concept_id),
      );
      expect(contract, `${leftId}/${rightId}/contract`).toBeDefined();
      for (const language of ["zh", "en", "ja"] as const) {
        expect(contract?.differentia[language], `${leftId}/${rightId}/${language}`)
          .toContain(leftId);
        expect(contract?.differentia[language], `${leftId}/${rightId}/${language}`)
          .toContain(rightId);
        expect(contract?.differentia[language], `${leftId}/${rightId}/${language}`)
          .toContain(contract?.shared_parent_concept_id);
      }
      const evidence = contract?.source_claims.map(({ supports }) => supports).join("\n") ?? "";
      expect(evidence, `${leftId}/${rightId}/evidence`).toContain("Sibling evidence scope:");
      expect(evidence, `${leftId}/${rightId}/evidence`).toContain(leftId);
      expect(evidence, `${leftId}/${rightId}/evidence`).toContain(rightId);
    }
  });
});
