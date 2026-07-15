import { createHash } from "node:crypto";

import {
  acceptedConceptDisplayLabelViolations,
  conceptGenusDifferentiaViolations,
  preferredConceptGenus,
} from "../../lib/ontology-concept-genus-differentia.mjs";
import { enrichConceptExamplesWithRelations } from "../../lib/ontology-concept-examples.mjs";
import { buildOntologyParentIndexes } from "../../lib/ontology-shared-prefix-audit.mjs";
import { objectEvidenceVolumeMetrics, rewriteObjectEvidenceTree } from "../../lib/ontology-v3-object-evidence.mjs";
import {
  buildBilateralSiblingDifferentia,
  buildBilateralSiblingEvidenceClaims,
} from "./sibling-differentia.mjs";
import { reviewedSharedPrefixSiblingPairs } from "./reviewed-shared-prefix-sibling-pairs.mjs";

const languages = Object.freeze(["zh", "en", "ja"]);
const auditRelativePath = "research/generated/ontology-concept-genus-differentia-audit.json";
const terminalPunctuation = Object.freeze({ zh: "。", en: ".", ja: "。" });
const pronouns = Object.freeze({ zh: "它", en: "it", ja: "それ" });

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const firstSentenceParts = (value, language) => {
  const text = value.trim();
  if (language === "en") {
    const match = text.match(/^.*?[.!?](?=\s|$)/u);
    if (!match) return { first: text, remainder: "" };
    return {
      first: match[0].replace(/[.!?]+$/u, "").trim(),
      remainder: text.slice(match[0].length).trim(),
    };
  }
  const terminatorIndex = text.search(/[。！？]/u);
  return terminatorIndex < 0
    ? { first: text, remainder: "" }
    : {
        first: text.slice(0, terminatorIndex).trim(),
        remainder: text.slice(terminatorIndex + 1).trim(),
      };
};

const replaceLabelWithPronoun = ({ value, label, language }) => {
  const expression = language === "en"
    ? new RegExp(`^(?:(?:a|an|the)\\s+)?${escapeRegExp(label)}(?=\\s|[,;:]|$)`, "iu")
    : new RegExp(`^${escapeRegExp(label)}`, "u");
  const replaced = value.replace(expression, pronouns[language]);
  if (replaced !== value) return { value: replaced, replaced: true };
  const subjectPattern = language === "en"
    ? /^(.{1,72}?)\s+(is|are|accepts|aligns|applies|assigns|binds|bounds|captures|checks|classifies|compares|contains|defines|describes|determines|emits|evaluates|executes|exposes|forms|governs|groups|identifies|links|maps|marks|measures|organizes|points|produces|projects|provides|reads|records|references|reifies|represents|resolves|retains|routes|selects|sets|specifies|states|stores|subscribes|summarizes|tracks|translates|uses|validates)\b/iu
    : language === "zh"
      ? /^([^，,；;：:]{1,28}?)(是|为|指|记录|描述|规定|表示|映射|产生|执行|使用|包含|引用)/u
      : /^([^、，,；;：:]{1,40}?)(?:は|が)[、，,]?/u;
  const subjectMatch = value.match(subjectPattern);
  if (!subjectMatch) return { value, replaced: false };
  const semanticKey = (text) => text.normalize("NFKC").toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
  const comparableSubject = language === "en"
    ? subjectMatch[1].replace(/^(?:a|an|the)\s+/iu, "")
    : subjectMatch[1];
  const subjectKey = semanticKey(comparableSubject);
  const labelKey = semanticKey(label);
  if (!labelKey.startsWith(subjectKey) && !subjectKey.startsWith(labelKey)) {
    return { value, replaced: false };
  }
  const predicateStart = subjectMatch[0].slice(subjectMatch[1].length);
  const fallback = language === "en"
    ? `${pronouns.en} ${predicateStart.trimStart()}${value.slice(subjectMatch[0].length)}`
    : `${pronouns[language]}${predicateStart}${value.slice(subjectMatch[0].length)}`;
  return { value: fallback, replaced: true };
};

const extractConceptFact = ({ value, language }) => {
  const markerPatterns = language === "en"
    ? [
        /\b(?:its differentiating condition is that|whose defining condition is that|is distinguished by the fact that)\s+(.+)$/iu,
        /\bdiffers\s+from\s+broader\s+members\s+in\s+that\s+(.+)$/iu,
      ]
    : language === "zh"
      ? [
          /(?:区分条件是|区别于其他同类对象的条件是|由这一事实区分|区分特征是)[：:]\s*(.+)$/u,
        ]
      : [
          /(?:次の条件により他の対象と区別されます|次の事実を(?:種差|定義条件)とします|次の事実を定義条件とする対象です)[：:]\s*(.+)$/u,
        ];
  const extracted = markerPatterns
    .map((pattern) => value.match(pattern)?.[1])
    .find((candidate) => typeof candidate === "string") ?? value;
  if (language === "en") {
    return extracted
      .replace(/^(?:a|an)\s+(?=(?:it|this|that|they)\b)/iu, "")
      .replace(/\b(?:a|an)\s+(?=(?:it|this|that|they)\b)/giu, "")
      .trim();
  }
  if (language === "ja") return extracted.replace(/それ定義/gu, "その定義").trim();
  return extracted.replace(/^它族(?=把|将)/u, "它").trim();
};

const englishPredicateStarts = Object.freeze(new Set([
  "accepts", "aligns", "applies", "binds", "bounds", "captures", "checks",
  "classifies", "compares", "contains", "converts", "defines", "describes",
  "determines", "emits", "evaluates", "executes", "exposes", "governs",
  "groups", "identifies", "links", "maps", "marks", "measures", "organizes", "points",
  "produces", "projects", "provides", "records", "references", "reifies", "represents",
  "resolves", "retains", "routes", "selects", "sets", "specifies", "states", "stores",
  "subscribes", "summarizes", "tracks", "translates", "uses", "validates", "assigns",
  "reads", "forms",
]));

const normalizeEnglishPronounClause = (value) => {
  const normalized = value
    .replace(/^It\b/u, "it")
    .replace(/^The\b/u, "the")
    .replace(/^it\s+that\s+(?=[a-z-]+(?:s|es)\b)/iu, "it ")
    .replace(/^it\s+considered\b/iu, "it is considered")
    .replace(/^it\s+returned\s+by\b/iu, "it is returned by")
    .replace(/^it\s+representing\b/iu, "it represents")
    .replace(/^it\s+mapping\b/iu, "it maps")
    .replace(/^it\s+recording\b/iu, "it records")
    .replace(/^it\s+retaining\b/iu, "it retains")
    .replace(/^it\s+carrying\b/iu, "it carries")
    .replace(/^it\s+linking\b/iu, "it links")
    .replace(/^it\s+describing\b/iu, "it describes")
    .replace(/^it\s+producing\b/iu, "it produces")
    .replace(/^it\s+evaluating\b/iu, "it evaluates")
    .replace(/^it\s+executing\b/iu, "it executes");
  const bareNoun = normalized.match(
    /^it\s+(artifact|capability|collection|event|family|information|process|record|request|resource|response|result|role|specification|state)\b/iu,
  )?.[1];
  if (!bareNoun) return normalized;
  const article = /^[aeiou]/iu.test(bareNoun) ? "an" : "a";
  return normalized.replace(/^it\s+/iu, `it is ${article} `);
};

const englishFactClause = (value, labelWasReplaced) => {
  if (labelWasReplaced || /^(?:it|this|that|they|these|those|the)\b/iu.test(value)) {
    return normalizeEnglishPronounClause(value);
  }
  const firstWord = value.match(/^[A-Za-z-]+/u)?.[0].toLocaleLowerCase() ?? "";
  if (englishPredicateStarts.has(firstWord)) return `it ${value}`;
  if (/^(?:a|an)\b/iu.test(value)) {
    return `it is ${value.charAt(0).toLocaleLowerCase()}${value.slice(1)}`;
  }
  if (/^returned\s+by\b/iu.test(value)) return `it is ${value}`;
  if (/^one\b/iu.test(value)) return `it is ${value}`;
  const predicate =
    "is|are|has|have|accepts|asks|binds|bounds|captures|checks|classifies|compares|contains|creates|defines|denotes|describes|emits|evaluates|executes|exposes|forms|identifies|links|maps|produces|provides|reads|records|recommends|represents|resolves|retains|routes|selects|stores|terminates|tracks|uses|validates|yields";
  const canonicalSubjectClause =
    new RegExp(`^[A-Z][A-Za-z0-9_-]*\\b.{0,90}?\\b(?:${predicate})\\b`, "u").test(value);
  const explicitSubjectClause = canonicalSubjectClause ||
    new RegExp(`^(?:the|each|every|this|that|these|those)\\b.{0,90}?\\b(?:${predicate})\\b`, "iu").test(value);
  if (explicitSubjectClause) {
    return canonicalSubjectClause
      ? value
      : `${value.charAt(0).toLocaleLowerCase()}${value.slice(1)}`;
  }
  const article = /^[aeiou]/iu.test(firstWord) ? "an" : "a";
  return `it is ${article} ${value}`;
};

const stableVariant = (conceptId, language) =>
  [...`${conceptId}:${language}`].reduce((sum, character) => sum + character.codePointAt(0), 0) % 4;

const englishArticle = (value) => /^[aeiou]/iu.test(value.trim()) ? "an" : "a";

const composeFirstSentence = ({ concept, genus, language, originalFirst }) => {
  const label = concept.labels[language].trim();
  const genusLabel = genus.labels[language].trim();
  const factReplacement = replaceLabelWithPronoun({
    value: originalFirst,
    label,
    language,
  });
  const fact = language === "en"
    ? englishFactClause(factReplacement.value, factReplacement.replaced)
    : factReplacement.value;
  const variant = stableVariant(concept.id, language);
  if (language === "zh") {
    return [
      `${label}是一种${genusLabel}；其区分条件是：${fact}`,
      `作为${genusLabel}，${label}由这一事实区分：${fact}`,
      `${label}属于${genusLabel}，区别于其他同类对象的条件是：${fact}`,
      `${label}是以如下事实为区分特征的${genusLabel}：${fact}`,
    ][variant];
  }
  if (language === "en") {
    const displayLabel = `${label.charAt(0).toLocaleUpperCase()}${label.slice(1)}`;
    const article = englishArticle(genusLabel);
    return [
      `${displayLabel} is ${article} ${genusLabel}; its differentiating condition is that ${fact}`,
      `As ${article} ${genusLabel}, ${displayLabel} is distinguished by the fact that ${fact}`,
      `${displayLabel} belongs to the ${genusLabel} category and differs from broader members in that ${fact}`,
      `${displayLabel} is ${article} ${genusLabel} whose defining condition is that ${fact}`,
    ][variant];
  }
  return [
    `${label}は${genusLabel}の一種であり、次の条件で区別されます：${fact}`,
    `${genusLabel}に属する${label}は、次の事実を種差とします：${fact}`,
    `${label}は${genusLabel}として、次の条件により他の対象と区別されます：${fact}`,
    `${label}は${genusLabel}のうち、次の事実を定義条件とする対象です：${fact}`,
  ][variant];
};

const replaceLocalizedNarratives = ({ value, replacements }) => {
  if (Array.isArray(value)) {
    return value.map((item) => replaceLocalizedNarratives({ value: item, replacements }));
  }
  if (!value || typeof value !== "object") {
    if (typeof value !== "string") return value;
    return replacements.reduce(
      (result, { from, to }) => from.length > 0 ? result.replaceAll(from, to) : result,
      value,
    );
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      replaceLocalizedNarratives({ value: child, replacements }),
    ]),
  );
};

const definitionHash = (concepts) => createHash("sha256")
  .update(JSON.stringify(
    concepts
      .filter(({ status }) => status === "accepted")
      .map(({ id, definitions }) => [id, definitions])
      .sort(([left], [right]) => left.localeCompare(right, "en")),
  ))
  .digest("hex");

const violationSnapshot = ({ classes, relations }) => {
  const violations = conceptGenusDifferentiaViolations({ classes, relations });
  const invalidConceptIds = new Set(violations.map(({ conceptId }) => conceptId));
  const accepted = classes.filter(({ status }) => status === "accepted");
  const semanticKinds = [...new Set(accepted.map(({ semantic_kind: kind }) => kind))].sort();
  return {
    definition_sha256: definitionHash(classes),
    accepted_concept_count: accepted.length,
    invalid_concept_count: invalidConceptIds.size,
    localized_violation_count: violations.length,
    display_label_collision_count: acceptedConceptDisplayLabelViolations(classes).length,
    invalid_by_semantic_kind: Object.fromEntries(semanticKinds.map((kind) => [
      kind,
      new Set(
        violations
          .filter(({ conceptId }) => classes.find(({ id }) => id === conceptId)?.semantic_kind === kind)
          .map(({ conceptId }) => conceptId),
      ).size,
    ])),
  };
};

const workerCapabilityEvidenceLabels = Object.freeze({
  zh: "工作者能力匹配证据",
  en: "worker capability-match evidence",
  ja: "作業者能力一致証拠",
});

const reviewedDefinitionRestorations = Object.freeze({
  ChunkCompression: Object.freeze({
    zh: "分块压缩活动是一种分块处理活动（ChunkProcessingActivity），在保留来源锚点的前提下压缩一个或多个分块并产生新的 Chunk；压缩输出仍是分块，不是活动本身。",
    en: "Chunk compression is a ChunkProcessingActivity that compresses one or more chunks while preserving source anchors and produces a new Chunk; the compressed output remains a chunk rather than the activity itself.",
    ja: "チャンク圧縮活動はチャンク処理活動（ChunkProcessingActivity）の一種で、出典アンカーを保持しながら一つ以上のチャンクを圧縮して新しい Chunk を生成します。圧縮出力は活動そのものではなく、引き続きチャンクです。",
  }),
  SimilarityScore: Object.freeze({
    en: "A SimilarityScore is a RetrievalScore that represents semantic similarity between a query and a candidate memory record or chunk, usually derived from embedding distance or vector similarity.",
  }),
  Conversation: Object.freeze({
    en: "A Conversation is a collection that groups ordered message turns, instructions, tool observations, and context packages under one dialogue or thread identity.",
    ja: "会話は集合の一種であり、同じ対話またはスレッド識別子に属する順序付きメッセージターン、指示、ツール観測、コンテキストパッケージを束ねます。",
  }),
  ContextWindow: Object.freeze({
    zh: "上下文窗口是一种上下文产物（ContextArtifact），表示一次模型调用或智能体步骤可见的有界集合，包括指令、消息、已检索分块、记忆记录、摘要、工具结果和产物。",
    en: "Context window belongs to the context artifact category and differs from broader members in that it is the bounded set of instructions, messages, retrieved chunks, memory records, summaries, tool results, and artifacts visible to one model call or agent step.",
    ja: "コンテキスト窓はコンテキスト情報成果物（ContextArtifact）の一種で、一回のモデル呼び出しまたはエージェントステップから見える、指示、メッセージ、検索済みチャンク、記憶レコード、要約、ツール結果、成果物の境界付き集合を表します。",
  }),
  Database: Object.freeze({
    zh: "数据库资源是一种可摄入资源，表示可通过来源引用定位的数据库表面，其行或查询结果可作为上下文证据。",
    en: "A Database is an ingestible resource that represents a data-store surface whose rows or query results can be located through source references and used as context evidence.",
    ja: "データベース資源は取込可能資源の一種であり、出典参照によって位置付けられるデータベース面を表し、その行または問い合わせ結果をコンテキスト証拠として利用できます。",
  }),
  DatabaseRow: Object.freeze({
    en: "A DatabaseRow is ingestible information representing a database row or query-result row that can be addressed through a source reference subject to policy and provenance.",
  }),
  InboundResponse: Object.freeze({
    en: "An InboundResponse is an information record that records a response returned across a boundary, including its origin, response data zone, status, tool or protocol context, injection-scan result, and disclosure handling.",
  }),
  SOCKSProxy: Object.freeze({
    en: "A SOCKSProxy is a proxy endpoint that represents a SOCKS route used to mediate network egress while preserving policy, target, credential, and audit metadata.",
  }),
  Synthesis: Object.freeze({
    zh: "综合活动是一种组合聚合活动（CompositionAggregationActivity），把多个输入、证据或中间结果合并为新的结论、产物或决策，并保留输入到输出的可追溯关系。",
    en: "Synthesis is a Composition aggregation activity (AggregationActivity) that combines multiple inputs, evidence items, or intermediate results into a new conclusion, artifact, or decision while preserving input-to-output traceability.",
    ja: "統合活動は構成集約活動（CompositionAggregationActivity）の一種で、複数の入力、証拠、中間結果を新しい結論、成果物、または判断へまとめ、入力から出力への追跡可能性を保持します。",
  }),
  Warning: Object.freeze({
    en: "A Warning is a DiagnosticSignal that records degraded confidence, policy concern, risky context, partial execution, or a recoverable runtime issue as a non-fatal observable signal without claiming final failure.",
    ja: "警告は診断信号の一種であり、最終的な失敗とは断定せずに、信頼度低下、ポリシー上の懸念、危険な文脈、部分実行、または復旧可能な実行問題を記録する非致命的な観測信号です。",
  }),
  Representation: Object.freeze({
    zh: "表示是一种信息记录，保存表征方法、生成来源、版本与目标对象，可采用 Embedding 或其他向量、结构形式；它不同于生成活动、承载索引和目标 Chunk 或 MemoryRecord。",
    en: "A Representation is an information record that retains an encoding method, generation provenance, version, and represented object and may use an Embedding or another vector or structured form; it is distinct from its generating activity, hosting index, and target Chunk or MemoryRecord.",
    ja: "表現は情報記録の一種であり、符号化方式、生成来歴、版、対象を保持し、Embedding または別のベクトル・構造形式を取れます。生成活動、保持索引、対象となる Chunk や MemoryRecord とは別の情報です。",
  }),
  Candidate: Object.freeze({
    zh: "候选记录是一种信息记录，表示在特定查询和发现活动中被考虑的对象，并保留对象引用、来源和初步适用性；成为候选不意味着已被选择或获准执行。",
    en: "A Candidate Record is an information record that represents an object considered under a particular query and discovery activity, retaining its reference, source, and preliminary applicability; candidacy does not imply selection or execution authorization.",
    ja: "候補レコードは情報記録の一種で、特定のクエリと発見活動で検討される対象を表し、対象参照、出典、初期適合性を保持します。候補であることは、選択済みまたは実行認可済みであることを意味しません。",
  }),
  CandidateSet: Object.freeze({
    zh: "候选集合是一种检索集合，包含一次查询在过滤、评分、重排、Top-K 选择或上下文纳入之前产生的有界候选项。",
    ja: "候補集合は検索集合の一種であり、フィルタリング、採点、再順位付け、Top-K 選択、または文脈組み込みの前に一つのクエリから生成された境界付き候補を含みます。",
  }),
  Execution: Object.freeze({
    ja: "実行は活動の一種であり、参加者が実行環境で計画または呼び出し仕様に従って作業し、観測可能な結果を生みます。",
  }),
  Invocation: Object.freeze({
    zh: "调用活动是一种活动，由调用者针对目标操作绑定参数并发起；它受计划约束，可包含一个或多个 Attempt，但不等同于 Attempt、Result 或 Outcome。",
    ja: "呼び出し活動は活動の一種であり、呼び出し元が対象操作へ引数を束縛して開始します。計画に制約され、一つ以上の Attempt を持てますが、Attempt、Result、Outcome そのものではありません。",
  }),
  LogRecord: Object.freeze({
    en: "A LogRecord is a LogArtifact that stores a structured record derived from a trace, span, event, diagnostic message, warning, error, tool result, or audit-relevant observation.",
  }),
  Measurement: Object.freeze({
    en: "A Measurement is an information record that references a Metric definition, measured subject, EvaluationRun, unit, value, time, confidence, and provenance; the Metric is reusable while each observed value has independent identity.",
  }),
  MCPElicitation: Object.freeze({
    zh: "MCP 引导交互是一种 MCP 请求（MCPRequest），用于在进行中的协议交互内，由 MCP 服务器请求客户端或用户提供附加输入（AdditionalInput）；该请求发生于 MCPInteraction 中，并受客户端同意与策略约束。",
    en: "MCP Elicitation is an MCP request (MCPRequest) in which an MCP server asks a client or user for AdditionalInput during an active MCPInteraction, subject to client consent and policy.",
    ja: "MCP 誘導対話は MCP 要求（MCPRequest）の一種であり、進行中の MCPInteraction 内で MCP サーバーがクライアントまたはユーザーへ追加入力（AdditionalInput）を求め、クライアントの同意とポリシーに従う要求です。",
  }),
  PromptTemplateInstance: Object.freeze({
    en: "A PromptTemplateInstance is an information record that stores one filled prompt template with bindings, source references, and authority metadata used in a context package.",
  }),
  Index: Object.freeze({
    en: "An Index is an entity that provides a versioned retrieval structure with a retrieval kind, configuration identity, and input-representation requirements; IndexVersion identifies each build, part_of connects shards and entries, and hosts connects backend databases.",
  }),
  SparseVector: Object.freeze({
    en: "A SparseVector is a VectorRepresentation using weighted token, term, or feature dimensions for lexical or hybrid retrieval over memory records and chunks.",
  }),
  Checkpoint: Object.freeze({
    zh: "检查点是一种状态记录（StateRecord），保存会话、版本、创建活动、状态摘要和所引用的 StateSnapshot；捕获动作由 CheckpointActivity 执行，而该记录本身不修改或生成状态。",
    en: "A Checkpoint is a StateRecord that stores session, version, creating activity, state digest, and referenced StateSnapshot; CheckpointActivity performs capture, while the record itself neither mutates nor generates state.",
  }),
  DomainSocket: Object.freeze({
    zh: "域套接字是一种套接字端点，记录本地进程间通信表面，并明确其边界、权限、凭据与沙箱影响。",
    en: "A DomainSocket is a Socket that records use of a local inter-process communication endpoint whose boundary, permission, credential, and sandbox implications must be explicit.",
    ja: "ドメインソケットはソケット端点の一種であり、ローカルなプロセス間通信面の利用を記録し、その境界、権限、資格情報、サンドボックス上の含意を明示します。",
  }),
  OutboundRequest: Object.freeze({
    en: "An OutboundRequest is an information record that stores a boundary-crossing request from a tool, sandbox, protocol adapter, or remote-agent interaction, including target endpoint, method, credential scope, data zone, and policy decision.",
  }),
  APIOperation: Object.freeze({
    en: "An APIOperation is a ToolCapability representing an external API action with a method, endpoint, arguments schema, result schema, authentication requirements, side-effect expectations, and observable invocation result.",
  }),
  CapabilityDescriptor: Object.freeze({
    en: "A CapabilityDescriptor is a ToolMetadata record that provides a machine-readable account of operation identity, schema surface, trust metadata, permission requirements, discovery labels, and protocol exposure for a tool, resource, prompt, or API operation.",
  }),
  FunctionTool: Object.freeze({
    en: "A FunctionTool is a Tool whose invocation is described by a callable name, arguments schema, return schema, and host-side implementation.",
  }),
  HostedTool: Object.freeze({
    en: "A HostedTool is a Tool backed by an external service or provider-managed runtime whose execution surface is invoked through a registry or protocol connector.",
  }),
  LocalRuntimeTool: Object.freeze({
    en: "A LocalRuntimeTool is a Tool that executes through a host-controlled process, shell, computer-control, code, browser, or container surface.",
  }),
  ResourceTemplate: Object.freeze({
    en: "A ResourceTemplate is a ResourceDefinition that binds variables to resource URIs or selectors so a parameterized family of related resources can be discovered and read safely.",
  }),
  Task: Object.freeze({
    zh: "任务是一种工作规约（WorkSpecification），以 task_id 标识一项可分派工作，并用状态、优先级、约束与完成标准描述尚待实现的工作；一次具体执行由 RunAttempt 表示。",
    en: "A Task is a WorkSpecification identified by task_id that describes assignable work through status, priority, constraints, and completion criteria; one concrete execution is represented by a RunAttempt.",
    ja: "タスクは作業仕様（WorkSpecification）の一種で、task_id により割当可能な作業を識別し、状態、優先度、制約、完了基準によって未実現の作業を記述します。一回の具体的な実行は RunAttempt で表します。",
  }),
  ToolCandidate: Object.freeze({
    en: "A Tool Candidate is a Candidate Record (Candidate) whose considered object is a Tool and whose matching evidence is represented by ToolMatch-assesses-ToolCandidate.",
  }),
  Tool: Object.freeze({
    zh: "工具是一种实体，以可调用能力的形式公开 API 操作（APIOperation），在工具定义与权限约束下接收参数，并在被调用时产生可观测结果。",
    en: "A Tool is an entity that exposes an APIOperation as a callable capability, accepts arguments under its tool definition and permission constraints, and yields an observable result when invoked.",
    ja: "ツールは実体の一種で、呼び出し可能な能力として API 操作（APIOperation）を公開し、ツール定義と権限制約の下で引数を受け取り、呼び出し時に観測可能な結果を生成します。",
  }),
  ToolCandidateSet: Object.freeze({
    zh: "工具候选集是一种发现候选集合（DiscoveryCandidateSet），其成员限定为通过 ToolCandidateSet-contains-ToolCandidate 关系连接的工具候选（ToolCandidate）。",
    en: "A Tool Candidate Set is a Discovery Candidate Set (DiscoveryCandidateSet) whose members are ToolCandidate records connected through ToolCandidateSet-contains-ToolCandidate.",
  }),
  ToolEmbeddingMatch: Object.freeze({
    zh: "工具嵌入匹配是一种工具匹配评估（ToolMatch），其判定证据限定为搜索查询与工具表征之间的向量相似度。",
    en: "A Tool Embedding Match is a Tool Match Assessment (ToolMatch) whose evidence is vector similarity between a search query and a tool representation.",
    ja: "ツール埋め込み照合はツール適合評価（ToolMatch）の一種で、検索クエリとツール表現のベクトル類似度を判定根拠とします。",
  }),
  ToolMatch: Object.freeze({
    zh: "工具匹配评估是一种匹配评估（MatchAssessment），使用名称、签名、嵌入、正则表达式或任务适配证据，评估工具候选（ToolCandidate）与工具（Tool）的匹配程度。",
    en: "A Tool Match Assessment is a Match Assessment (MatchAssessment) that evaluates a ToolCandidate against a Tool using name, signature, embedding, regular-expression, or task-fit evidence.",
    ja: "ツール適合評価は適合評価（MatchAssessment）の一種で、名前、シグネチャ、埋め込み、正規表現、またはタスク適合性の根拠を用いてツール候補（ToolCandidate）とツール（Tool）の適合度を評価します。",
  }),
  ToolRegexMatch: Object.freeze({
    zh: "工具正则匹配是一种工具匹配评估（ToolMatch），其判定证据限定为查询与工具元数据之间的正则表达式匹配。",
    en: "A Tool Regex Match is a Tool Match Assessment (ToolMatch) whose evidence is a regular-expression match over a query and tool metadata.",
    ja: "ツール正規表現照合はツール適合評価（ToolMatch）の一種で、クエリとツールメタデータに対する正規表現の一致を判定根拠とします。",
  }),
  ToolSearch: Object.freeze({
    zh: "工具检索是一种发现活动（DiscoveryActivity），消费工具搜索查询（ToolSearchQuery），检索工具定义（ToolDefinition），并产出工具候选集（ToolCandidateSet）。",
    en: "A Tool Search is a Discovery activity (DiscoveryActivity) that consumes a ToolSearchQuery and produces a ToolCandidateSet by retrieving ToolDefinition records.",
    ja: "ツール検索は発見活動（DiscoveryActivity）の一種で、ツール検索クエリ（ToolSearchQuery）を消費し、ツール定義（ToolDefinition）を検索してツール候補集合（ToolCandidateSet）を生成します。",
  }),
  ToolSelectionDecision: Object.freeze({
    en: "A ToolSelectionDecision is a SelectionDecision that considers ToolMatch evidence and either selects a Tool or rejects a ToolCandidate.",
    ja: "ツール選択決定は選択決定（SelectionDecision）の一種で、ツール適合評価（ToolMatch）の根拠を検討し、ツール（Tool）を選択するかツール候補（ToolCandidate）を棄却します。",
  }),
  ExecutionResult: Object.freeze({
    zh: "执行结果是一种调用返回记录（InvocationResult），对应一次执行请求（ExecutionRequest），承载可观测输出、错误流、退出状态或产物引用，但不据此断言任务成功。",
    en: "An ExecutionResult is an InvocationResult for an ExecutionRequest that carries observable output, error stream, exit status, or artifact references without asserting task success.",
    ja: "実行結果は呼び出し返却記録（InvocationResult）の一種で、実行要求（ExecutionRequest）に対応し、観測可能な出力、エラーストリーム、終了状態、または成果物参照を保持しますが、タスク成功を表明しません。",
  }),
  ProgrammaticToolCall: Object.freeze({
    en: "A ProgrammaticToolCall is a ToolCall initiated by generated code, runtime orchestration, or explicit API logic rather than direct natural-language selection.",
    ja: "プログラム型ツール呼び出しはツール呼び出し（ToolCall）の一種で、直接の自然言語選択ではなく、生成コード、ランタイム編成、または明示的な API ロジックから開始されます。",
  }),
  ToolCall: Object.freeze({
    zh: "工具调用是一种调用活动（Invocation），标识调用者与操作、提供参数并请求已选择的工具（Tool）；call_id、requested_at、operation_id 与 idempotency_key 使该请求可追踪且可安全重放。",
    ja: "ツール呼び出しは呼び出し活動（Invocation）の一種で、呼び出し元と操作を識別し、引数を渡して選択済みツール（Tool）を要求し、call_id、requested_at、operation_id、idempotency_key により追跡可能性と安全な再実行を確保します。",
  }),
  ToolCallAttempt: Object.freeze({
    en: "A ToolCallAttempt is an InvocationAttempt that records one execution attempt of a ToolCall, identified by attempt_id and attempt_number, with status, timing, authorization, sandbox, and result context.",
    ja: "ツール呼び出し試行は呼び出し試行（InvocationAttempt）の一種で、ツール呼び出し（ToolCall）の一回の実行を記録し、attempt_id と attempt_number で試行を識別して状態、時刻、認可、サンドボックス、結果の文脈を保持します。",
  }),
  ToolCallRetry: Object.freeze({
    en: "A Tool Call Retry is a Tool Call Attempt (ToolCallAttempt) initiated to retry a prior ToolCallAttempt after a retryable failure or policy decision and linked by ToolCallRetry-retries-ToolCallAttempt.",
  }),
  ToolResult: Object.freeze({
    zh: "工具结果是一种调用返回记录（InvocationResult），由工具调用尝试（ToolCallAttempt）产生，以 result_id、status、received_at 与 payload_digest 标识，并承载输出、错误、警告或元数据，但不据此断言任务成功。",
    en: "A ToolResult is an InvocationResult produced by a ToolCallAttempt, identified by result_id, status, received_at, and payload_digest, and carrying output, error, warning, or metadata without asserting task success.",
    ja: "ツール結果は呼び出し返却記録（InvocationResult）の一種で、ツール呼び出し試行（ToolCallAttempt）が生成し、result_id、status、received_at、payload_digest で識別され、出力、エラー、警告、メタデータを保持しますが、タスク成功を表明しません。",
  }),
  ToolDeprecationNotice: Object.freeze({
    zh: "工具弃用通知是一种工具元数据记录（ToolMetadata），用于标识被弃用的工具定义（ToolDefinition）并记录生命周期或替代指引，而不是描述可调用能力本身。",
    en: "A ToolDeprecationNotice is ToolMetadata that identifies a deprecated ToolDefinition and records lifecycle or replacement guidance rather than describing the callable capability itself.",
    ja: "ツール非推奨通知はツールメタデータ記録（ToolMetadata）の一種で、非推奨となるツール定義（ToolDefinition）を識別し、ライフサイクルまたは代替指針を記録しますが、呼び出し可能な能力自体は記述しません。",
  }),
  PatternScan: Object.freeze({
    en: "A PatternScan is a DetectionActivity that examines messages, retrieved chunks, tool results, or other untrusted content for InjectionSignature indicators or policy violations and produces an InjectionScanResult.",
    ja: "パターン走査は検出活動（DetectionActivity）の一種で、メッセージ、検索チャンク、ツール結果、その他の未信頼コンテンツにある注入シグネチャ（InjectionSignature）の兆候またはポリシー違反を検査し、注入スキャン結果（InjectionScanResult）を生成します。",
  }),
  InjectionSignature: Object.freeze({
    zh: "注入特征规范是一种规范，定义用于识别提示注入、工具流操纵或恶意指令传播的检测模式，并作为 scans_for_signature 关系的检测目标。",
    en: "An Injection signature specification is a specification that defines a detection pattern for indicators of prompt injection, tool-stream manipulation, or malicious instruction propagation and serves as the target of scans_for_signature.",
    ja: "注入シグネチャ仕様は仕様の一種で、プロンプトインジェクション、ツールストリーム操作、または悪意ある指示伝播を識別する検出パターンを定義し、scans_for_signature 関係の検出対象となります。",
  }),
  ExternalBoundary: Object.freeze({
    en: "An ExternalBoundary is a TrustBoundary that separates the controlled agent runtime from outside organizations, services, users, or systems.",
  }),
  InternalBoundary: Object.freeze({
    en: "An InternalBoundary is a TrustBoundary that separates trusted runtime components, local stores, or internal services from less-trusted internal execution or data surfaces.",
  }),
  NetworkBoundary: Object.freeze({
    en: "A NetworkBoundary is a TrustBoundary at the transition between the runtime and network-accessible transports, proxies, resources, or remote services.",
  }),
  ToolBoundary: Object.freeze({
    en: "A ToolBoundary is a TrustBoundary where model-controlled intent becomes an executable tool request or where tool output re-enters model-visible context.",
  }),
  ToolTranscript: Object.freeze({
    zh: "工具调用记录是一种日志产物（LogArtifact），按顺序保存工具请求、权限提示、工具调用尝试（ToolCallAttempt）的执行、结果、警告与后续观察。",
    en: "A ToolTranscript is a LogArtifact that preserves the ordered record of tool requests, permission prompts, ToolCallAttempt executions, results, warnings, and follow-up observations.",
    ja: "ツール呼び出し記録はログ情報成果物（LogArtifact）の一種で、ツール要求、権限プロンプト、ツール呼び出し試行（ToolCallAttempt）の実行、結果、警告、後続観測を順序どおり保持します。",
  }),
});

export const createConceptTerminologyPhases = (context) => {
  const {
    fs,
    path,
    ROOT,
    moduleDocuments,
    allConcepts,
    allRelations,
    shortDefinition,
    stageFile,
    stableJson,
    deferConceptTerminologyObjectEvidenceRewrite = false,
  } = context;

  const completeConceptGenusDifferentia = () => {
    const beforeClasses = [...allConcepts().values()];
    const relations = [...allRelations().values()];
    const before = violationSnapshot({ classes: beforeClasses, relations });
    const transformedConceptIds = new Set();
    let transformedLocalizedDefinitionCount = 0;

    const definitionsBeforeRestorationById = new Map();
    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((inputConcept) => {
        if (inputConcept.status !== "accepted") return structuredClone(inputConcept);
        const originalLabels = structuredClone(inputConcept.labels);
        const desiredLabels = inputConcept.id === "WorkerCapabilityMatch"
          ? workerCapabilityEvidenceLabels
          : inputConcept.labels;
        const concept = inputConcept.id === "WorkerCapabilityMatch"
          ? replaceLocalizedNarratives({
              value: inputConcept,
              replacements: languages.map((language) => ({
                from: originalLabels[language],
                to: desiredLabels[language],
              })),
            })
          : structuredClone(inputConcept);
        concept.labels = structuredClone(desiredLabels);
        const definitionsBeforeRestoration = structuredClone(concept.definitions);
        definitionsBeforeRestorationById.set(concept.id, definitionsBeforeRestoration);
        const restoration = reviewedDefinitionRestorations[concept.id] ?? {};
        concept.definitions = { ...concept.definitions, ...restoration };
        return concept;
      });
    }

    const preparedClasses = [...allConcepts().values()];
    const violatingLanguagesByConcept = new Map();
    for (const { conceptId, language } of conceptGenusDifferentiaViolations({
      classes: preparedClasses,
      relations,
    })) {
      violatingLanguagesByConcept.set(conceptId, new Set([
        ...(violatingLanguagesByConcept.get(conceptId) ?? []),
        language,
      ]));
    }
    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((inputConcept) => {
        if (inputConcept.status !== "accepted") return structuredClone(inputConcept);
        let concept = structuredClone(inputConcept);
        const violatingLanguages = violatingLanguagesByConcept.get(concept.id) ?? new Set();
        const genus = preferredConceptGenus({
          concept,
          classes: preparedClasses,
          relations,
        });
        if (!genus) throw new Error(`No reviewed genus is available for Concept ${concept.id}`);
        const previousDefinitions = structuredClone(concept.definitions);
        const definitions = Object.fromEntries(languages.map((language) => {
          if (!violatingLanguages.has(language)) return [language, concept.definitions[language]];
          const parts = firstSentenceParts(concept.definitions[language], language);
          const first = composeFirstSentence({
            concept,
            genus,
            language,
            originalFirst: extractConceptFact({
              value: parts.first,
              language,
            }),
          });
          const rewritten = `${first}${terminalPunctuation[language]}${parts.remainder ? ` ${parts.remainder}` : ""}`;
          transformedLocalizedDefinitionCount += 1;
          transformedConceptIds.add(concept.id);
          return [language, rewritten];
        }));
        const definitionsBeforeRestoration =
          definitionsBeforeRestorationById.get(concept.id) ?? previousDefinitions;
        const replacements = languages.flatMap((language) => {
          const newDefinition = definitions[language];
          const newFirst = firstSentenceParts(newDefinition, language).first;
          return [definitionsBeforeRestoration[language], previousDefinitions[language]]
            .flatMap((oldDefinition) => [
              { from: oldDefinition, to: newDefinition },
              {
                from: firstSentenceParts(oldDefinition, language).first,
                to: newFirst,
              },
            ]);
        });
        concept = replaceLocalizedNarratives({ value: concept, replacements });
        concept.definitions = definitions;
        concept.short_definitions = shortDefinition(definitions);
        if (concept.id === "WorkerCapabilityMatch") {
          concept.change_note = {
            zh: "工作者能力匹配证据以信息记录身份保留需求、候选能力、权限与匹配依据；其标签与执行匹配活动明确区分。",
            en: "Worker capability-match evidence retains requirements, candidate capability, authority, and matching rationale as an information record; its label is distinct from the matching activity.",
            ja: "作業者能力一致証拠は要件、候補能力、権限、照合根拠を情報記録として保持し、照合活動とはラベルを明確に区別します。",
          };
        }
        return concept;
      });
    }

    const rewrittenClasses = [...allConcepts().values()];
    const enrichedById = new Map(
      enrichConceptExamplesWithRelations({
        concepts: rewrittenClasses,
        relations,
      }).map((concept) => [concept.id, concept]),
    );
    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((concept) =>
        enrichedById.get(concept.id) ?? concept,
      );
    }

    const conceptById = allConcepts();
    const parentIndexes = buildOntologyParentIndexes({
      concepts: [...conceptById.values()], relations,
    });
    const acceptedBackboneRelation = (concept, parentId) => relations
      .filter((relation) =>
        relation.status === "accepted" &&
        (
          (
            relation.predicate === "is_a" &&
            relation.source_id === concept.id &&
            relation.target_id === parentId
          ) ||
          (
            relation.layout_role === "primary-backbone" &&
            relation.layout_child_id === concept.id &&
            relation.layout_parent_id === parentId
          )
        ),
      )
      .sort((left, right) => {
        const leftPrimary = left.id === concept.primary_parent_relation_id ? 0 : 1;
        const rightPrimary = right.id === concept.primary_parent_relation_id ? 0 : 1;
        return leftPrimary - rightPrimary || left.id.localeCompare(right.id, "en");
      })[0] ?? null;
    const sharedParentId = (left, right) => {
      const taxonomyParentId = parentIndexes.taxonomy_parent_by_concept_id[left.id] ?? null;
      if (
        taxonomyParentId &&
        taxonomyParentId === parentIndexes.taxonomy_parent_by_concept_id[right.id]
      ) return taxonomyParentId;
      const logicalParentId = parentIndexes.logical_parent_by_concept_id[left.id] ?? null;
      return logicalParentId &&
        logicalParentId === parentIndexes.logical_parent_by_concept_id[right.id]
        ? logicalParentId
        : null;
    };
    const pairKey = (leftId, rightId) => [leftId, rightId]
      .sort((left, right) => left.localeCompare(right, "en"))
      .join("\0");
    const existingPairKeys = new Set(
      [...conceptById.values()].flatMap((concept) =>
        (concept.sibling_differentiation ?? []).map((contract) =>
          pairKey(concept.id, contract.sibling_concept_id),
        ),
      ),
    );
    const siblingAdditionsByConceptId = new Map();
    for (const [leftId, rightId] of reviewedSharedPrefixSiblingPairs) {
      const left = conceptById.get(leftId);
      const right = conceptById.get(rightId);
      if (!left && !right) continue;
      if (left?.status !== "accepted" || right?.status !== "accepted") {
        throw new Error(`Reviewed sibling pair ${leftId} / ${rightId} must resolve to accepted Concepts`);
      }
      const parentId = sharedParentId(left, right);
      const leftBackbone = acceptedBackboneRelation(left, parentId);
      const rightBackbone = acceptedBackboneRelation(right, parentId);
      if (!parentId || !leftBackbone || !rightBackbone) {
        throw new Error(
          `Reviewed sibling pair ${leftId} / ${rightId} must share an accepted taxonomy or primary-backbone parent`,
        );
      }
      const key = pairKey(leftId, rightId);
      if (existingPairKeys.has(key)) continue;
      siblingAdditionsByConceptId.set(leftId, [
        ...(siblingAdditionsByConceptId.get(leftId) ?? []),
        {
          sibling_concept_id: rightId,
          shared_parent_concept_id: parentId,
        },
      ]);
      existingPairKeys.add(key);
    }
    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((concept) => ({
        ...concept,
        sibling_differentiation: [
          ...(concept.sibling_differentiation ?? []),
          ...(siblingAdditionsByConceptId.get(concept.id) ?? []),
        ],
      }));
    }

    let synchronizedSiblingContractCount = 0;
    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((concept) => {
        if (concept.status !== "accepted") return structuredClone(concept);
        return {
          ...concept,
          sibling_differentiation: (concept.sibling_differentiation ?? []).map((contract, contractIndex) => {
          const sibling = conceptById.get(contract.sibling_concept_id);
          const parent = conceptById.get(contract.shared_parent_concept_id);
          if (sibling?.status !== "accepted" || parent?.status !== "accepted") {
            return structuredClone(contract);
          }
          const conceptBackbone = acceptedBackboneRelation(
            concept,
            contract.shared_parent_concept_id,
          );
          const siblingBackbone = sibling
            ? acceptedBackboneRelation(sibling, contract.shared_parent_concept_id)
            : null;
          if (!sibling || !parent || !conceptBackbone || !siblingBackbone) {
            throw new Error(
              `Cannot synchronize sibling contract ${concept.id} -> ${contract.sibling_concept_id}`,
            );
          }
          synchronizedSiblingContractCount += 1;
          return {
            ...contract,
            differentia: buildBilateralSiblingDifferentia({
              concept,
              sibling,
              parent,
              conceptBackboneRelationId: conceptBackbone.id,
              siblingBackboneRelationId: siblingBackbone.id,
            }),
            source_claims: buildBilateralSiblingEvidenceClaims({
              concept,
              sibling,
              path: `$.sibling_differentiation[${contractIndex}]`,
            }),
          };
          }),
        };
      });
    }

    if (!deferConceptTerminologyObjectEvidenceRewrite) {
      for (const { document } of moduleDocuments.values()) {
        document.classes = document.classes.map((concept) =>
          concept.status === "accepted" && (concept.source_claims?.length ?? 0) > 0
            ? rewriteObjectEvidenceTree({ record: concept })
            : structuredClone(concept),
        );
      }
    }

    const afterClasses = [...allConcepts().values()];
    const after = violationSnapshot({ classes: afterClasses, relations });
    if (
      after.invalid_concept_count !== 0 ||
      after.localized_violation_count !== 0 ||
      after.display_label_collision_count !== 0
    ) {
      const sample = conceptGenusDifferentiaViolations({ classes: afterClasses, relations })
        .slice(0, 8)
        .map((violation) => ({
          ...violation,
          definition: afterClasses.find(({ id }) => id === violation.conceptId)
            ?.definitions?.[violation.language],
        }));
      throw new Error(`Concept genus/differentia rewrite left violations: ${JSON.stringify(sample)}`);
    }
    const auditPath = path.join(ROOT, auditRelativePath);
    const previousAudit = fs.existsSync(auditPath)
      ? JSON.parse(fs.readFileSync(auditPath, "utf8"))
      : null;
    const synchronizedPositiveExampleCount = afterClasses.reduce(
      (count, concept) => count + (concept.examples ?? [])
        .filter(({ kind }) => kind === "positive").length,
      0,
    );
    const synchronizedBoundaryExampleCount = afterClasses.reduce(
      (count, concept) => count + (concept.examples ?? []).filter(({ kind }) =>
        kind === "boundary" || kind === "counterexample",
      ).length,
      0,
    );
    const synchronizedNestedClaimCount = objectEvidenceVolumeMetrics({
      classes: afterClasses,
      relations: [],
    }).nested_claim_count;
    const previousMigration = previousAudit?.migration ?? {
      transformed_concept_count: transformedConceptIds.size,
      transformed_localized_definition_count: transformedLocalizedDefinitionCount,
      worker_capability_match_label_changed: true,
    };
    const audit = {
      contract_version: "1.0.0",
      baseline: previousAudit?.baseline ?? before,
      migration: {
        ...previousMigration,
        reviewed_definition_restoration_count: Object.values(reviewedDefinitionRestorations)
          .reduce((count, restoration) => count + Object.keys(restoration).length, 0),
        synchronized_positive_example_count: synchronizedPositiveExampleCount,
        synchronized_boundary_example_count: synchronizedBoundaryExampleCount,
        synchronized_sibling_contract_count: synchronizedSiblingContractCount,
        reviewed_shared_prefix_sibling_pair_count: reviewedSharedPrefixSiblingPairs.length,
        synchronized_nested_claim_count: synchronizedNestedClaimCount,
      },
      current: after,
    };
    stageFile(auditPath, stableJson(audit));
    return audit;
  };

  return Object.freeze({ completeConceptGenusDifferentia });
};
\n
