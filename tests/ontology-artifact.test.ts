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
    ["feedback-plane", "Observability & Feedback Domain", "可观测性与反馈域", "観測可能性とフィードバックドメイン"],
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
      "Moonweave Agent Schema organizes agent systems through eight operational concern planes. These planes describe the recurring lifecycle surfaces of an agent system: context ingress and staging, control orchestration, runtime execution, interoperability adaptation, capability and resource invocation, trust and safety mediation, observable feedback, and memory persistence.";
    const expectedSummaryZh =
      "Moonweave Agent Schema 通过八个运行关注域组织 agent 系统：上下文摄入与暂存、控制编排、运行执行、互操作适配、能力与资源调用、信任与安全治理、可观测反馈，以及记忆与上下文持久化。";
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

  it("models interoperability as a governed adapter membrane with directional mappings", () => {
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));
    const adapterPlane = ontology.planes.find((plane) => plane.id === "adapter-plane");
    const expectedModules = new Map([
      ["adapter-protocols", "Protocol Adapter Module"],
      ["adapter-frameworks", "Framework Adapter Module"],
      ["adapter-benchmarks", "Benchmark Adapter Module"],
      ["adapter-statecharts", "Statechart Adapter Module"],
      ["adapter-schema-export", "Schema And Export Adapter Module"],
      ["adapter-mapping-infrastructure", "Adapter Mapping Infrastructure Module"]
    ]);
    const expectedClassModules = new Map([
      ["ProtocolAdapter", "adapter-protocols"],
      ["MCPAdapter", "adapter-protocols"],
      ["A2AAdapter", "adapter-protocols"],
      ["FIPAAdapter", "adapter-protocols"],
      ["KQMLAdapter", "adapter-protocols"],
      ["FrameworkAdapter", "adapter-frameworks"],
      ["FrameworkHandoffMapping", "adapter-frameworks"],
      ["FrameworkTraceMapping", "adapter-frameworks"],
      ["BenchmarkAdapter", "adapter-benchmarks"],
      ["SWEBenchAdapter", "adapter-benchmarks"],
      ["OSWorldAdapter", "adapter-benchmarks"],
      ["Tau2Adapter", "adapter-benchmarks"],
      ["AppWorldAdapter", "adapter-benchmarks"],
      ["TerminalBenchAdapter", "adapter-benchmarks"],
      ["AgencyBenchAdapter", "adapter-benchmarks"],
      ["StatechartAdapter", "adapter-statecharts"],
      ["XStateAdapter", "adapter-statecharts"],
      ["SCXMLAdapter", "adapter-statecharts"],
      ["SchemaAdapter", "adapter-schema-export"],
      ["JSONSchemaAdapter", "adapter-schema-export"],
      ["ZodProfileAdapter", "adapter-schema-export"],
      ["PydanticProfileAdapter", "adapter-schema-export"],
      ["OWLExportAdapter", "adapter-schema-export"],
      ["SHACLExportAdapter", "adapter-schema-export"],
      ["ShExExportAdapter", "adapter-schema-export"],
      ["GraphIRAdapter", "adapter-schema-export"],
      ["FrontendViewAdapter", "adapter-schema-export"],
      ["MappingRule", "adapter-mapping-infrastructure"],
      ["ConversionWarning", "adapter-mapping-infrastructure"]
    ]);
    const expectedSources = new Map([
      ["MCPAdapter", ["eng-proto-mcp-spec", "eng-proto-mcp-auth", "eng-proto-mcp-repo"]],
      ["A2AAdapter", ["eng-proto-a2a-spec", "eng-proto-a2a-docs", "eng-proto-a2a-repo"]],
      ["FIPAAdapter", ["eng-proto-fipa-acl", "eng-proto-fipa-act", "eng-proto-fipa-ip"]],
      ["KQMLAdapter", ["lit-proto-kqml", "eng-proto-kqml-spec"]],
      ["LangGraphAdapter", ["eng-fw-langgraph-docs", "eng-fw-langgraph-graph-api", "eng-fw-langgraph-repo"]],
      ["OpenAIAgentsAdapter", ["eng-fw-openai-python-docs", "eng-fw-openai-handoffs", "eng-fw-openai-tracing"]],
      ["CrewAIAdapter", ["eng-fw-crewai-docs", "eng-fw-crewai-agents", "eng-fw-crewai-flows"]],
      ["DeepAgentsAdapter", ["eng-fw-deepagents-docs", "eng-fw-deepagents-js-docs", "eng-fw-deepagents-repo"]],
      [
        "MicrosoftAgentFrameworkAdapter",
        ["eng-fw-microsoft-agent-framework-docs", "eng-fw-microsoft-agent-framework-repo", "eng-fw-microsoft-agent-framework-current"]
      ],
      ["LangChainAdapter", ["eng-fw-langchain-agents", "eng-fw-langchain-repo", "eng-fw-langgraph-docs"]],
      ["SWEBenchAdapter", ["eng-bench-swebench-site", "eng-bench-swebench-repo", "lit-bench-swebench"]],
      ["OSWorldAdapter", ["eng-bench-osworld-site", "eng-bench-osworld-repo", "lit-bench-osworld"]],
      ["Tau2Adapter", ["eng-bench-tau2", "eng-bench-tau2-verified", "lit-bench-tau2"]],
      ["AppWorldAdapter", ["eng-bench-appworld", "lit-bench-appworld"]],
      ["TerminalBenchAdapter", ["eng-bench-terminal", "eng-bench-terminal-21", "lit-bench-terminal"]],
      ["AgencyBenchAdapter", ["eng-bench-agencybench", "lit-bench-agencybench"]],
      ["XStateAdapter", ["eng-state-xstate-docs", "eng-state-xstate-graph", "eng-state-scxml"]],
      ["SCXMLAdapter", ["eng-state-scxml", "eng-state-xstate-scxml", "lit-state-harel"]],
      ["JSONSchemaAdapter", ["eng-val-jsonschema-spec", "eng-val-jsonschema-ietf", "lit-val-jsonschema-ietf"]],
      ["ZodProfileAdapter", ["eng-val-zod-docs", "eng-val-zod-json-schema", "eng-val-zod-release-430"]],
      ["PydanticProfileAdapter", ["eng-val-pydantic-json-schema", "eng-val-pydantic-core"]],
      ["OWLExportAdapter", ["eng-ont-owl", "lit-ont-owl-shacl-lessons"]],
      ["SHACLExportAdapter", ["eng-val-shacl", "lit-val-shacl", "lit-ont-shacl-shex-survey"]],
      ["ShExExportAdapter", ["eng-val-shex", "lit-ont-shacl-shex-survey"]]
    ]);
    const requiredAdapterRelations = [
      ["maps_external_construct_to_canonical", "MappingRule", "any"],
      ["maps_canonical_term_to_external_construct", "MappingRule", "any"],
      ["emits_conversion_warning", "MappingRule", "ConversionWarning"],
      ["maps_protocol_message_to_canonical_message", "ProtocolMessageMapping", "Message"],
      ["maps_protocol_task_to_canonical_task", "ProtocolTaskMapping", "Task"],
      ["maps_protocol_capability_to_canonical_capability", "ProtocolCapabilityMapping", "ToolCapability"],
      ["maps_protocol_trust_to_trust_boundary", "ProtocolTrustMapping", "TrustBoundary"],
      ["maps_framework_handoff_to_canonical_handoff", "FrameworkHandoffMapping", "Handoff"],
      ["maps_framework_trace_to_trace_record", "FrameworkTraceMapping", "TraceRecord"],
      ["maps_statechart_state_to_snapshot", "StatechartAdapter", "StateSnapshot"],
      ["maps_benchmark_score_to_metric", "BenchmarkAdapter", "Metric"],
      ["maps_schema_profile_to_schema_artifact", "SchemaAdapter", "SchemaArtifact"]
    ] as const;

    expect(classes.has("AdapterPlane")).toBe(false);
    expect(adapterPlane?.module_ids).toEqual(expect.arrayContaining([...expectedModules.keys()]));
    expect(adapterPlane?.module_ids).not.toContain("adapter-benchmarks-statecharts");

    for (const [moduleId, label] of expectedModules) {
      const module = modules.get(moduleId);
      expect(module?.label).toBe(label);
      expect(module?.definitions?.zh.length).toBeGreaterThan(24);
      expect(module?.definitions?.ja.length).toBeGreaterThan(24);
    }

    for (const [classId, moduleId] of expectedClassModules) {
      const klass = classes.get(classId);
      expect(klass?.module_id).toBe(moduleId);
      expect(klass?.plane_id).toBe("adapter-plane");
      expect(klass?.definitions?.zh.length).toBeGreaterThan(24);
      expect(klass?.definitions?.ja.length).toBeGreaterThan(24);
    }

    for (const [classId, sourceIds] of expectedSources) {
      const klass = classes.get(classId);
      expect(klass?.source_ids).toEqual(expect.arrayContaining(sourceIds));
      expect(klass?.source_ids).not.toEqual(expect.arrayContaining(["eng-proto-mcp-spec", "eng-proto-a2a-docs", "eng-val-jsonschema-spec"]));
    }

    for (const [relationId, domain, range] of requiredAdapterRelations) {
      const relation = objectProperties.get(relationId);
      expect(relation?.family).toBe("adapter_mapping");
      expect(relation?.domain).toBe(domain);
      expect(relation?.range).toBe(range);
      expect(relation?.definition).toMatch(/external|canonical|mapping|adapter|conversion/i);
      expect(relation?.source_ids).toEqual(
        expect.arrayContaining(["eng-proto-mcp-spec", "eng-proto-a2a-spec", "eng-state-xstate-docs", "eng-val-jsonschema-spec"])
      );
    }

    expect(objectProperties.get("maps_to")?.definition).toMatch(/legacy summary|canonical terms/i);
    expect(classes.get("FrameworkHandoffMapping")?.definition).toMatch(/framework-native.*handoff.*canonical Handoff/i);
    expect(classes.get("FrameworkTraceMapping")?.definition).toMatch(/framework-native.*trace.*TraceRecord|TraceSpan|TraceEvent/i);
    expect(classes.get("MappingRule")?.definition).toMatch(/directional.*external.*canonical|canonical.*external/i);
    expect(classes.get("ConversionWarning")?.definition).toMatch(/loss|approximation|unsupported|ambiguity/i);
    expect(classes.get("PydanticProfileAdapter")?.definition).toMatch(/Pydantic schema|BaseModel|TypeAdapter/i);
    expect(classes.get("PydanticProfileAdapter")?.definition).not.toMatch(/Pydantic AI/i);

    const localizedAdapterDefinitions = [
      ontology.planes.find((plane) => plane.id === "adapter-plane")?.definitions?.zh,
      modules.get("adapter-benchmarks")?.definitions?.zh,
      modules.get("adapter-statecharts")?.definitions?.zh,
      modules.get("adapter-mapping-infrastructure")?.definitions?.zh,
      classes.get("XStateAdapter")?.definitions?.zh,
      classes.get("SchemaAdapter")?.definitions?.zh,
      classes.get("MappingRule")?.definitions?.zh,
      classes.get("ConversionWarning")?.definitions?.zh,
      classes.get("FrameworkTraceMapping")?.definitions?.zh
    ].join("\n");

    expect(localizedAdapterDefinitions).toMatch(/适配膜|映射方向|外部构造|规范术语|状态图|转换损失|不支持语义/);
    expect(localizedAdapterDefinitions).not.toMatch(/基准与状态图适配器模块|所属平面：互操作适配域|证据源 \d+ 项|信任或安全边界|可审计运行证据/);
  });

  it("models trust policy and safety as an auditable propagation graph", () => {
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));
    const classIds = new Set(ontology.classes.map((klass) => klass.id));
    const safetyPlane = ontology.planes.find((plane) => plane.id === "safety-plane");
    const safetyModules = new Map(
      ontology.modules.filter((module) => module.plane_id === "safety-plane").map((module) => [module.id, module])
    );
    const expectedModules = new Map([
      ["safety-trust-boundary", "Trust Boundary Module"],
      ["safety-permission-policy", "Permission And Policy Module"],
      ["safety-sandbox-network", "Sandbox And Network Module"],
      ["safety-injection-defense", "Injection Defense Module"],
      ["safety-commit-redaction", "Commit And Redaction Module"]
    ]);
    const expectedKinds = new Map([
      ["TrustBoundary", "object_type"],
      ["RemoteAgentBoundary", "object_type"],
      ["BoundaryCrossing", "event_type"],
      ["AuthorityScope", "policy_type"],
      ["PermissionScope", "policy_type"],
      ["AuthorizationGrant", "policy_type"],
      ["CapabilityGrant", "policy_type"],
      ["PolicyDecision", "policy_type"],
      ["TaintedSource", "resource_type"],
      ["TaintedSpan", "resource_type"],
      ["TaintPropagation", "relation_type"],
      ["SourceSinkFlow", "relation_type"],
      ["MemoryPoisoningSignal", "event_type"],
      ["PersistentContextRisk", "event_type"],
      ["CommitApproval", "policy_type"],
      ["CommitDenial", "policy_type"],
      ["SideEffect", "event_type"],
      ["SensitiveSpan", "resource_type"]
    ]);
    const requiredInjectionClasses = [
      "TaintedSource",
      "TaintedSpan",
      "TaintPropagation",
      "SourceSinkFlow",
      "UntrustedInstructionCandidate",
      "InstructionConflict",
      "TrustedInstructionOverride",
      "RiskSource",
      "RiskSink",
      "MemoryPoisoningSignal",
      "PersistentContextRisk",
      "PoisonedRetrievedChunk",
      "PoisonedToolDescription",
      "ToolSchemaPoisoning",
      "ResourceContentPoisoning"
    ];
    const requiredSafetyRelations = [
      ["crosses_trust_boundary", "BoundaryCrossing", "TrustBoundary", "trust_boundary"],
      ["boundary_crossing_has_source_actor", "BoundaryCrossing", "AgentActor", "safety_propagation"],
      ["boundary_crossing_has_target_actor", "BoundaryCrossing", "AgentActor", "safety_propagation"],
      ["boundary_crossing_has_source_zone", "BoundaryCrossing", "DataZone", "safety_propagation"],
      ["boundary_crossing_has_target_zone", "BoundaryCrossing", "DataZone", "safety_propagation"],
      ["boundary_crossing_authorized_by", "BoundaryCrossing", "PolicyDecision", "safety_propagation"],
      ["boundary_crossing_recorded_by_trace_event", "BoundaryCrossing", "TraceEvent", "safety_propagation"],
      ["source_reference_belongs_to_data_zone", "SourceReference", "DataZone", "safety_propagation"],
      ["context_window_crosses_trust_boundary", "VisibleContextWindow", "TrustBoundary", "safety_propagation"],
      ["message_scanned_by_pattern_scan", "Message", "PatternScan", "safety_propagation"],
      ["instruction_flagged_as_prompt_injection", "Instruction", "PromptInjectionSignal", "safety_propagation"],
      ["tool_result_flagged_as_tool_stream_injection", "ToolResult", "ToolStreamInjectionSignal", "safety_propagation"],
      ["tool_call_requires_permission_scope", "ToolCall", "PermissionScope", "permission_flow"],
      ["tool_call_evaluated_by_policy_decision", "ToolCall", "PolicyDecision", "permission_flow"],
      ["tool_call_executes_in_sandbox", "ToolCall", "Sandbox", "permission_flow"],
      ["tool_result_scanned_by_pattern_scan", "ToolResult", "PatternScan", "safety_propagation"],
      ["mcp_authorization_maps_to_authorization_grant", "MCPAuthorization", "AuthorizationGrant", "permission_flow"],
      ["commit_request_evaluated_by_commit_gate", "CommitRequest", "CommitGate", "commit_control"],
      ["commit_gate_emits_policy_decision", "CommitGate", "PolicyDecision", "commit_control"],
      ["commit_approval_authorizes_side_effect", "CommitApproval", "SideEffect", "commit_control"],
      ["commit_denial_blocks_side_effect", "CommitDenial", "SideEffect", "commit_control"],
      ["side_effect_produced_by_tool_call", "SideEffect", "ToolCall", "commit_control"],
      ["side_effect_produced_by_sandbox_command", "SideEffect", "SandboxCommand", "commit_control"],
      ["side_effect_produced_by_network_call", "SideEffect", "NetworkCall", "commit_control"],
      ["side_effect_has_rollback_action", "SideEffect", "RollbackAction", "commit_control"],
      ["output_segment_has_sensitive_span", "OutputSegment", "SensitiveSpan", "disclosure_control"],
      ["disclosure_filter_suppresses_output_window", "DisclosureFilter", "OutputWindow", "disclosure_control"],
      ["redaction_applies_to_sensitive_span", "Redaction", "SensitiveSpan", "disclosure_control"],
      ["audit_disclosure_records_disclosure_filter", "AuditDisclosure", "DisclosureFilter", "disclosure_control"]
    ] as const;

    expect(classIds.has("SafetyPlane")).toBe(false);
    expect(safetyPlane?.module_ids).toEqual(expect.arrayContaining([...expectedModules.keys()]));

    for (const [moduleId, label] of expectedModules) {
      const module = safetyModules.get(moduleId);
      expect(module?.label).toBe(label);
      expect(module?.definitions?.en.length).toBeGreaterThan(55);
      expect(module?.definitions?.zh.length).toBeGreaterThan(24);
      expect(module?.definitions?.ja.length).toBeGreaterThan(24);
    }

    for (const [classId, kind] of expectedKinds) {
      expect(classes.get(classId)?.kind).toBe(kind);
    }

    for (const classId of requiredInjectionClasses) {
      const klass = classes.get(classId);
      expect(klass?.plane_id).toBe("safety-plane");
      expect(klass?.module_id).toBe("safety-injection-defense");
      expect(klass?.definitions?.en.length).toBeGreaterThan(50);
      expect(klass?.definitions?.zh.length).toBeGreaterThan(24);
      expect(klass?.definitions?.ja.length).toBeGreaterThan(24);
    }

    for (const [relationId, domain, range, family] of requiredSafetyRelations) {
      const relation = objectProperties.get(relationId);
      expect(relation?.domain).toBe(domain);
      expect(relation?.range).toBe(range);
      expect(relation?.family).toBe(family);
      expect(relation?.definition.length).toBeGreaterThan(55);
      expect(relation?.definitions?.zh.length).toBeGreaterThan(24);
      expect(relation?.definitions?.ja.length).toBeGreaterThan(24);
      expect(relation?.source_ids).toEqual(
        expect.arrayContaining(["lit-agent-safeagent", "eng-fw-openai-guardrails", "eng-security-mcp-nsa-2026"])
      );
    }

    expect(classes.get("RemoteAgentBoundary")?.definition).toMatch(
      /(opacity|identity|authority|accountability).*(trust boundary|boundary)/i
    );
    expect(classes.get("BoundaryCrossing")?.definition).toMatch(
      /source actor.*target actor.*source zone.*target zone.*direction.*authority basis.*policy decision.*trace/i
    );
    expect(classes.get("PolicyCondition")?.definition).toMatch(/subject actor|requested operation|protected resource|policy basis/i);
    expect(classes.get("PolicyException")?.definition).toMatch(/exception scope|expiration|revocation|audit reason/i);
    expect(classes.get("PromptInjectionSignal")?.definition).toMatch(/override trusted instructions|manipulate/i);
    expect(classes.get("ToolStreamInjectionSignal")?.definition).toMatch(/streamed tool output|tool result.*inject/i);
    expect(classes.get("MaliciousToolOutput")?.definition).toMatch(/untrusted instructions|exfiltration|policy-bypass/i);
    expect(classes.get("MaliciousToolOutput")?.definition).not.toMatch(/callable external or hosted capability/i);
    expect(objectProperties.get("authorizes")?.definition).toMatch(/legacy summary|use .*authorizes.*specific/i);
    expect(objectProperties.get("blocks")?.definition).toMatch(/legacy summary|use .*blocks.*specific/i);

    const localizedSafetyDefinitions = [
      safetyPlane?.definitions?.zh,
      ...[...safetyModules.values()].map((module) => module.definitions?.zh),
      ...[
        "TrustBoundary",
        "BoundaryCrossing",
        "PolicyDecision",
        "PermissionScope",
        "Sandbox",
        "PromptInjectionSignal",
        "TaintPropagation",
        "SourceSinkFlow",
        "MemoryPoisoningSignal",
        "CommitApproval",
        "CommitDenial",
        "Redaction",
        "AuditDisclosure"
      ].map((classId) => classes.get(classId)?.definitions?.zh),
      ...requiredSafetyRelations.map(([relationId]) => objectProperties.get(relationId)?.definitions?.zh)
    ].join("\n");
    const localizedSafetyDefinitionsJa = [
      safetyPlane?.definitions?.ja,
      ...[...safetyModules.values()].map((module) => module.definitions?.ja),
      ...[
        "TrustBoundary",
        "BoundaryCrossing",
        "PolicyDecision",
        "PermissionScope",
        "Sandbox",
        "PromptInjectionSignal",
        "TaintPropagation",
        "SourceSinkFlow",
        "MemoryPoisoningSignal",
        "CommitApproval",
        "CommitDenial",
        "Redaction",
        "AuditDisclosure"
      ].map((classId) => classes.get(classId)?.definitions?.ja),
      ...requiredSafetyRelations.map(([relationId]) => objectProperties.get(relationId)?.definitions?.ja)
    ].join("\n");

    expect(localizedSafetyDefinitions).toMatch(/信任边界|策略决策|沙箱|注入|污点|来源|接收方|脱敏|副作用|审计/);
    expect(localizedSafetyDefinitionsJa).toMatch(/信頼境界|ポリシー判断|サンドボックス|注入|汚染|送信元|受信先|秘匿|副作用|監査/);
    expect(localizedSafetyDefinitions).not.toMatch(
      /所属平面：|证据源 \d+ 项|信頼、ポリシー、安全ドメイン|工具的注册、发现、匹配|会话、运行、事件、轨迹|根据状态、策略、条件|可审计运行证据/
    );
    expect(localizedSafetyDefinitionsJa).not.toMatch(/所属平面：|证据源 \d+ 项|工具的注册、发现、匹配|会话、运行、事件、轨迹/);
  });

  it("models capability and resource invocation beyond tool calls", () => {
    const classes = new Map(ontology.classes.map((klass) => [klass.id, klass]));
    const modules = new Map(ontology.modules.map((module) => [module.id, module]));
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));

    expect(classes.has("ToolPlane")).toBe(false);
    expect(modules.get("tool-mcp-transport")?.label).toBe("MCP Protocol Surface Module");
    expect(modules.get("tool-mcp-transport")?.definition).toMatch(/client\/server|resources|prompts|tools|elicitation|authorization/i);

    const expectedCapabilityClasses = [
      ["CapabilitySurface", "object_type", /advertised surface.*tools.*resources.*prompts.*API/i],
      ["CapabilityDescriptor", "resource_type", /machine-readable.*capability.*operation.*schema.*trust/i],
      ["APIOperation", "action_type", /external API.*operation.*method.*endpoint.*arguments.*result/i],
      ["ResourceDefinition", "resource_type", /resource.*definition.*read.*subscribe.*template/i],
      ["ResourceReadRequest", "event_type", /request.*read.*resource/i],
      ["ResourceReadResult", "resource_type", /observable.*resource.*content.*metadata/i],
      ["ResourceSubscription", "object_type", /subscription.*resource.*change/i],
      ["ResourceTemplate", "resource_type", /parameterized.*resource.*template/i],
      ["PromptDefinition", "resource_type", /prompt.*definition.*template.*workflow/i],
      ["PromptTemplate", "resource_type", /templated.*message.*workflow/i],
      ["PromptGetRequest", "event_type", /request.*prompt.*definition/i],
      ["PromptInstantiation", "event_type", /instantiates.*prompt.*arguments/i],
      ["HostedTool", "object_type", /hosted.*tool.*external service/i],
      ["LocalRuntimeTool", "object_type", /local.*runtime.*tool.*process|shell|computer/i],
      ["FunctionTool", "object_type", /function.*tool.*schema.*arguments/i],
      ["ComputerTool", "object_type", /computer.*UI|desktop|browser/i],
      ["ShellTool", "object_type", /shell.*command.*runtime/i],
      ["HostedMCPTool", "object_type", /MCP.*hosted.*tool/i],
      ["ToolInvocationCandidate", "resource_type", /candidate.*tool invocation.*pre-execution/i],
      ["PreExecutionSafetyCheck", "event_type", /pre-execution.*tool.*risk/i],
      ["UnsafeArgumentPattern", "resource_type", /argument.*pattern.*unsafe/i],
      ["ToolDescriptionTrust", "policy_type", /tool description.*trusted.*server/i],
      ["ToolApprovalGate", "policy_type", /approval.*tool.*execution/i],
      ["ConditionalToolEnabled", "policy_type", /conditional.*tool.*enabled/i]
    ] as const;

    const weakCapabilityClasses = expectedCapabilityClasses
      .filter(([classId, kind, pattern]) => classes.get(classId)?.kind !== kind || !pattern.test(classes.get(classId)?.definition ?? ""))
      .map(([classId]) => `${classId}: ${classes.get(classId)?.kind ?? "<missing>"}:${classes.get(classId)?.definition ?? "<missing>"}`);
    expect(weakCapabilityClasses).toEqual([]);

    expect(classes.get("ToolCallPlan")?.kind).toBe("resource_type");
    expect(classes.get("MCPClient")?.kind).toBe("object_type");
    expect(classes.get("MCPServer")?.kind).toBe("object_type");
    expect(classes.get("ToolError")?.definition).toMatch(/error|failure|exception|attempt/i);
    expect(classes.get("ToolError")?.definition).not.toMatch(/callable external or hosted capability/i);
    expect(classes.get("ToolWarning")?.definition).toMatch(/warning|diagnostic|degraded|non-fatal/i);
    expect(classes.get("ToolWarning")?.definition).not.toMatch(/callable external or hosted capability/i);
    expect(classes.get("ToolSideEffect")?.definition).toMatch(/external state change|persistent|commit|rollback/i);
    expect(classes.get("ToolSideEffect")?.definition).not.toMatch(/callable external or hosted capability/i);
    expect(classes.get("ToolPermissionSpec")?.definition).toMatch(/tool-side permission declaration|scope|approval|safety/i);
    expect(classes.get("MCPPromptList")?.definition).toMatch(/server-exposed list.*prompt definitions|prompt templates/i);
    expect(classes.get("MCPResourceList")?.definition).toMatch(/server-exposed list.*resource definitions|resource templates/i);

    const expectedCapabilityRelations = [
      ["tool_registry_registers_tool_definition", "ToolRegistry", "ToolDefinition", "registry_definition"],
      ["tool_definition_defines_tool", "ToolDefinition", "Tool", "registry_definition"],
      ["tool_definition_has_argument_schema", "ToolDefinition", "ToolArgumentSchema", "schema_conformance"],
      ["tool_definition_has_result_schema", "ToolDefinition", "ToolResultSchema", "schema_conformance"],
      ["tool_definition_declares_permission", "ToolDefinition", "ToolPermissionSpec", "permission_bridge"],
      ["tool_definition_has_version", "ToolDefinition", "ToolVersion", "registry_definition"],
      ["tool_definition_deprecated_by", "ToolDefinition", "ToolDeprecationNotice", "registry_definition"],
      ["capability_surface_advertises_descriptor", "CapabilitySurface", "CapabilityDescriptor", "capability_surface"],
      ["capability_descriptor_describes_api_operation", "CapabilityDescriptor", "APIOperation", "capability_surface"],
      ["tool_search_produces_candidate_set", "ToolSearch", "ToolCandidateSet", "discovery_selection"],
      ["tool_candidate_set_contains_candidate", "ToolCandidateSet", "ToolCandidate", "discovery_selection"],
      ["tool_candidate_ranked_by_match", "ToolCandidate", "ToolMatch", "discovery_selection"],
      ["tool_selection_decision_selects_tool", "ToolSelectionDecision", "Tool", "discovery_selection"],
      ["tool_selection_decision_rejects_candidate", "ToolSelectionDecision", "ToolCandidate", "discovery_selection"],
      ["tool_fallback_replaces_tool", "ToolFallback", "Tool", "discovery_selection"],
      ["tool_call_uses_argument", "ToolCall", "ToolArgument", "invocation_execution"],
      ["tool_argument_conforms_to_schema", "ToolArgument", "ToolArgumentSchema", "schema_conformance"],
      ["tool_call_has_attempt", "ToolCall", "ToolCallAttempt", "invocation_execution"],
      ["tool_call_retry_retries_attempt", "ToolCallRetry", "ToolCallAttempt", "invocation_execution"],
      ["tool_result_conforms_to_schema", "ToolResult", "ToolResultSchema", "schema_conformance"],
      ["tool_error_caused_by_attempt", "ToolError", "ToolCallAttempt", "invocation_execution"],
      ["tool_warning_attached_to_result", "ToolWarning", "ToolResult", "invocation_execution"],
      ["tool_call_emits_trace_event", "ToolCall", "TraceEvent", "runtime_execution"],
      ["tool_call_attempt_belongs_to_trace_span", "ToolCallAttempt", "TraceSpan", "runtime_execution"],
      ["tool_result_observation_enters_context", "ToolResultObservation", "ContextPackage", "context_ingress"],
      ["mcp_server_exposes_tool_list", "MCPServer", "MCPToolList", "mcp_surface"],
      ["mcp_server_exposes_resource_list", "MCPServer", "MCPResourceList", "mcp_surface"],
      ["mcp_server_exposes_prompt_list", "MCPServer", "MCPPromptList", "mcp_surface"],
      ["mcp_resource_list_contains_resource_definition", "MCPResourceList", "ResourceDefinition", "mcp_surface"],
      ["mcp_prompt_list_contains_prompt_definition", "MCPPromptList", "PromptDefinition", "mcp_surface"],
      ["mcp_client_opens_session", "MCPClient", "MCPSession", "mcp_surface"],
      ["mcp_session_uses_transport", "MCPSession", "MCPTransport", "mcp_surface"],
      ["mcp_authorization_authorizes_tool_call", "MCPAuthorization", "ToolCall", "permission_bridge"],
      ["mcp_authorization_authorizes_resource_read", "MCPAuthorization", "ResourceReadRequest", "permission_bridge"],
      ["mcp_authorization_authorizes_prompt_get", "MCPAuthorization", "PromptGetRequest", "permission_bridge"],
      ["mcp_elicitation_requests_additional_input", "MCPElicitation", "AdditionalInput", "mcp_surface"],
      ["tool_invocation_candidate_checked_by_safety_check", "ToolInvocationCandidate", "PreExecutionSafetyCheck", "permission_bridge"],
      ["tool_description_trust_bounds_tool_definition", "ToolDescriptionTrust", "ToolDefinition", "permission_bridge"],
      ["tool_side_effect_requires_commit_gate", "ToolSideEffect", "CommitGate", "commit_control"],
      ["tool_side_effect_materializes_side_effect", "ToolSideEffect", "SideEffect", "commit_control"]
    ] as const;

    for (const [relationId, domain, range, family] of expectedCapabilityRelations) {
      const relation = objectProperties.get(relationId);
      expect([relation?.domain, relation?.range, relation?.family]).toEqual([domain, range, family]);
      expect(relation?.definition).toMatch(/links|connects|records|authorizes|declares|advertises|exposes|contains|checks/i);
    }

    const localizedDefinitions = [
      modules.get("tool-registry-definition")?.definitions?.zh,
      modules.get("tool-discovery-selection")?.definitions?.zh,
      modules.get("tool-invocation-execution")?.definitions?.zh,
      modules.get("tool-mcp-transport")?.definitions?.zh,
      classes.get("ToolRegistry")?.definitions?.zh,
      classes.get("ToolError")?.definitions?.zh,
      classes.get("ToolWarning")?.definitions?.zh,
      classes.get("MCPClient")?.definitions?.zh,
      classes.get("MCPServer")?.definitions?.zh,
      classes.get("MCPTransport")?.definitions?.zh
    ].join("\n");
    const localizedDefinitionsJa = [
      modules.get("tool-registry-definition")?.definitions?.ja,
      modules.get("tool-discovery-selection")?.definitions?.ja,
      modules.get("tool-invocation-execution")?.definitions?.ja,
      modules.get("tool-mcp-transport")?.definitions?.ja,
      classes.get("ToolRegistry")?.definitions?.ja,
      classes.get("ToolError")?.definitions?.ja,
      classes.get("ToolWarning")?.definitions?.ja,
      classes.get("MCPClient")?.definitions?.ja,
      classes.get("MCPServer")?.definitions?.ja,
      classes.get("MCPTransport")?.definitions?.ja
    ].join("\n");

    expect(localizedDefinitions).not.toMatch(/\u6240\u5c5e\u5e73\u9762|\u8bc1\u636e\u6e90|\u9002\u914d\u5668\u7c7b|\u6388\u6743\u63d0\u793a.*\u7b56\u7565\u89c4\u5219/);
    expect(localizedDefinitionsJa).not.toMatch(/\u6240\u5c5e\u5e73\u9762|\u51fa\u5178|\u30a2\u30c0\u30d7\u30bf\u985e|\u8a8d\u53ef\u30d7\u30ed\u30f3\u30d7.*\u30dd\u30ea\u30b7\u30fc\u898f\u5247/);
  });

  it("models observability and feedback as a semantic flow graph", () => {
    const classes = new Map(ontology.classes.map((klass) => [klass.id, klass]));
    const modules = new Map(ontology.modules.map((module) => [module.id, module]));
    const objectProperties = new Map(ontology.object_properties.map((property) => [property.id, property]));
    const docs = [
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), "docs", "README.zh.md"), "utf8"),
      readFileSync(join(process.cwd(), "docs", "README.ja.md"), "utf8"),
      readFileSync(join(process.cwd(), "src", "App.tsx"), "utf8")
    ].join("\n");

    expect(classes.has("FeedbackPlane")).toBe(false);
    expect(modules.get("feedback-logging")?.label).toBe("Telemetry, Audit And Export Pipeline Module");
    expect(modules.get("feedback-logging")?.definition).toMatch(/logs.*telemetry.*audit.*trace exports.*sinks/i);
    expect(modules.get("feedback-metrics-evaluation")?.definition).toMatch(/generic metrics.*evaluation runs.*rubrics.*scores/i);
    expect(modules.get("feedback-metrics-evaluation")?.definition).toMatch(/benchmark-specific.*adapter/i);
    expect(modules.get("feedback-metrics-evaluation")?.definition).not.toMatch(/pressure axes|leaderboard/i);

    const expectedFeedbackClasses = [
      ["EventSink", "object_type", /destination|consumer|receiver|export target/i],
      ["LogRecord", "resource_type", /structured log record.*trace|span|event|diagnostic/i],
      ["LogStream", "object_type", /ordered stream.*log records|telemetry/i],
      ["AuditLog", "object_type", /reviewable.*collection|channel.*log records.*audit/i],
      ["TelemetryEvent", "event_type", /instrumented signal.*derived from.*runtime trace/i],
      ["TraceExport", "resource_type", /exported trace package|portable trace artifact/i],
      ["DiagnosticMessage", "resource_type", /diagnostic output|debug message|explanation/i],
      ["RiskSignal", "event_type", /safety bridge|policy-sensitive|trust boundary/i],
      ["ConfidenceSignal", "resource_type", /confidence|uncertainty.*review|metric|observation/i],
      ["ReviewFinding", "resource_type", /specific issue|observation|recommendation.*review/i],
      ["Correction", "action_type", /change proposed or applied.*feedback|review finding/i],
      ["LearningSignal", "resource_type", /feedback.*may update.*memory|routing|tool selection|policy/i],
      ["RecoveryAction", "action_type", /feedback-triggered|failure-triggered.*repair|retry|reroute|stop/i],
      ["RollbackAction", "action_type", /rollback.*side effect|state|artifact|unsafe/i],
      ["EvaluationRun", "event_type", /assessment episode.*metric|rubric|score/i],
      ["EvaluationScenario", "resource_type", /generic evaluation setup|scenario.*adapter-specific/i],
      ["Metric", "resource_type", /measurable property.*run|task|tool|route/i],
      ["Score", "resource_type", /numeric|ordinal.*metric.*evaluation/i],
      ["Rubric", "resource_type", /generic scoring guide|criteria.*not benchmark-specific/i]
    ] as const;

    const weakFeedbackClasses = expectedFeedbackClasses
      .filter(([classId, kind, pattern]) => classes.get(classId)?.kind !== kind || !pattern.test(classes.get(classId)?.definition ?? ""))
      .map(([classId]) => `${classId}: ${classes.get(classId)?.kind ?? "<missing>"}:${classes.get(classId)?.definition ?? "<missing>"}`);
    expect(weakFeedbackClasses).toEqual([]);

    expect(objectProperties.has("feedback_logging_emits_event")).toBe(false);
    expect(objectProperties.has("feedback_warning_error_emits_event")).toBe(false);

    const expectedFeedbackRelations = [
      ["trace_event_recorded_as_log_record", "TraceEvent", "LogRecord", "observability_pipeline"],
      ["trace_span_exported_by_trace_export", "TraceSpan", "TraceExport", "observability_pipeline"],
      ["trace_record_exported_as_trace_export", "TraceRecord", "TraceExport", "observability_pipeline"],
      ["log_record_appended_to_audit_log", "LogRecord", "AuditLog", "observability_pipeline"],
      ["log_stream_carries_log_record", "LogStream", "LogRecord", "observability_pipeline"],
      ["log_subscription_registers_listener", "LogSubscription", "LogListener", "observability_pipeline"],
      ["log_listener_subscribes_to_stream", "LogListener", "LogStream", "observability_pipeline"],
      ["log_stream_delivered_to_event_sink", "LogStream", "EventSink", "observability_pipeline"],
      ["telemetry_event_derived_from_trace_event", "TelemetryEvent", "TraceEvent", "observability_pipeline"],
      ["telemetry_event_emitted_to_log_stream", "TelemetryEvent", "LogStream", "observability_pipeline"],
      ["diagnostic_message_derived_from_log_record", "DiagnosticMessage", "LogRecord", "observability_pipeline"],
      ["audit_log_summarizes_audit_record", "AuditLog", "AuditRecord", "observability_pipeline"],
      ["trace_event_records_error_event", "TraceEvent", "ErrorEvent", "feedback_diagnostics"],
      ["error_event_classified_by_failure_mode", "ErrorEvent", "FailureMode", "feedback_diagnostics"],
      ["blocking_error_blocks_run_attempt", "BlockingError", "RunAttempt", "feedback_diagnostics"],
      ["retryable_error_triggers_recovery_plan", "RetryableError", "RecoveryPlan", "feedback_diagnostics"],
      ["warning_event_raises_warning", "WarningEvent", "Warning", "feedback_diagnostics"],
      ["risk_signal_flags_policy_decision", "RiskSignal", "PolicyDecision", "safety_feedback_bridge"],
      ["confidence_signal_qualifies_review_finding", "ConfidenceSignal", "ReviewFinding", "evaluation_feedback"],
      ["review_produces_review_finding", "Review", "ReviewFinding", "feedback_flow"],
      ["review_finding_about_artifact", "ReviewFinding", "Artifact", "feedback_flow"],
      ["review_finding_about_trace_event", "ReviewFinding", "TraceEvent", "feedback_flow"],
      ["feedback_derived_from_review_finding", "Feedback", "ReviewFinding", "feedback_flow"],
      ["correction_applies_to_artifact", "Correction", "Artifact", "feedback_flow"],
      ["correction_triggered_by_feedback", "Correction", "Feedback", "feedback_flow"],
      ["optimization_loop_consumes_feedback", "OptimizationLoop", "Feedback", "feedback_flow"],
      ["optimization_loop_consumes_metric", "OptimizationLoop", "Metric", "evaluation_feedback"],
      ["learning_signal_derived_from_feedback", "LearningSignal", "Feedback", "feedback_flow"],
      ["learning_signal_updates_memory_preference", "LearningSignal", "MemoryPreference", "feedback_flow"],
      ["learning_signal_updates_routing_policy", "LearningSignal", "RoutingPolicy", "feedback_flow"],
      ["learning_signal_updates_tool_selection", "LearningSignal", "ToolSelectionDecision", "feedback_flow"],
      ["feedback_event_carries_feedback", "FeedbackEvent", "Feedback", "feedback_flow"],
      ["feedback_event_targets_task", "FeedbackEvent", "Task", "feedback_flow"],
      ["feedback_event_targets_route", "FeedbackEvent", "Route", "feedback_flow"],
      ["feedback_event_targets_worker", "FeedbackEvent", "WorkerAgent", "feedback_flow"],
      ["feedback_event_targets_optimization_loop", "FeedbackEvent", "OptimizationLoop", "feedback_flow"],
      ["feedback_event_informs_policy_decision", "FeedbackEvent", "PolicyDecision", "safety_feedback_bridge"],
      ["evaluation_run_uses_rubric", "EvaluationRun", "Rubric", "evaluation_feedback"],
      ["evaluation_run_produces_score", "EvaluationRun", "Score", "evaluation_feedback"],
      ["metric_measures_run_attempt", "Metric", "RunAttempt", "evaluation_feedback"],
      ["metric_measures_tool_call", "Metric", "ToolCall", "evaluation_feedback"],
      ["score_computed_for_metric", "Score", "Metric", "evaluation_feedback"],
      ["success_criterion_evaluates_task", "SuccessCriterion", "Task", "evaluation_feedback"]
    ] as const;

    for (const [relationId, domain, range, family] of expectedFeedbackRelations) {
      const relation = objectProperties.get(relationId);
      expect([relation?.domain, relation?.range, relation?.family]).toEqual([domain, range, family]);
      expect(relation?.definition.length).toBeGreaterThan(70);
      expect(relation?.source_ids).toEqual(
        expect.arrayContaining(["eng-fw-openai-tracing", "lit-mech-reflexion", "lit-mech-self-refine"])
      );
    }

    expect(objectProperties.get("feeds_back_to")?.definition).toMatch(/legacy summary/i);
    expect(objectProperties.get("maps_benchmark_score_to_metric")?.family).toBe("adapter_mapping");
    expect(classes.get("BenchmarkAdapter")?.definition).toMatch(/benchmark.*pressure|leaderboard|environment/i);

    const localizedDefinitions = [
      ontology.planes.find((plane) => plane.id === "feedback-plane")?.definitions?.zh,
      modules.get("feedback-warning-error")?.definitions?.zh,
      modules.get("feedback-review-optimization")?.definitions?.zh,
      modules.get("feedback-metrics-evaluation")?.definitions?.zh,
      modules.get("feedback-logging")?.definitions?.zh,
      ...[
        "EventSink",
        "TelemetryEvent",
        "TraceExport",
        "AuditLog",
        "Feedback",
        "ReviewFinding",
        "LearningSignal",
        "EvaluationRun",
        "Metric",
        "RiskSignal"
      ].map((classId) => classes.get(classId)?.definitions?.zh)
    ].join("\n");
    const localizedDefinitionsJa = [
      ontology.planes.find((plane) => plane.id === "feedback-plane")?.definitions?.ja,
      modules.get("feedback-warning-error")?.definitions?.ja,
      modules.get("feedback-review-optimization")?.definitions?.ja,
      modules.get("feedback-metrics-evaluation")?.definitions?.ja,
      modules.get("feedback-logging")?.definitions?.ja,
      ...[
        "EventSink",
        "TelemetryEvent",
        "TraceExport",
        "AuditLog",
        "Feedback",
        "ReviewFinding",
        "LearningSignal",
        "EvaluationRun",
        "Metric",
        "RiskSignal"
      ].map((classId) => classes.get(classId)?.definitions?.ja)
    ].join("\n");

    expect(docs).toContain("可观测性与反馈域");
    expect(docs).toContain("Telemetry, Audit And Export Pipeline Module");
    expect(docs).not.toContain("可观测反馈域");
    expect(localizedDefinitions).toMatch(/遥测|日志|审计|诊断|反馈|审查|指标|评分|学习信号|恢复|安全/);
    expect(localizedDefinitionsJa).toMatch(/テレメトリ|ログ|監査|診断|フィードバック|レビュー|指標|スコア|学習信号|復旧|安全/);
    expect(localizedDefinitions).not.toMatch(/所属平面：|证据源 \d+ 项|工具的注册、发现、匹配|会话、运行、事件、轨迹|标识能够行动|任务规划/);
    expect(localizedDefinitionsJa).not.toMatch(/所属平面：|出典 \d+ 件|ツールの登録|セッション、実行、イベント|行動、観測、認可|タスク計画/);
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
