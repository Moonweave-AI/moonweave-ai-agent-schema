import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCsv } from "../scripts/lib/csv.mjs";
import {
  assertSharedPrefixAuditResolved,
  buildOntologyParentIndexes,
  buildSharedPrefixAudit,
} from "../scripts/lib/ontology-shared-prefix-audit.mjs";

const repositoryRoot = process.cwd();

interface ModuleSourceDocument {
  readonly source_kind: string;
  readonly module: Readonly<Record<string, unknown>>;
  readonly classes: readonly Readonly<Record<string, unknown>>[];
  readonly relations: readonly Readonly<Record<string, unknown>>[];
}

const loadRepositoryAuditInput = () => {
  const sourceRoot = join(repositoryRoot, "ontology", "source");
  const documents = readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap(({ name: directoryName }) => {
      const directoryPath = join(sourceRoot, directoryName);
      return readdirSync(directoryPath)
        .filter((filename) => filename.endsWith(".json"))
        .map((filename) => JSON.parse(
          readFileSync(join(directoryPath, filename), "utf8"),
        ) as ModuleSourceDocument);
    })
    .filter(({ source_kind }) => source_kind === "agent-ontology-module");
  return {
    concepts: documents.flatMap(({ classes }) => classes),
    modules: documents.map(({ module }) => module),
    relations: documents.flatMap(({ relations }) => relations),
    ledgerRows: parseCsv(readFileSync(join(
      repositoryRoot,
      "research",
      "ontology-concept-semantic-depth-v3-ledger.csv",
    ))),
  };
};

const localized = (zh: string, en: string, ja: string) => ({ zh, en, ja });

const concept = (
  id: string,
  moduleId: string,
  labels: ReturnType<typeof localized>,
  options: Readonly<Record<string, unknown>> = {},
) => ({
  id,
  module_id: moduleId,
  labels,
  status: "accepted",
  primary_parent_relation_id: null,
  sibling_differentiation: [],
  ...options,
});

const moduleRecord = (
  id: string,
  adjacentIds: readonly string[] = [],
) => ({
  id,
  overlap_checks: adjacentIds.map((other_module_id) => ({ other_module_id })),
  competency_questions: [],
});

const relation = (
  id: string,
  sourceId: string,
  targetId: string,
  predicate = "relates_to",
) => ({
  id,
  source_id: sourceId,
  target_id: targetId,
  predicate,
  status: "accepted",
});

const primaryBackboneRelation = (
  id: string,
  parentId: string,
  childId: string,
) => ({
  ...relation(id, parentId, childId, "has_member"),
  layout_role: "primary-backbone",
  layout_parent_id: parentId,
  layout_child_id: childId,
});

describe("dynamic shared-prefix ontology audit", () => {
  it("discovers canonical-ID and trilingual label heads without single-character noise", () => {
    const audit = buildSharedPrefixAudit({
      concepts: [
        concept("Tool", "tools", localized("工具", "Tool", "ツール")),
        concept("ToolCall", "tools", localized("工具调用", "Tool call", "ツール呼び出し")),
        concept("A", "tools", localized("项", "A", "項")),
        concept("Action", "tools", localized("项目", "Action", "項目")),
        concept("TheRequest", "tools", localized("请求", "The request", "要求")),
        concept("TheResponse", "tools", localized("响应", "The response", "応答")),
      ],
      modules: [moduleRecord("tools")],
      relations: [primaryBackboneRelation("Tool-has-ToolCall", "Tool", "ToolCall")],
      ledgerRows: [],
    });

    expect(audit.candidate_count).toBe(1);
    expect(audit.candidates[0]).toMatchObject({
      concept_ids: ["Tool", "ToolCall"],
      decision_status: "decided",
      decision_type: "primary-parent-child",
    });
    expect(audit.candidates[0]?.discovery_basis).toEqual(expect.arrayContaining([
      expect.objectContaining({ surface: "canonical-id", prefix: "tool" }),
      expect.objectContaining({ surface: "label", language: "zh", prefix: "工具" }),
      expect.objectContaining({ surface: "label", language: "en", prefix: "tool" }),
      expect.objectContaining({ surface: "label", language: "ja", prefix: "ツール" }),
    ]));
  });

  it("fails an undecided same-module or reviewed-adjacent pair and ignores unrelated modules", () => {
    const sharedParent = concept(
      "CapabilityActivity",
      "tools",
      localized("能力活动", "Capability activity", "能力活動"),
    );
    const tool = concept(
      "Tool",
      "tools",
      localized("工具", "Tool", "ツール"),
      { primary_parent_relation_id: "Tool-is_a-CapabilityActivity" },
    );
    const localCall = concept(
      "ToolCall",
      "tools",
      localized("工具调用", "Tool call", "ツール呼び出し"),
      { primary_parent_relation_id: "ToolCall-is_a-CapabilityActivity" },
    );
    const adjacentResult = concept(
      "ToolResult",
      "runtime",
      localized("工具结果", "Tool result", "ツール結果"),
      { primary_parent_relation_id: "ToolResult-is_a-CapabilityActivity" },
    );
    const unrelatedTrace = concept(
      "ToolTrace",
      "telemetry",
      localized("工具轨迹", "Tool trace", "ツールトレース"),
    );
    const audit = buildSharedPrefixAudit({
      concepts: [sharedParent, tool, localCall, adjacentResult, unrelatedTrace],
      modules: [
        moduleRecord("tools", ["runtime"]),
        moduleRecord("runtime", ["tools"]),
        moduleRecord("telemetry"),
      ],
      relations: [
        relation("Tool-is_a-CapabilityActivity", "Tool", "CapabilityActivity", "is_a"),
        relation(
          "ToolCall-is_a-CapabilityActivity",
          "ToolCall",
          "CapabilityActivity",
          "is_a",
        ),
        relation(
          "ToolResult-is_a-CapabilityActivity",
          "ToolResult",
          "CapabilityActivity",
          "is_a",
        ),
      ],
      ledgerRows: [],
    });

    expect(audit.candidates.map(({ concept_ids }) => concept_ids)).toEqual([
      ["Tool", "ToolCall"],
      ["Tool", "ToolResult"],
      ["ToolCall", "ToolResult"],
    ]);
    expect(audit.unresolved_count).toBe(3);
    expect(() => assertSharedPrefixAuditResolved(audit)).toThrow(
      /Tool.*ToolCall.*ToolResult/iu,
    );
  });

  it("gates siblings with the same primary parent without equating unrelated equal-depth nodes", () => {
    const audit = buildSharedPrefixAudit({
      concepts: [
        concept("Context", "context", localized("上下文", "Context", "コンテキスト")),
        concept(
          "ContextSlice",
          "context",
          localized("切片", "Slice", "スライス"),
          { primary_parent_relation_id: "ContextSlice-is_a-Container" },
        ),
        concept("Container", "context", localized("容器", "Container", "コンテナ")),
        concept(
          "PolicyRule",
          "policy",
          localized("策略规则", "Policy rule", "ポリシールール"),
        ),
        concept("Rule", "policy", localized("规则", "Rule", "ルール")),
        concept(
          "PolicyResult",
          "policy",
          localized("策略结果", "Policy result", "ポリシー結果"),
        ),
        concept(
          "PolicyScope",
          "policy",
          localized("策略范围", "Policy scope", "ポリシースコープ"),
        ),
        concept("Result", "policy", localized("结果", "Result", "結果")),
        concept("Tool", "tools", localized("工具", "Tool", "ツール")),
        concept(
          "ToolCall",
          "tools",
          localized("工具调用", "Tool call", "ツール呼び出し"),
          { primary_parent_relation_id: "ToolCall-is_a-Tool" },
        ),
      ],
      modules: [moduleRecord("context"), moduleRecord("policy"), moduleRecord("tools")],
      relations: [
        relation("ContextSlice-is_a-Container", "ContextSlice", "Container", "is_a"),
        primaryBackboneRelation("Rule-has-PolicyRule", "Rule", "PolicyRule"),
        primaryBackboneRelation("Result-has-PolicyResult", "Result", "PolicyResult"),
        primaryBackboneRelation("Rule-has-PolicyScope", "Rule", "PolicyScope"),
        relation("ToolCall-is_a-Tool", "ToolCall", "Tool", "is_a"),
      ],
      ledgerRows: [],
    });

    expect(audit.candidates.map(({ pair_id }) => pair_id)).toEqual([
      "PolicyRule|PolicyScope",
      "Tool|ToolCall",
    ]);
    expect(audit.candidates[0]).toMatchObject({
      peer_basis: "same-logical-parent",
      decision_status: "unresolved",
    });
    expect(audit.candidates[1]).toMatchObject({
      peer_basis: "directly-related",
      decision_type: "primary-parent-child",
    });
  });

  it("records direct facts, sibling differentia, and terminal ledger decisions as evidence", () => {
    const sharedParent = concept(
      "Review",
      "feedback",
      localized("审查", "Review", "レビュー"),
    );
    const automated = concept(
      "ReviewAutomation",
      "feedback",
      localized("审查自动化", "Review automation", "レビュー自動化"),
      {
        primary_parent_relation_id: "ReviewAutomation-is_a-Review",
        sibling_differentiation: [{
          sibling_concept_id: "ReviewAssistant",
          shared_parent_concept_id: "Review",
        }],
      },
    );
    const assistant = concept(
      "ReviewAssistant",
      "feedback",
      localized("审查助手", "Review assistant", "レビュー補助"),
      {
        primary_parent_relation_id: "ReviewAssistant-is_a-Review",
        sibling_differentiation: [{
          sibling_concept_id: "ReviewAutomation",
          shared_parent_concept_id: "Review",
        }],
      },
    );
    const legacy = concept(
      "ReviewLegacy",
      "feedback",
      localized("审查旧项", "Review legacy", "レビュー旧項目"),
      { status: "deprecated", replaced_by_ids: ["Review"] },
    );
    const audit = buildSharedPrefixAudit({
      concepts: [sharedParent, automated, assistant, legacy],
      modules: [moduleRecord("feedback")],
      relations: [
        relation("ReviewAutomation-is_a-Review", "ReviewAutomation", "Review", "is_a"),
        relation("ReviewAssistant-is_a-Review", "ReviewAssistant", "Review", "is_a"),
      ],
      ledgerRows: [{
        concept_id: "ReviewLegacy",
        decision: "deprecate",
        merge_into_id: "Review",
      }],
    });

    expect(audit.unresolved_count).toBe(0);
    expect(audit.decision_counts).toMatchObject({
      "primary-parent-child": 2,
      "sibling-differentiation": 1,
      "ledger-deprecate": 3,
    });
    expect(audit.candidates.find(({ concept_ids }) =>
      concept_ids.join("|") === "ReviewAssistant|ReviewAutomation"))
      .toMatchObject({ decision_type: "sibling-differentiation" });
    expect(() => assertSharedPrefixAuditResolved(audit)).not.toThrow();
  });

  it("distinguishes every allowed direct and terminal-ledger decision type", () => {
    const audit = buildSharedPrefixAudit({
      concepts: [
        concept("Trace", "runtime", localized("追踪", "Trace", "トレース")),
        concept("TraceLink", "runtime", localized("追踪链接", "Trace link", "トレースリンク")),
        concept("Run", "runtime", localized("运行", "Run", "実行")),
        concept("RunLegacy", "runtime", localized("旧运行", "Run legacy", "旧実行"), {
          status: "deprecated",
        }),
        concept("Budget", "runtime", localized("预算", "Budget", "予算")),
        concept("BudgetLegacy", "runtime", localized("旧预算", "Budget legacy", "旧予算"), {
          status: "deprecated",
        }),
        concept("Mode", "runtime", localized("模式", "Mode", "モード")),
        concept("ModeLegacy", "runtime", localized("旧模式", "Mode legacy", "旧モード"), {
          status: "deprecated",
        }),
      ],
      modules: [moduleRecord("runtime")],
      relations: [relation("TraceLink-links-Trace", "TraceLink", "Trace", "links")],
      ledgerRows: [
        { concept_id: "RunLegacy", decision: "merge", merge_into_id: "Run" },
        {
          concept_id: "BudgetLegacy",
          decision: "convert_to_field",
          convert_to_field_of: "Budget",
        },
        {
          concept_id: "ModeLegacy",
          decision: "convert_to_allowed_value",
          convert_to_allowed_value_of: "Mode.kind",
        },
      ],
    });

    expect(audit.unresolved_count).toBe(0);
    expect(audit.decision_counts).toMatchObject({
      "direct-canonical-relation": 1,
      "ledger-merge": 1,
      "ledger-field": 1,
      "ledger-controlled-value": 1,
    });
  });

  it("keeps taxonomy and logical parents separate while rejecting invalid parent facts", () => {
    const child = concept(
      "PolicyRule",
      "policy",
      localized("策略规则", "Policy rule", "ポリシールール"),
      { primary_parent_relation_id: "PolicyRule-is_a-ExplicitParent" },
    );
    const explicitParent = concept(
      "ExplicitParent",
      "policy",
      localized("显式父项", "Explicit parent", "明示親"),
    );
    const layoutParent = concept(
      "LayoutParent",
      "policy",
      localized("布局父项", "Layout parent", "配置親"),
    );
    const input = {
      concepts: [child, explicitParent, layoutParent],
      modules: [moduleRecord("policy")],
      ledgerRows: [],
    };

    expect(() => buildSharedPrefixAudit({ ...input, relations: [] })).toThrow(
      /missing primary-parent relation/iu,
    );
    const dualParentIndexes = buildOntologyParentIndexes({
      ...input,
      relations: [
        relation(
          "PolicyRule-is_a-ExplicitParent",
          "PolicyRule",
          "ExplicitParent",
          "is_a",
        ),
        primaryBackboneRelation("LayoutParent-has-PolicyRule", "LayoutParent", "PolicyRule"),
      ],
    });
    expect(dualParentIndexes).toMatchObject({
      taxonomy_parent_by_concept_id: { PolicyRule: "ExplicitParent" },
      logical_parent_by_concept_id: { PolicyRule: "LayoutParent" },
    });
    expect(() => buildSharedPrefixAudit({
      ...input,
      concepts: [{ ...child, primary_parent_relation_id: null }, explicitParent, layoutParent],
      relations: [
        primaryBackboneRelation("ExplicitParent-has-PolicyRule", "ExplicitParent", "PolicyRule"),
        primaryBackboneRelation("LayoutParent-has-PolicyRule", "LayoutParent", "PolicyRule"),
      ],
    })).toThrow(/multiple primary-backbone relations/iu);
  });

  it("keeps the repository audit dynamically resolved and identical to the generated report", () => {
    const audit = buildSharedPrefixAudit(loadRepositoryAuditInput());
    const report = JSON.parse(readFileSync(join(
      repositoryRoot,
      "research",
      "generated",
      "ontology-semantic-depth-audit.json",
    ), "utf8")) as {
      readonly audit_version: string;
      readonly shared_prefix_audit: Readonly<Record<string, unknown>>;
      readonly lexical_families: readonly Readonly<Record<string, unknown>>[];
    };

    expect(() => assertSharedPrefixAuditResolved(audit)).not.toThrow();
    expect(report.audit_version).toBe("3.1.0");
    expect(report.shared_prefix_audit).toEqual({
      discovery_contract: audit.discovery_contract,
      candidate_count: audit.candidate_count,
      decision_counts: audit.decision_counts,
      unresolved_count: 0,
      candidates: audit.candidates,
    });
    expect(report.lexical_families).toEqual(audit.lexical_families);
    expect(JSON.stringify(report.shared_prefix_audit)).not.toContain('"reviewed"');
  });
});
