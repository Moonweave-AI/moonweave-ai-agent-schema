import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ontology from "../ontology/agent-ontology.json";
import definitionLedger from "../ontology/agent-ontology-definitions.json";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(path: string): Array<Record<string, string>> {
  const [headerLine, ...lines] = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function collectSourceIds(value: unknown, ids = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceIds(item, ids));
    return ids;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (key === "source_ids" && Array.isArray(nested)) {
        nested.forEach((sourceId) => ids.add(String(sourceId)));
      } else {
        collectSourceIds(nested, ids);
      }
    }
  }

  return ids;
}

function collectDefinitionRows(): Array<readonly [string, string, { definition?: string; definitions?: Record<string, string> }]> {
  return [
    ["ontology", ontology.id, ontology],
    ...ontology.planes.map((item) => ["plane", item.id, item] as const),
    ...ontology.modules.map((item) => ["module", item.id, item] as const),
    ...ontology.classes.map((item) => ["class", item.id, item] as const),
    ...ontology.object_properties.map((item) => ["object_property", item.id, item] as const),
    ...ontology.data_properties.map((item) => ["data_property", item.id, item] as const),
    ...ontology.individuals.map((item) => ["individual", item.id, item] as const),
    ...ontology.axioms.map((item) => ["axiom", item.id, item] as const)
  ];
}

describe("canonical agent ontology artifact", () => {
  const planes = new Map(ontology.planes.map((plane) => [plane.id, plane]));
  const modules = new Map(ontology.modules.map((module) => [module.id, module]));
  const classes = new Map(ontology.classes.map((klass) => [klass.id, klass]));
  const sourceRegistry = parseCsv(join(process.cwd(), "research", "source-registry.csv"));
  const livingMetadata = parseCsv(join(process.cwd(), "research", "living-source-metadata.csv"));
  const sourceRows = new Map(sourceRegistry.map((row) => [row.id, row]));
  const livingRows = new Map(livingMetadata.map((row) => [row.id, row]));
  const expectedOperationalPlanes = [
    ["info-plane", "Context Ingress & Staging Domain", "上下文摄入与暂存域", "コンテキスト取り込みとステージングドメイン"],
    ["orchestration-plane", "Control & Orchestration Domain", "控制与编排域", "制御とオーケストレーションドメイン"],
    ["runtime-plane", "Runtime State & Trace Domain", "运行状态与轨迹域", "実行状態とトレースドメイン"],
    ["adapter-plane", "Interoperability & Adapter Domain", "互操作适配域", "相互運用とアダプタドメイン"],
    ["tool-plane", "Capability & Resource Invocation Domain", "能力与资源调用域", "能力とリソース呼び出しドメイン"],
    ["safety-plane", "Trust, Policy & Safety Domain", "信任、策略与安全域", "信頼、ポリシー、安全ドメイン"],
    ["feedback-plane", "Observability & Feedback Domain", "可观测反馈域", "観測可能性とフィードバックドメイン"],
    ["memory-plane", "Memory & Context Persistence Domain", "记忆与上下文持久化域", "記憶とコンテキスト永続化ドメイン"]
  ] as const;

  it("stays at production ontology-family scale instead of a demo graph", () => {
    expect(ontology.ontology_metrics.domains).toBe(1);
    expect(ontology.planes.length).toBeGreaterThanOrEqual(8);
    expect(ontology.modules.length).toBeGreaterThanOrEqual(36);
    expect(ontology.classes.length).toBeGreaterThanOrEqual(400);
    expect(ontology.object_properties.length).toBeGreaterThanOrEqual(150);
    expect(ontology.data_properties.length).toBeGreaterThanOrEqual(90);
    expect(ontology.individuals.length).toBeGreaterThanOrEqual(70);
    expect(ontology.axioms.length).toBeGreaterThanOrEqual(350);
  });

  it("keeps metrics synchronized with concrete arrays", () => {
    expect(ontology.ontology_metrics.planes).toBe(ontology.planes.length);
    expect(ontology.ontology_metrics.modules).toBe(ontology.modules.length);
    expect(ontology.ontology_metrics.classes).toBe(ontology.classes.length);
    expect(ontology.ontology_metrics.object_properties).toBe(ontology.object_properties.length);
    expect(ontology.ontology_metrics.data_properties).toBe(ontology.data_properties.length);
    expect(ontology.ontology_metrics.individuals).toBe(ontology.individuals.length);
    expect(ontology.ontology_metrics.axioms).toBe(ontology.axioms.length);
  });

  it("names the first ontology layer as eight operational concern domains", () => {
    const expectedSummaryEn =
      "Moonweave Agent Schema organizes agent systems through eight operational concern planes. These planes describe the recurring lifecycle surfaces of an agent system: context ingress and staging, control orchestration, runtime execution, interoperability adaptation, capability invocation, trust and safety mediation, observable feedback, and memory persistence.";
    const expectedSummaryZh =
      "Moonweave Agent Schema 通过八个运行关注域组织 agent 系统：上下文摄入与暂存、控制编排、运行执行、互操作适配、能力调用、信任与安全治理、可观测反馈，以及记忆与上下文持久化。";
    const docs = [
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), "docs", "README.zh.md"), "utf8"),
      readFileSync(join(process.cwd(), "docs", "README.ja.md"), "utf8")
    ];

    for (const [planeId, enLabel, zhLabel, jaLabel] of expectedOperationalPlanes) {
      const plane = planes.get(planeId);
      expect(plane?.label).toBe(enLabel);
      expect(plane?.definitions?.en.toLowerCase()).toContain("operational concern domain");
      expect(plane?.definitions?.zh).toContain(zhLabel);
      expect(plane?.definitions?.ja).toContain(jaLabel);
    }

    expect(docs[0]).toContain(expectedSummaryEn);
    expect(docs[1]).toContain(expectedSummaryZh);
    expect(docs[0]).not.toContain("| Runtime Plane |");
    expect(docs[1]).not.toContain("| 运行平面 |");
    expect(docs[2]).not.toContain("| 実行平面 |");
  });

  it("resolves plane/module/class references", () => {
    const badModulePlanes = ontology.modules.filter((module) => !planes.has(module.plane_id)).map((module) => module.id);
    const badClassPlanes = ontology.classes.filter((klass) => !planes.has(klass.plane_id)).map((klass) => klass.id);
    const badClassModules = ontology.classes.filter((klass) => !modules.has(klass.module_id)).map((klass) => klass.id);
    const badModuleClasses = ontology.modules.flatMap((module) =>
      module.class_ids.filter((classId) => !classes.has(classId)).map((classId) => `${module.id}:${classId}`)
    );

    expect(badModulePlanes).toEqual([]);
    expect(badClassPlanes).toEqual([]);
    expect(badClassModules).toEqual([]);
    expect(badModuleClasses).toEqual([]);
  });

  it("keeps canonical ontology source evidence valid and normalized", () => {
    const sourceIds = [...collectSourceIds(ontology)].sort();
    const missing = sourceIds.filter((sourceId) => !sourceRows.has(sourceId));
    const unresolvedLiving = sourceIds.filter(
      (sourceId) => sourceRows.get(sourceId)?.source_type === "living" && livingRows.get(sourceId)?.normalization_status !== "normalized"
    );
    const excludedEvidence = sourceIds.filter((sourceId) =>
      ["future-dated-excluded", "needs-targeted-check"].includes(sourceRows.get(sourceId)?.status ?? "")
    );

    expect(missing).toEqual([]);
    expect(unresolvedLiving).toEqual([]);
    expect(excludedEvidence).toEqual([]);
  });

  it("does not model ontology metadata or hidden chain-of-thought as subject classes", () => {
    const classIds = new Set(ontology.classes.map((klass) => klass.id));
    const metadataTerms = ontology.artifact_metadata.non_subject_metadata_terms;

    expect(metadataTerms.filter((term) => classIds.has(term))).toEqual([]);
    expect(JSON.stringify(ontology)).not.toContain("HiddenChainOfThought");
  });

  it("uses concrete subject definitions instead of generation placeholders", () => {
    const placeholderPatterns = [
      /agent-system class governed by its assigned module/i,
      /the module record defines scope/i,
      /represents .+ as (an? )?.+ in the .+ module, used to model/i,
      /object property for .* links between agent-system classes/i,
      /object property linking (the )?.*Module/i,
      /data property for recording .* values on agent-system resources/i,
      /data property recording .* for (claims in )?the .*Module/i,
      /controlled individual representing the .*Module/i,
      /controlled vocabulary individual for/i
    ];

    const definitionRows = [
      ...ontology.modules.map((item) => ["module", item.id, item.definition]),
      ...ontology.classes.map((item) => ["class", item.id, item.definition]),
      ...ontology.object_properties.map((item) => ["object_property", item.id, item.definition]),
      ...ontology.data_properties.map((item) => ["data_property", item.id, item.definition]),
      ...ontology.individuals.map((item) => ["individual", item.id, item.definition])
    ];

    const placeholderDefinitions = definitionRows
      .filter(([, , definition]) => placeholderPatterns.some((pattern) => pattern.test(definition)))
      .map(([kind, id, definition]) => `${kind}:${id}:${definition}`);

    expect(placeholderDefinitions).toEqual([]);
  });

  it("models context ingress as staging artifacts with clean cross-plane ownership", () => {
    const infoPlane = planes.get("info-plane");
    const expectedInfoModules = new Map([
      ["info-messages-instructions", "Message, Instruction & Prompt Envelope Module"],
      ["info-storage-sources", "Source & Resource Reference Module"],
      ["info-content-block-modality", "Content Block & Modality Module"],
      ["info-indexing", "Lightweight Context Discovery Module"],
      ["info-output-disclosure", "Context Windowing & Disclosure Module"],
      ["info-container-command", "Execution Observation Ingress Module"]
    ]);
    const expectedIngressClasses = [
      ["ContextIngressEvent", "info-container-command"],
      ["ContextPackage", "info-messages-instructions"],
      ["ContentBlock", "info-content-block-modality"],
      ["SourceSpan", "info-storage-sources"],
      ["InstructionAuthority", "info-messages-instructions"],
      ["ContextSelectionDecision", "info-output-disclosure"],
      ["CommandOutputObservation", "info-container-command"]
    ] as const;
    const movedOutClassIds = [
      "Container",
      "CommandExecution",
      "ShellCommand",
      "FileSystem",
      "Database",
      "GraphStore",
      "Embedding",
      "TextEmbedding",
      "GraphEmbedding",
      "IndexRefreshEvent",
      "DisclosureRule"
    ];
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));
    const expectedIngressRelations = [
      "has_sender",
      "has_receiver",
      "has_content_block",
      "has_source_reference",
      "has_source_span",
      "ingested_into_context",
      "selected_for_context",
      "has_visible_window",
      "suppressed_by_rule",
      "cites_source",
      "produced_by_command_execution",
      "has_stdout_chunk",
      "has_stderr_chunk",
      "has_exit_status",
      "observed_as_context_input"
    ];

    expect(infoPlane?.label).toBe("Context Ingress & Staging Domain");
    expect(infoPlane?.definitions?.en).toContain(
      "observable content becoming available to an agent step or model call"
    );
    expect(infoPlane?.definitions?.zh).toContain("可观察内容如何进入某次 agent 步骤或模型调用可见上下文");
    expect(infoPlane?.definitions?.ja).toContain("エージェントのステップまたはモデル呼び出し");
    expect(infoPlane?.module_ids.sort()).toEqual([...expectedInfoModules.keys()].sort());

    for (const [moduleId, label] of expectedInfoModules) {
      expect(modules.get(moduleId)?.label).toBe(label);
      expect(modules.get(moduleId)?.plane_id).toBe("info-plane");
    }

    for (const [classId, moduleId] of expectedIngressClasses) {
      const klass = classes.get(classId);
      expect(klass?.plane_id).toBe("info-plane");
      expect(klass?.module_id).toBe(moduleId);
      expect(klass?.definitions?.en.length).toBeGreaterThan(40);
      expect(klass?.definitions?.zh.length).toBeGreaterThan(20);
      expect(klass?.definitions?.ja.length).toBeGreaterThan(20);
    }

    for (const classId of movedOutClassIds) {
      expect(classes.get(classId)?.plane_id).not.toBe("info-plane");
    }

    expect((classes.get("CommandExecution") as { canonical_owner_plane?: string })?.canonical_owner_plane).toBe(
      "runtime-plane"
    );
    expect((classes.get("CommandExecution") as { participating_planes?: string[] })?.participating_planes).toEqual(
      expect.arrayContaining(["info-plane", "tool-plane", "safety-plane"])
    );
    expect((classes.get("DisclosureRule") as { canonical_owner_plane?: string })?.canonical_owner_plane).toBe(
      "safety-plane"
    );
    expect((classes.get("Embedding") as { canonical_owner_plane?: string })?.canonical_owner_plane).toBe(
      "memory-plane"
    );

    expect(classes.get("SearchScore")?.definition).toContain("retrieved candidate");
    expect(classes.get("SearchScore")?.definitions?.zh).toContain("检索候选");
    expect(classes.get("SearchScore")?.definitions?.zh).not.toContain("基准任务");
    expect(classes.get("CommandExecution")?.definitions?.zh).toContain("运行域");
    expect(classes.get("OutputChunk")?.definitions?.zh).toContain("披露");
    expect(classes.get("StandardError")?.definitions?.zh).toContain("诊断输出");

    for (const relationId of expectedIngressRelations) {
      expect(objectProperties.get(relationId)?.definition.length).toBeGreaterThan(30);
    }

    expect(ontology.hygiene_gates).toEqual(
      expect.arrayContaining([
        "definition_domain_consistency_check",
        "definition_plane_leakage_check",
        "definition_language_alignment_check"
      ])
    );
  });

  it("models control and orchestration as workflow semantics instead of a term directory", () => {
    const classIds = new Set(ontology.classes.map((klass) => klass.id));
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));
    const orchestrationModules = new Map(
      ontology.modules.filter((module) => module.plane_id === "orchestration-plane").map((module) => [module.id, module])
    );
    const expectedModules = new Map([
      ["orchestration-task-planning", "Task Planning Module"],
      ["orchestration-actors-delegation", "Coordination Roles And Delegation Module"],
      ["orchestration-routing-control", "Routing And Control Module"],
      ["orchestration-composition", "Composition Patterns Module"],
      ["orchestration-evaluation", "Control Feedback Loop Module"]
    ]);
    const requiredClasses = [
      "AgentAsToolInvocation",
      "AnswerOwnership",
      "ControlOwnership",
      "DelegatedAuthority",
      "DelegationBudget",
      "DelegationOwnership",
      "ContextIsolation",
      "RoutingTarget",
      "WorkerSelection",
      "WorkerCapabilityMatch",
      "WorkerAvailability",
      "OrchestrationTopology",
      "StopRetryLineage"
    ];
    const requiredRelations = [
      "decomposes_goal_into",
      "has_task_step",
      "depends_on_task",
      "assigns_work_item_to",
      "retains_answer_ownership",
      "transfers_control_to",
      "uses_agent_as_tool",
      "isolates_context_for",
      "delegates_authority_scope",
      "selects_worker_from_pool",
      "routes_to_target",
      "has_control_topology",
      "constrained_by_budget",
      "synthesizes_from_input",
      "produces_synthesis_output",
      "triggers_revision_attempt",
      "terminates_on_condition",
      "retries_from_attempt"
    ];

    for (const [moduleId, label] of expectedModules) {
      expect(orchestrationModules.get(moduleId)?.label).toBe(label);
    }

    expect(classIds.has("OrchestrationPlane")).toBe(false);
    expect(classes.get("TaskDistribution")?.module_id).toBe("orchestration-actors-delegation");
    expect(classes.get("EvaluationCriterion")?.plane_id).toBe("feedback-plane");
    expect(classes.get("Route")?.kind).not.toBe("action_type");

    for (const classId of requiredClasses) {
      expect(classes.get(classId)?.plane_id).toBe("orchestration-plane");
      expect(classes.get(classId)?.definitions?.en.length).toBeGreaterThan(40);
      expect(classes.get(classId)?.definitions?.zh.length).toBeGreaterThan(20);
      expect(classes.get(classId)?.definitions?.ja.length).toBeGreaterThan(20);
    }

    for (const relationId of requiredRelations) {
      expect(objectProperties.get(relationId)?.family).toBe("orchestration_flow");
      expect(objectProperties.get(relationId)?.definition.length).toBeGreaterThan(40);
    }

    expect(classes.get("Goal")?.definition).toMatch(/high-level.*intent/i);
    expect(classes.get("Objective")?.definition).toMatch(/measurable|assignable|operational/i);
    expect(classes.get("GateOutcome")?.definition).toMatch(/allowed|blocked|redirected|escalated|retried|stopped/i);
    expect(classes.get("DownstreamOperation")?.definition).toMatch(/target|operation handle/i);
    expect(classes.get("AggregationRule")?.definition).toMatch(/voting|synthesis|merge/i);
    expect(classes.get("ThinkAsTool")?.definition).toMatch(/observable|tool-like/i);
    expect(classes.get("ThinkAsTool")?.definition).not.toMatch(/hidden chain-of-thought/i);

    const localizedDefinitions = [
      classes.get("TaskDistribution")?.definitions?.zh,
      classes.get("Route")?.definitions?.zh,
      classes.get("GateOutcome")?.definitions?.zh,
      classes.get("DownstreamOperation")?.definitions?.zh,
      classes.get("AggregationRule")?.definitions?.zh,
      classes.get("ThinkAsTool")?.definitions?.zh,
      classes.get("ReviewEvent")?.definitions?.zh,
      classes.get("FeedbackEvent")?.definitions?.zh
    ].join("\n");

    expect(localizedDefinitions).not.toMatch(/工具的注册、发现、匹配、参数、调用、执行结果|运行参与者及其角色边界|基准任务、场景、评分规则/);
    expect(localizedDefinitions).toMatch(/委派|路由|闸门|聚合|反馈|审查/);
  });

  it("stores multilingual definitions in the canonical artifact instead of frontend templates", () => {
    const invalidRows = collectDefinitionRows()
      .filter(([, , item]) => {
        const definitions = item.definitions;
        return (
          !definitions ||
          definitions.en !== (item.definition ?? ("statement" in item ? item.statement : undefined)) ||
          !definitions.en?.trim() ||
          !definitions.zh?.trim() ||
          !definitions.ja?.trim()
        );
      })
      .map(([kind, id]) => `${kind}:${id}`);

    expect(invalidRows).toEqual([]);
  });

  it("takes every multilingual definition from the explicit curated definition ledger", () => {
    const ledgerEntries = definitionLedger.definitions as Record<string, { definitions?: Record<string, string>; review_status?: string }>;
    const mismatches = collectDefinitionRows()
      .filter(([, id, item]) => {
        const ledgerEntry = ledgerEntries[id];
        return (
          ledgerEntry?.review_status !== "curated" ||
          ledgerEntry.definitions?.en !== item.definitions?.en ||
          ledgerEntry.definitions?.zh !== item.definitions?.zh ||
          ledgerEntry.definitions?.ja !== item.definitions?.ja
        );
      })
      .map(([kind, id]) => `${kind}:${id}`);

    expect(mismatches).toEqual([]);
  });

  it("uses hand-reviewed definitions for text document and text embedding terms", () => {
    const classDefinitions = new Map(ontology.classes.map((klass) => [klass.id, klass.definitions]));
    const textDocument = classDefinitions.get("TextDocument");
    const textEmbedding = classDefinitions.get("TextEmbedding");

    expect(textDocument?.zh).toContain("文本文档");
    expect(textDocument?.zh).toContain("文本型信息源");
    expect(textDocument?.zh).not.toMatch(/text文档|Storage|Sources|InformationIndexing/);
    expect(textDocument?.ja).toContain("テキスト文書");
    expect(textDocument?.ja).toContain("テキスト情報源");
    expect(textDocument?.ja).not.toMatch(/text文書|Storage|Sources|InformationIndexing/);

    expect(textEmbedding?.zh).toContain("文本嵌入");
    expect(textEmbedding?.zh).toContain("稠密");
    expect(textEmbedding?.zh).toContain("检索");
    expect(textEmbedding?.zh).not.toMatch(/工具身份|工具.*副作用|InformationIndexing|text嵌入/);
    expect(textEmbedding?.ja).toContain("テキスト埋め込み");
    expect(textEmbedding?.ja).toContain("密");
    expect(textEmbedding?.ja).toContain("検索");
    expect(textEmbedding?.ja).not.toMatch(/ツールの識別|副作用|InformationIndexing|text埋め込み/);
  });

  it("keeps context-ingress localized definitions specific instead of template generated", () => {
    const staleDefinitionIds = ["InfoPlane", "ToolMessage", "UserAgentMessage"];
    const forbiddenLocalizedTemplates = [
      "该消息与指令术语",
      "该窗口与披露术语",
      "该执行相关术语",
      "该来源引用术语",
      "该轻量发现术语",
      "该内容块术语",
      "该术语是经过来源支撑",
      "このメッセージと指示の用語",
      "このウィンドウと開示の用語",
      "この実行関連の用語",
      "この出典参照の用語",
      "この発見と検索の用語",
      "この内容ブロックの用語",
      "この用語は、出典に支えられた"
    ];
    const ledgerEntries = definitionLedger.definitions as Record<string, { definitions?: Record<string, string> }>;
    const staleLedgerEntries = staleDefinitionIds.filter((id) => id in ledgerEntries);
    const templateRows = ontology.classes
      .filter((klass) =>
        forbiddenLocalizedTemplates.some((phrase) =>
          `${klass.definitions?.zh ?? ""} ${klass.definitions?.ja ?? ""}`.includes(phrase)
        )
      )
      .map((klass) => `${klass.id}:${klass.definitions?.zh ?? ""}`);

    expect(staleLedgerEntries).toEqual([]);
    expect(templateRows).toEqual([]);
  });

  it("keeps localized definitions free of generated glue and untranslated fallback labels", () => {
    const allowedTechnicalTokens = new Set([
      "MCP",
      "A2A",
      "FIPA",
      "KQML",
      "JSON",
      "Schema",
      "SCXML",
      "OWL",
      "RDF",
      "SHACL",
      "ShEx",
      "Zod",
      "Pydantic",
      "SWE",
      "OSWorld",
      "tau2",
      "AppWorld",
      "Terminal",
      "AgencyBench",
      "API",
      "HTTP",
      "SOCKS",
      "UDP",
      "SSH",
      "TCP",
      "TF",
      "IDF",
      "Top",
      "LangGraph",
      "CrewAI",
      "Deep",
      "DeepAgents",
      "OpenAI",
      "Microsoft",
      "IR",
      "XState",
      "SWEbench",
      "TerminalBench",
      "Top-K",
      "SDK",
      "TypeScript",
      "TF-IDF",
      "UML",
      "ELK",
      "Dagre",
      "Ajv",
      "URI",
      "integer",
      "number",
      "string",
      "date-time",
      "source",
      "agent",
      "ID",
      "IDs",
      "Agents",
      "WebSocket"
    ]);
    const forbiddenGlue = [
      "InformationIndexing",
      "Storage",
      "Sources",
      "object_type",
      "event_type",
      "resource_type",
      "adapter_type",
      "policy_type",
      "action_type",
      "index_type",
      "relation_type",
      "actor_type",
      "contains",
      "relates",
      "emits",
      "hasevidence",
      "has状态",
      "has成本",
      "界定该术语",
      "声明本体中的结构约束",
      "表示该术语在智能体系统中的规范语义"
    ];

    const badRows = collectDefinitionRows().flatMap(([kind, id, item]) =>
      (["zh", "ja"] as const).flatMap((language) => {
        const text = item.definitions?.[language] ?? "";
        const unexpectedTokens = [...new Set(text.match(/[A-Za-z][A-Za-z0-9+-]*/g) ?? [])].filter(
          (token) => !allowedTechnicalTokens.has(token)
        );
        const glueHit = forbiddenGlue.find((phrase) => text.includes(phrase));

        return unexpectedTokens.length > 0 || glueHit
          ? [`${kind}:${id}:${language}:${unexpectedTokens.join(",")}:${glueHit ?? ""}`]
          : [];
      })
    );

    expect(badRows).toEqual([]);
  });

  it("keeps runtime sessions and environments as bounded runtime objects, not events", () => {
    const classesById = new Map(ontology.classes.map((klass) => [klass.id, klass]));

    expect(classesById.get("RuntimeSession")?.kind).toBe("object_type");
    expect(classesById.get("RuntimeEnvironment")?.kind).toBe("object_type");
    expect(classesById.get("RuntimeSession")?.definitions?.zh).toContain("有边界的执行片段");
    expect(classesById.get("RuntimeEnvironment")?.definitions?.zh).toContain("具体执行环境");
  });

  it("models runtime state and trace as an executable provenance graph", () => {
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));
    const expectedModules = new Map([
      ["runtime-system", "Runtime Session And Execution Envelope Module"],
      ["runtime-actors", "Runtime Actor And Authority Module"],
      ["runtime-observability", "Runtime Trace And Checkpoint Module"],
      ["runtime-artifacts", "Runtime Artifact Provenance Module"]
    ]);
    const expectedKinds = new Map([
      ["RunOutcome", "object_type"],
      ["SessionLifecycle", "object_type"],
      ["ActorAuthorityScope", "policy_type"],
      ["ActorCapabilityBinding", "relation_type"],
      ["ActorRoleBinding", "relation_type"],
      ["TraceRecord", "object_type"],
      ["TraceRetentionPolicy", "policy_type"]
    ]);
    const requiredRuntimeClasses = [
      "TraceRecord",
      "SpanAttribute",
      "SpanStatus",
      "TraceContext",
      "RuntimeSession",
      "RunAttempt",
      "RunOutcome",
      "Checkpoint",
      "StateSnapshot",
      "StateDiff",
      "Artifact",
      "AgentActor"
    ];
    const requiredRuntimeRelations = [
      ["has_runtime_session", "AgentSystem", "RuntimeSession"],
      ["has_run_attempt", "RuntimeSession", "RunAttempt"],
      ["yields_run_outcome", "RunAttempt", "RunOutcome"],
      ["run_attempt_belongs_to_task", "RunAttempt", "Task"],
      ["uses_runtime_environment", "RunAttempt", "RuntimeEnvironment"],
      ["constrained_by_runtime_budget", "RunAttempt", "RuntimeBudget"],
      ["opens_runtime_session", "SessionStartEvent", "RuntimeSession"],
      ["closes_runtime_session", "SessionEndEvent", "RuntimeSession"],
      ["pauses_with_snapshot", "SessionPauseEvent", "StateSnapshot"],
      ["resumes_from_checkpoint", "SessionResumeEvent", "Checkpoint"],
      ["participates_in_session", "AgentActor", "RuntimeSession"],
      ["associated_with_attempt", "AgentActor", "RunAttempt"],
      ["has_actor_role_binding", "AgentActor", "ActorRoleBinding"],
      ["has_actor_authority_scope", "AgentActor", "ActorAuthorityScope"],
      ["has_actor_capability_binding", "AgentActor", "ActorCapabilityBinding"],
      ["remote_agent_crosses_trust_boundary", "RemoteAgentReference", "TrustBoundary"],
      ["session_has_trace", "RuntimeSession", "TraceRecord"],
      ["trace_contains_span", "TraceRecord", "TraceSpan"],
      ["trace_has_context", "TraceRecord", "TraceContext"],
      ["span_contains_event", "TraceSpan", "TraceEvent"],
      ["span_has_parent_span", "TraceSpan", "TraceSpan"],
      ["span_has_attribute", "TraceSpan", "SpanAttribute"],
      ["span_has_status", "TraceSpan", "SpanStatus"],
      ["trace_link_source_span", "TraceLink", "TraceSpan"],
      ["trace_link_target_span", "TraceLink", "TraceSpan"],
      ["trace_event_belongs_to_span", "TraceEvent", "TraceSpan"],
      ["trace_event_ordered_before", "TraceEvent", "TraceEvent"],
      ["trace_event_caused_by", "TraceEvent", "TraceEvent"],
      ["checkpoint_captures_snapshot", "Checkpoint", "StateSnapshot"],
      ["checkpoint_belongs_to_session", "Checkpoint", "RuntimeSession"],
      ["checkpoint_has_parent", "Checkpoint", "Checkpoint"],
      ["state_diff_from_snapshot", "StateDiff", "StateSnapshot"],
      ["state_diff_to_snapshot", "StateDiff", "StateSnapshot"],
      ["restore_event_restores_checkpoint", "CheckpointRestoreEvent", "Checkpoint"],
      ["replay_event_replays_trace", "ReplayEvent", "TraceRecord"],
      ["artifact_produced_by_attempt", "Artifact", "RunAttempt"],
      ["artifact_produced_by_event", "Artifact", "TraceEvent"],
      ["artifact_consumed_by_attempt", "Artifact", "RunAttempt"],
      ["artifact_derived_from", "Artifact", "Artifact"],
      ["artifact_attributed_to_actor", "Artifact", "AgentActor"],
      ["artifact_reviewed_by", "Artifact", "ReviewEvent"],
      ["artifact_exported_as", "Artifact", "ExportArtifact"]
    ] as const;

    for (const [moduleId, label] of expectedModules) {
      const module = modules.get(moduleId);
      expect(module?.label).toBe(label);
      expect(module?.definitions?.zh.length).toBeGreaterThan(20);
      expect(module?.definitions?.ja.length).toBeGreaterThan(20);
    }

    for (const [classId, kind] of expectedKinds) {
      expect(classes.get(classId)?.kind).toBe(kind);
    }

    for (const classId of requiredRuntimeClasses) {
      const klass = classes.get(classId);
      expect(klass?.plane_id).toBe("runtime-plane");
      expect(klass?.definitions?.en.length).toBeGreaterThan(40);
      expect(klass?.definitions?.zh.length).toBeGreaterThan(20);
      expect(klass?.definitions?.ja.length).toBeGreaterThan(20);
    }

    for (const [relationId, domain, range] of requiredRuntimeRelations) {
      const relation = objectProperties.get(relationId);
      expect(relation?.family).toBe("runtime_execution");
      expect(relation?.domain).toBe(domain);
      expect(relation?.range).toBe(range);
      expect(relation?.definition.length).toBeGreaterThan(45);
      expect(relation?.source_ids).toEqual(
        expect.arrayContaining(["eng-fw-openai-tracing", "eng-fw-langgraph-docs", "eng-ont-prov-o"])
      );
    }

    expect(classes.get("TraceRecord")?.definition).toMatch(/trace.*container|root.*trace|span/i);
    expect(classes.get("TraceSpan")?.definition).toMatch(/operation interval|unit of work|parent/i);
    expect(classes.get("TraceLink")?.definition).toMatch(/non-parent|causal|contextual/i);
    expect(classes.get("TraceRetentionPolicy")?.definition).toMatch(/retention|redaction|sampling|privacy|deletion/i);
    expect(classes.get("Checkpoint")?.definition).toMatch(/saved continuation point|resume|recover|time travel/i);
    expect(classes.get("StateDiff")?.definition).toMatch(/from.*snapshot|to.*snapshot|difference/i);
    expect(classes.get("Artifact")?.definition).toMatch(/provenance|produced|consumed|attributed|derived/i);
    expect(classes.get("ObservableSummary")?.definition).toMatch(/observable runtime summary/i);
    expect(classes.get("ObservableSummary")?.definition).not.toMatch(/hidden chain-of-thought/i);

    const localizedDefinitions = [
      ontology.planes.find((plane) => plane.id === "runtime-plane")?.definitions?.zh,
      modules.get("runtime-system")?.definitions?.zh,
      modules.get("runtime-observability")?.definitions?.zh,
      modules.get("runtime-artifacts")?.definitions?.zh,
      classes.get("Checkpoint")?.definitions?.zh,
      classes.get("RunAttempt")?.definitions?.zh,
      classes.get("TraceRetentionPolicy")?.definitions?.zh,
      classes.get("TraceSpan")?.definitions?.zh,
      classes.get("TraceLink")?.definitions?.zh,
      classes.get("Artifact")?.definitions?.zh
    ].join("\n");

    expect(localizedDefinitions).toMatch(/运行会话|执行尝试|可观测追踪|检查点|快照|产物溯源/);
    expect(localizedDefinitions).not.toMatch(/信任或安全边界|根据状态、策略、条件或观察结果选择下一步操作|任务规划|路由|基准任务/);
  });

  it("renders entity definitions from the canonical artifact in the frontend", () => {
    const appSource = readFileSync(join(process.cwd(), "src", "App.tsx"), "utf8");

    expect(appSource).toContain("definitionForLanguage(selectedItem, language)");
    expect(appSource).not.toContain("<p>{localizeDefinition(selectedItem, language)}</p>");
  });

  it("uses concept-specific class explanations for core agent-system terms", () => {
    const definitions = new Map(ontology.classes.map((klass) => [klass.id, klass.definition]));
    const expectedConceptSignals = [
      ["AuthorityScope", /authorization|permissions|access|operation/i],
      ["DataZone", /data.*(handling|visibility|retention|classification|trust)/i],
      ["BoundaryCrossing", /(crosses|movement|transfer).*(boundary|trust zone|authority|data)/i],
      ["ToolCall", /(invocation|execute|runtime).*(tool|argument|result)/i],
      ["TaskPlan", /(task|work item|goal).*(decomposition|dependenc|sequence)|(decomposition|dependenc|sequence).*(task|work item|goal)/i],
      ["PromptChain", /(ordered|sequence|stage).*(prompt|decomposition|chain)/i],
      ["MCPAdapter", /MCP.*(tool|resource|prompt|client|server)/i],
      ["A2AAdapter", /(remote agent|agent-to-agent|opaque|delegation).*(task|message|artifact|identity)/i]
    ] as const;

    const weakDefinitions = expectedConceptSignals
      .filter(([classId, pattern]) => !pattern.test(definitions.get(classId) ?? ""))
      .map(([classId]) => `${classId}: ${definitions.get(classId) ?? "<missing>"}`);

    expect(weakDefinitions).toEqual([]);
  });

  it("does not collapse runtime and context concepts into one repeated explanation", () => {
    const definitions = new Map(ontology.classes.map((klass) => [klass.id, klass.definition]));
    const conceptPatterns = [
      ["RuntimeEnvironment", /(execution environment|container|sandbox|working directory|environment variable)/i],
      ["RunAttempt", /(single|individual|one).*attempt|retry|invocation/i],
      ["RunOutcome", /(success|failure|terminal|completion|result)/i],
      ["SessionLifecycle", /(start|pause|resume|end).*session|session.*(start|pause|resume|end)/i],
      ["ContextBudget", /(token|window|capacity|budget|limit)/i],
      ["ContextExclusion", /(omit|exclude|redact|privacy|policy)/i],
      ["ContextSlot", /(slot|position|reserved|segment).*context|context.*(slot|position|reserved|segment)/i],
      ["ContextSource", /(origin|source|retrieval|memory|message|document)/i],
      ["ContextSummary", /(condensed|summary|compress|prior state|context budget)/i],
      ["EnvironmentVariable", /(name-value|configuration|secret|process environment|runtime setting)/i],
      ["MCPSession", /(client|server|connection|capability|request|transport)/i]
    ] as const;

    const weakDefinitions = conceptPatterns
      .filter(([classId, pattern]) => !pattern.test(definitions.get(classId) ?? ""))
      .map(([classId]) => `${classId}: ${definitions.get(classId) ?? "<missing>"}`);
    const runtimeContextDefinitions = conceptPatterns.map(([classId]) => definitions.get(classId));

    expect(weakDefinitions).toEqual([]);
    expect(new Set(runtimeContextDefinitions).size).toBe(runtimeContextDefinitions.length);
  });
});
