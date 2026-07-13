import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type Locale = "zh" | "en" | "ja";
type LocalizedText = Readonly<Record<Locale, string>>;

interface SourceExample {
  id: string;
  kind: string;
  descriptions: LocalizedText;
  field_values: Readonly<Record<string, unknown>>;
  related_node_ids: readonly string[];
  related_relation_ids: readonly string[];
  expected_result: LocalizedText;
  why_valid_or_invalid: LocalizedText;
}

interface SourceConcept {
  id: string;
  status: string;
  short_definitions: LocalizedText;
  definitions: LocalizedText;
  includes: readonly LocalizedText[];
  excludes: readonly LocalizedText[];
  examples: readonly SourceExample[];
}

interface SourceRelation {
  id: string;
  predicate: string;
  status: string;
  definitions: LocalizedText;
  examples: readonly SourceExample[];
  change_note?: LocalizedText;
}

const reviewedDefinitions = {
  ToolCandidate: {
    en: "A ToolCandidate is a Candidate whose considered object is a Tool and whose matching evidence is represented by ToolMatch-assesses-ToolCandidate.",
    zh: "工具候选是一种候选记录（Candidate），其被考虑对象限定为工具（Tool），并由 ToolMatch-assesses-ToolCandidate 关系承载匹配证据。",
    ja: "ツール候補は候補レコード（Candidate）の一種で、検討対象をツール（Tool）に限定し、照合根拠を ToolMatch-assesses-ToolCandidate 関係で表します。",
  },
  ToolCandidateSet: {
    en: "A ToolCandidateSet is a DiscoveryCandidateSet whose members are ToolCandidate records connected through ToolCandidateSet-contains-ToolCandidate.",
    zh: "工具候选集是一种发现候选集（DiscoveryCandidateSet），其成员限定为通过 ToolCandidateSet-contains-ToolCandidate 关系连接的工具候选（ToolCandidate）。",
    ja: "ツール候補集合は発見候補集合（DiscoveryCandidateSet）の一種で、ToolCandidateSet-contains-ToolCandidate 関係で結ばれたツール候補（ToolCandidate）だけをメンバーとします。",
  },
  ToolEmbeddingMatch: {
    en: "A ToolEmbeddingMatch is a ToolMatch whose evidence is vector similarity between a search query and a tool representation.",
    zh: "工具嵌入匹配是一种工具匹配（ToolMatch），其判定证据限定为搜索查询与工具表征之间的向量相似度。",
    ja: "ツール埋め込み照合はツール照合（ToolMatch）の一種で、検索クエリとツール表現のベクトル類似度を判定根拠とします。",
  },
  ToolMatch: {
    en: "A ToolMatch is a MatchAssessment that evaluates a ToolCandidate against a Tool using name, signature, embedding, regular-expression, or task-fit evidence.",
    zh: "工具匹配是一种匹配评估（MatchAssessment），它使用名称、签名、嵌入、正则表达式或任务适配证据，评估工具候选（ToolCandidate）与工具（Tool）的匹配程度。",
    ja: "ツール照合は照合評価（MatchAssessment）の一種で、名前、シグネチャ、埋め込み、正規表現、またはタスク適合性の根拠を用いてツール候補（ToolCandidate）とツール（Tool）の適合度を評価します。",
  },
  ToolRegexMatch: {
    en: "A ToolRegexMatch is a ToolMatch whose evidence is a regular-expression match over a query and tool metadata.",
    zh: "工具正则匹配是一种工具匹配（ToolMatch），其判定证据限定为查询与工具元数据之间的正则表达式匹配。",
    ja: "ツール正規表現照合はツール照合（ToolMatch）の一種で、クエリとツールメタデータに対する正規表現の一致を判定根拠とします。",
  },
  ToolSearch: {
    en: "A ToolSearch is a DiscoveryActivity that consumes a ToolSearchQuery and produces a ToolCandidateSet by retrieving ToolDefinition records.",
    zh: "工具搜索是一种发现活动（DiscoveryActivity），它消费工具搜索查询（ToolSearchQuery），检索工具定义（ToolDefinition），并产出工具候选集（ToolCandidateSet）。",
    ja: "ツール検索は発見活動（DiscoveryActivity）の一種で、ツール検索クエリ（ToolSearchQuery）を消費し、ツール定義（ToolDefinition）を検索してツール候補集合（ToolCandidateSet）を生成します。",
  },
  ToolSelectionDecision: {
    en: "A ToolSelectionDecision is a SelectionDecision that considers ToolMatch evidence and either selects a Tool or rejects a ToolCandidate.",
    zh: "工具选择决策是一种选择决策（SelectionDecision），它审议工具匹配（ToolMatch）证据，并据此选择工具（Tool）或拒绝工具候选（ToolCandidate）。",
    ja: "ツール選択判断は選択判断（SelectionDecision）の一種で、ツール照合（ToolMatch）の根拠を検討し、ツール（Tool）を選択するかツール候補（ToolCandidate）を棄却します。",
  },
  ExecutionRequest: {
    en: "An ExecutionRequest is an InvocationSpecification that asks a runtime to run a command, call a service, access a resource, or execute a tool operation.",
    zh: "执行请求是一种调用规约（InvocationSpecification），用于要求运行时执行命令、调用服务、访问资源或执行工具操作。",
    ja: "実行要求は呼び出し仕様（InvocationSpecification）の一種で、ランタイムにコマンド実行、サービス呼び出し、リソースアクセス、またはツール操作の実行を要求します。",
  },
  ExecutionResult: {
    en: "An ExecutionResult is an InvocationResult for an ExecutionRequest that carries observable output, error stream, exit status, or artifact references without asserting task success.",
    zh: "执行结果是一种调用结果（InvocationResult），对应一次执行请求（ExecutionRequest），承载可观测输出、错误流、退出状态或产物引用，但不据此断言任务成功。",
    ja: "実行結果は実行要求（ExecutionRequest）に対する呼び出し結果（InvocationResult）の一種で、観測可能な出力、エラーストリーム、終了状態、または成果物参照を保持しますが、タスク成功を表明しません。",
  },
  ProgrammaticToolCall: {
    en: "A ProgrammaticToolCall is a ToolCall initiated by generated code, runtime orchestration, or explicit API logic rather than direct natural-language selection.",
    zh: "程序化工具调用是一种工具调用（ToolCall），其发起源限定为生成代码、运行时编排或显式 API 逻辑，而非直接的自然语言选择。",
    ja: "プログラム的ツール呼び出しはツール呼び出し（ToolCall）の一種で、直接の自然言語選択ではなく、生成コード、ランタイム編成、または明示的な API ロジックから開始されます。",
  },
  ToolCall: {
    en: "A ToolCall is an Invocation that identifies a caller and operation, supplies arguments, and requests a selected Tool; call_id, requested_at, operation_id, and idempotency_key make the request traceable and replay-safe.",
    zh: "工具调用是一种调用（Invocation），它标识调用者与操作、提供参数并请求已选择的工具（Tool）；call_id、requested_at、operation_id 与 idempotency_key 使该请求可追踪且可安全重放。",
    ja: "ツール呼び出しは呼び出し（Invocation）の一種で、呼び出し元と操作を識別し、引数を渡して選択済みツール（Tool）を要求します。call_id、requested_at、operation_id、idempotency_key により追跡可能性と安全な再実行を確保します。",
  },
  ToolCallAttempt: {
    en: "A ToolCallAttempt is an InvocationAttempt that records one execution attempt of a ToolCall, identified by attempt_id and attempt_number, with status, timing, authorization, sandbox, and result context.",
    zh: "工具调用尝试是一种调用尝试（InvocationAttempt），记录某个工具调用（ToolCall）的一次执行；attempt_id 与 attempt_number 标识该次尝试，并附带状态、时间、授权、沙箱和结果上下文。",
    ja: "ツール呼び出し試行は呼び出し試行（InvocationAttempt）の一種で、ツール呼び出し（ToolCall）の一回の実行を記録します。attempt_id と attempt_number で試行を識別し、状態、時刻、認可、サンドボックス、結果の文脈を保持します。",
  },
  ToolCallRetry: {
    en: "A ToolCallRetry is a ToolCallAttempt initiated to retry a prior ToolCallAttempt after a retryable failure or policy decision and linked by ToolCallRetry-retries-ToolCallAttempt.",
    zh: "工具调用重试是一种工具调用尝试（ToolCallAttempt），在可重试失败或策略决策后再次执行先前尝试，并通过 ToolCallRetry-retries-ToolCallAttempt 关系指向被重试的尝试。",
    ja: "ツール呼び出し再試行はツール呼び出し試行（ToolCallAttempt）の一種で、再試行可能な失敗またはポリシー判断の後に先行試行を再実行し、ToolCallRetry-retries-ToolCallAttempt 関係で再試行対象を指します。",
  },
  ToolResult: {
    en: "A ToolResult is an InvocationResult produced by a ToolCallAttempt, identified by result_id, status, received_at, and payload_digest, and carrying output, error, warning, or metadata without asserting task success.",
    zh: "工具结果是一种调用结果（InvocationResult），由工具调用尝试（ToolCallAttempt）产生，以 result_id、status、received_at 与 payload_digest 标识，并承载输出、错误、警告或元数据，但不据此断言任务成功。",
    ja: "ツール結果はツール呼び出し試行（ToolCallAttempt）が生成する呼び出し結果（InvocationResult）の一種で、result_id、status、received_at、payload_digest で識別され、出力、エラー、警告、メタデータを保持しますが、タスク成功を表明しません。",
  },
  Tool: {
    en: "A Tool is a callable capability that exposes an APIOperation, accepts arguments under its definition and permission constraints, and yields an observable result when invoked.",
    zh: "工具是一种可调用能力，它公开 API 操作（APIOperation），在工具定义与权限约束下接收参数，并在被调用时产生可观测结果。",
    ja: "ツールは呼び出し可能な能力で、API 操作（APIOperation）を公開し、ツール定義と権限制約の下で引数を受け取り、呼び出し時に観測可能な結果を生成します。",
  },
  MCPElicitation: {
    en: "MCPElicitation is an MCPInteraction in which an MCP server requests AdditionalInput from a client or user during an active interaction, subject to client consent and policy.",
    zh: "MCP 补充请求是一种 MCP 交互（MCPInteraction），其中 MCP 服务器在进行中的交互内请求客户端或用户提供附加输入（AdditionalInput），并受客户端同意与策略约束。",
    ja: "MCP 補足要求は MCP インタラクション（MCPInteraction）の一種で、進行中の対話において MCP サーバーがクライアントまたはユーザーへ追加入力（AdditionalInput）を要求し、クライアントの同意とポリシーに従います。",
  },
  ToolDeprecationNotice: {
    en: "A ToolDeprecationNotice is ToolMetadata that identifies a deprecated ToolDefinition and records lifecycle or replacement guidance rather than describing the callable capability itself.",
    zh: "工具弃用通知是一种工具元数据（ToolMetadata），用于标识被弃用的工具定义（ToolDefinition）并记录生命周期或替代指引，而不是描述可调用能力本身。",
    ja: "ツール非推奨通知はツールメタデータ（ToolMetadata）の一種で、非推奨となるツール定義（ToolDefinition）を識別し、ライフサイクルまたは代替指針を記録しますが、呼び出し可能な能力自体は記述しません。",
  },
  InjectionSignature: {
    en: "An InjectionSignature is a detection pattern representing indicators of prompt injection, tool-stream manipulation, or malicious instruction propagation and used as the target of scans_for_signature.",
    zh: "注入签名是一种检测模式，表示提示注入、工具流操纵或恶意指令传播的可识别指标，并作为 scans_for_signature 关系的检测目标。",
    ja: "注入シグネチャは、プロンプトインジェクション、ツールストリーム操作、または悪意ある指示伝播の識別可能な兆候を表す検出パターンで、scans_for_signature 関係の検出対象です。",
  },
  PatternScan: {
    en: "A PatternScan is a DetectionActivity that examines messages, retrieved chunks, tool results, or other untrusted content for InjectionSignature indicators or policy violations and produces an InjectionScanResult.",
    zh: "模式扫描是一种检测活动（DetectionActivity），检查消息、检索分块、工具结果或其他不可信内容中的注入签名（InjectionSignature）指标或策略违规，并产出注入扫描结果（InjectionScanResult）。",
    ja: "パターンスキャンは検出活動（DetectionActivity）の一種で、メッセージ、検索チャンク、ツール結果、その他の未信頼コンテンツにある注入シグネチャ（InjectionSignature）の兆候またはポリシー違反を検査し、注入スキャン結果（InjectionScanResult）を生成します。",
  },
  ExternalBoundary: {
    en: "An ExternalBoundary is a TrustBoundary that separates the controlled agent runtime from outside organizations, services, users, or systems.",
    zh: "外部边界是一种信任边界（TrustBoundary），用于分隔受控智能体运行时与其外部的组织、服务、用户或系统。",
    ja: "外部境界は信頼境界（TrustBoundary）の一種で、制御されたエージェントランタイムと外部の組織、サービス、ユーザー、またはシステムを分離します。",
  },
  InternalBoundary: {
    en: "An InternalBoundary is a TrustBoundary that separates trusted runtime components, local stores, or internal services from less-trusted internal execution or data surfaces.",
    zh: "内部边界是一种信任边界（TrustBoundary），用于分隔可信运行时组件、本地存储或内部服务与较低信任的内部执行面或数据面。",
    ja: "内部境界は信頼境界（TrustBoundary）の一種で、信頼済みランタイム部品、ローカルストア、内部サービスを、より信頼度の低い内部実行面またはデータ面から分離します。",
  },
  NetworkBoundary: {
    en: "A NetworkBoundary is a TrustBoundary at the transition between the runtime and network-accessible transports, proxies, resources, or remote services.",
    zh: "网络边界是一种信任边界（TrustBoundary），位于运行时与可经网络访问的传输、代理、资源或远程服务之间的信任转换点。",
    ja: "ネットワーク境界は信頼境界（TrustBoundary）の一種で、ランタイムとネットワーク経由でアクセス可能な転送、プロキシ、リソース、または遠隔サービスの間の信頼遷移点にあります。",
  },
  ToolBoundary: {
    en: "A ToolBoundary is a TrustBoundary where model-controlled intent becomes an executable tool request or where tool output re-enters model-visible context.",
    zh: "工具边界是一种信任边界（TrustBoundary），位于模型控制的意图转化为可执行工具请求，或工具输出重新进入模型可见上下文的位置。",
    ja: "ツール境界は信頼境界（TrustBoundary）の一種で、モデルが制御する意図が実行可能なツール要求へ変換される地点、またはツール出力がモデル可視の文脈へ戻る地点にあります。",
  },
  ToolTranscript: {
    en: "A ToolTranscript is a LogArtifact that preserves the ordered record of tool requests, permission prompts, ToolCallAttempt executions, results, warnings, and follow-up observations.",
    zh: "工具转录是一种日志产物（LogArtifact），按顺序保存工具请求、权限提示、工具调用尝试（ToolCallAttempt）的执行、结果、警告与后续观察。",
    ja: "ツール転写はログ成果物（LogArtifact）の一種で、ツール要求、権限プロンプト、ツール呼び出し試行（ToolCallAttempt）の実行、結果、警告、後続観測を順序どおり保持します。",
  },
} as const satisfies Readonly<Record<string, LocalizedText>>;

const migratedInfoRelationExamples = {
  has_access_path: "SourceReference-accessed_via-AccessPath",
  has_source_location: "SourceReference-located_at-SourceLocation",
  ranked_by_score: "RetrievedContextCandidate-scored_by-RetrievalScore",
  excluded_from_context: "ContextSelectionDecision-suppresses-SuppressedContext",
  has_exit_status:
    "CommandOutputObservation-has_exit_status_observation-ExitStatusObservation",
  overrides_instruction: "InstructionOverride-overrides-Instruction",
  has_content_block: "Message-contains_content_block-ContentBlock",
} as const;

const forbiddenGenericRelationExampleText = {
  zh: "该关系谓词连接本体中的指定端点，用于表达消息、来源、上下文选择、披露、执行观测或跨域治理中的明确语义。",
  ja: "この関係述語は、本体内の指定された端点を結び、メッセージ、出典、コンテキスト選択、開示、実行観測、または領域横断統制の明確な意味を表します。",
} as const;

const reviewedInfoRelationDefinitions = {
  derived_from_trace_event: {
    en: "links a context observation to the observable runtime trace event that produced it.",
    zh: "将上下文观测连接到产生该观测的可观察运行时追踪事件。",
    ja: "コンテキスト観測を、その観測を生成した観測可能なランタイム追跡イベントへ結び付けます。",
  },
  has_stderr_chunk: {
    en: "links a command output observation to a bounded stderr chunk selected for diagnostics, staging, or audit.",
    zh: "将命令输出观测连接到为诊断、上下文暂存或审计而选取的有边界标准错误分块。",
    ja: "コマンド出力観測を、診断、コンテキストのステージング、または監査のために選択された境界付き stderr チャンクへ結び付けます。",
  },
  has_stdout_chunk: {
    en: "links a command output observation to a bounded stdout chunk selected for staging, display, or audit.",
    zh: "将命令输出观测连接到为上下文暂存、显示或审计而选取的有边界标准输出分块。",
    ja: "コマンド出力観測を、コンテキストのステージング、表示、または監査のために選択された境界付き stdout チャンクへ結び付けます。",
  },
  ingested_into_context: {
    en: "links an observable context-ingress event to the context package made visible to a model call or agent step.",
    zh: "将可观察的上下文摄入事件连接到对模型调用或智能体步骤可见的上下文包。",
    ja: "観測可能なコンテキスト取り込みイベントを、モデル呼び出しまたはエージェントステップに可視化されたコンテキストパッケージへ結び付けます。",
  },
  produced_by_command_execution: {
    en: "links command output observation to the runtime command execution event that produced it.",
    zh: "将命令输出观测连接到产生它的运行时命令执行事件。",
    ja: "コマンド出力観測を、それを生成したランタイムのコマンド実行イベントへ結び付けます。",
  },
  summarized_as_context_input: {
    en: "links execution output to the summary that carries it forward under context budget limits.",
    zh: "将执行输出连接到在上下文预算限制下承载其后续信息的摘要。",
    ja: "実行出力を、コンテキスト予算の制約下でその情報を後続へ引き継ぐ要約へ結び付けます。",
  },
  compressed_into_summary: {
    en: "links source content or output to the observable summary used to fit a context budget.",
    zh: "将源内容或输出连接到为适配上下文预算而形成的可观察摘要。",
    ja: "出典内容または出力を、コンテキスト予算に収めるために用いられる観測可能な要約へ結び付けます。",
  },
  derived_from_source: {
    en: "links a content block, output segment, or summary to the source reference it was derived from.",
    zh: "将内容块、输出片段或摘要连接到其派生自的来源引用。",
    ja: "コンテンツブロック、出力セグメント、または要約を、それらの派生元である出典参照へ結び付けます。",
  },
  has_source_reference: {
    en: "links a context artifact, content block, citation, or retrieval candidate to the source reference that supports it.",
    zh: "将上下文制品、内容块、引用或检索候选项连接到支持它的来源引用。",
    ja: "コンテキスト成果物、コンテンツブロック、引用、または検索候補を、それを裏付ける出典参照へ結び付けます。",
  },
  redacted_by_policy: {
    en: "links content to the policy rule that removed or masked sensitive spans before disclosure or context staging.",
    zh: "将内容连接到在披露或上下文暂存前移除或遮蔽敏感片段的策略规则。",
    ja: "コンテンツを、開示またはコンテキストのステージング前に機微な範囲を除去またはマスクしたポリシールールへ結び付けます。",
  },
  truncated_by_window: {
    en: "links content to the context or output windowing decision that shortened it.",
    zh: "将内容连接到使其缩短的上下文或输出窗口决策。",
    ja: "コンテンツを、それを短縮したコンテキストまたは出力のウィンドウ判断へ結び付けます。",
  },
  selected_for_context: {
    en: "links a retrieved candidate, source span, message, or observation to the context package that includes it.",
    zh: "将检索候选项、来源片段、消息或观测连接到包含它的上下文包。",
    ja: "検索候補、出典範囲、メッセージ、または観測を、それを含むコンテキストパッケージへ結び付けます。",
  },
  has_instruction_authority: {
    en: "links an instruction to the authority source used to resolve conflicts among system, developer, user, policy, retrieved, or tool-originated directives.",
    zh: "将指令连接到用于解决系统、开发者、用户、策略、检索内容或工具来源指令冲突的权威来源。",
    ja: "指示を、システム、開発者、ユーザー、ポリシー、検索内容、またはツール由来の指示間の競合を解決するために用いる権限情報源へ結び付けます。",
  },
  has_instruction_priority: {
    en: "links an instruction to the precedence ordering used when multiple directives compete.",
    zh: "将指令连接到多项指令竞争时采用的优先次序。",
    ja: "指示を、複数の指示が競合するときに用いる優先順位へ結び付けます。",
  },
  has_instruction_scope: {
    en: "links an instruction to the session, task, tool call, source span, or trust boundary where it applies.",
    zh: "将指令连接到其适用的会话、任务、工具调用、来源片段或信任边界。",
    ja: "指示を、それが適用されるセッション、タスク、ツール呼び出し、出典範囲、または信頼境界へ結び付けます。",
  },
  has_visible_window: {
    en: "links a context package to the visible window available to a model call, actor, or downstream recipient.",
    zh: "将上下文包连接到模型调用、行为者或下游接收者可见的窗口。",
    ja: "コンテキストパッケージを、モデル呼び出し、アクター、または下流の受信者が利用可能な可視ウィンドウへ結び付けます。",
  },
  part_of_conversation: {
    en: "links a message or turn to the conversation or thread that supplies ordering and continuity.",
    zh: "将消息或轮次连接到提供顺序和连续性的对话或线程。",
    ja: "メッセージまたはターンを、順序と連続性を与える会話またはスレッドへ結び付けます。",
  },
  cites_source: {
    en: "links a visible output citation to the precise source span that supports the displayed claim or segment.",
    zh: "将可见输出中的引用连接到支持所显示主张或片段的精确来源区段。",
    ja: "可視出力の引用を、表示された主張またはセグメントを裏付ける正確な出典範囲へ結び付けます。",
  },
  displayed_to_actor: {
    en: "links a disclosed output segment to the actor or recipient that can see it.",
    zh: "将已披露输出片段连接到能够查看它的行为者或接收者。",
    ja: "開示済み出力セグメントを、それを閲覧できるアクターまたは受信者へ結び付けます。",
  },
  released_to_boundary: {
    en: "links a disclosed output segment to the trust boundary or external boundary it is allowed to cross.",
    zh: "将已披露输出片段连接到获准跨越的信任边界或外部边界。",
    ja: "開示済み出力セグメントを、通過を許可された信頼境界または外部境界へ結び付けます。",
  },
  suppressed_by_rule: {
    en: "links suppressed context or output to the disclosure, redaction, privacy, safety, or boundary rule that withheld it.",
    zh: "将被抑制的上下文或输出连接到扣留它的披露、脱敏、隐私、安全或边界规则。",
    ja: "抑止されたコンテキストまたは出力を、それを留保した開示、墨消し、プライバシー、安全、または境界ルールへ結び付けます。",
  },
  has_checksum: {
    en: "links a source reference to a digest used to detect content drift after ingestion or context staging.",
    zh: "将来源引用连接到用于检测摄入或上下文暂存后内容漂移的摘要值。",
    ja: "出典参照を、取り込みまたはコンテキストのステージング後の内容ドリフト検出に用いるダイジェストへ結び付けます。",
  },
  has_source_span: {
    en: "links a source reference to the exact span, row, range, page, line, offset, or anchor used as evidence.",
    zh: "将来源引用连接到用作证据的精确片段、行、范围、页、行号、偏移或锚点。",
    ja: "出典参照を、根拠として用いた正確な範囲、行、レンジ、ページ、行番号、オフセット、またはアンカーへ結び付けます。",
  },
  has_version: {
    en: "links a source reference to the version, revision, snapshot, commit, or release that was cited.",
    zh: "将来源引用连接到所引用的版本、修订、快照、提交或发布版本。",
    ja: "出典参照を、引用されたバージョン、リビジョン、スナップショット、コミット、またはリリースへ結び付けます。",
  },
} as const satisfies Readonly<Record<string, LocalizedText>>;

const locales = ["zh", "en", "ja"] as const;
const sourceRoot = resolve(import.meta.dirname, "../ontology/source");

const sourceConcepts = (): readonly SourceConcept[] =>
  readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((plane) =>
      readdirSync(resolve(sourceRoot, plane.name))
        .filter((name) => name.endsWith(".json"))
        .flatMap((name) => {
          const source = JSON.parse(
            readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
          ) as { classes?: SourceConcept[] };
          return source.classes ?? [];
        }),
    );

const sourceRelations = (): readonly SourceRelation[] =>
  readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((plane) =>
      readdirSync(resolve(sourceRoot, plane.name))
        .filter((name) => name.endsWith(".json"))
        .flatMap((name) => {
          const source = JSON.parse(
            readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
          ) as { relations?: SourceRelation[] };
          return source.relations ?? [];
        }),
    );

const conceptById = new Map(sourceConcepts().map((concept) => [concept.id, concept]));
const relationById = new Map(sourceRelations().map((relation) => [relation.id, relation]));

describe("reviewed multilingual Concept semantics", () => {
  it("keeps the 24 repaired Concepts aligned to one genus-differentia meaning", () => {
    expect(Object.keys(reviewedDefinitions)).toHaveLength(24);

    for (const [conceptId, definition] of Object.entries(reviewedDefinitions)) {
      const concept = conceptById.get(conceptId);
      expect(concept, conceptId).toBeDefined();
      expect(concept?.status, conceptId).toBe("accepted");
      expect(concept?.definitions, `${conceptId}/definitions`).toEqual(definition);
      expect(concept?.short_definitions, `${conceptId}/short_definitions`).toEqual(definition);

      for (const locale of locales) {
        expect(
          concept?.includes.some((item) => item[locale].includes(definition[locale])),
          `${conceptId}/includes/${locale}`,
        ).toBe(true);
        expect(
          concept?.examples.some(
            (example) =>
              example.kind === "positive" &&
              example.descriptions[locale].includes(definition[locale]),
          ),
          `${conceptId}/positive-example/${locale}`,
        ).toBe(true);
      }
    }
  });

  it("propagates repaired peer definitions into exclusions and boundary examples", () => {
    for (const [conceptId, conceptDefinition] of Object.entries(reviewedDefinitions)) {
      const concept = conceptById.get(conceptId);
      expect(concept, conceptId).toBeDefined();
      if (concept === undefined) continue;

      const boundary = concept.examples.find((example) => example.kind === "boundary");
      const contrastId = boundary?.related_node_ids.at(-1);
      const contrastDefinition =
        contrastId === undefined
          ? undefined
          : reviewedDefinitions[contrastId as keyof typeof reviewedDefinitions];
      if (contrastDefinition === undefined || contrastId === conceptId) continue;

      for (const locale of locales) {
        const exclusionText = concept.excludes.map((item) => item[locale]).join("\n");
        const exclusionQuotesPeerDefinition =
          /reviewed definition|定义为|審査済み定義|定義は/iu.test(exclusionText);
        if (exclusionQuotesPeerDefinition) {
          expect(
            exclusionText,
            `${conceptId}/excludes/${contrastId}/${locale}`,
          ).toContain(contrastDefinition[locale]);
        }
        expect(
          boundary?.descriptions[locale],
          `${conceptId}/boundary/${contrastId}/${locale}`,
        ).toContain(contrastDefinition[locale]);
        expect(conceptDefinition[locale]).not.toBe(contrastDefinition[locale]);
      }
    }
  });

  it("uses MCP rather than A2A identifiers in MCPAdapter positive records", () => {
    const concept = conceptById.get("MCPAdapter");
    expect(concept).toBeDefined();
    const positive = concept?.examples.find(
      (example) => example.id === "MCPAdapter-example-positive-001",
    );
    const instance = concept?.examples.find(
      (example) => example.id === "MCPAdapter-example-instance-001",
    );

    for (const example of [positive, instance]) {
      expect(example).toBeDefined();
      expect(example?.field_values).toMatchObject({
        adapter_family: "mcp",
        adapter_id: "adapter-mcp",
        scope: ["tools", "resources", "prompts"],
      });
      expect(JSON.stringify(example?.field_values)).not.toMatch(/a2a/iu);
    }
  });
});

describe("reviewed multilingual Relation semantics", () => {
  it("rejects generic semantic templates from every relation example", () => {
    const errors = [...relationById.values()].flatMap((relation) =>
      relation.examples.flatMap((example) =>
        Object.entries(forbiddenGenericRelationExampleText).flatMap(
          ([locale, template]) =>
            example.descriptions[locale as keyof typeof forbiddenGenericRelationExampleText]
              .includes(template)
              ? [`${relation.id}/${example.id}/${locale}`]
              : [],
        ),
      ),
    );

    expect(errors).toEqual([]);
  });

  it("presents merged legacy predicates only as information on their canonical edge", () => {
    for (const [legacyPredicate, canonicalRelationId] of Object.entries(
      migratedInfoRelationExamples,
    )) {
      const relation = relationById.get(canonicalRelationId);
      expect(relation, canonicalRelationId).toBeDefined();
      const migratedExamples = relation?.examples.filter((example) =>
        example.id.startsWith(`${legacyPredicate}-example-`),
      );
      expect(migratedExamples, `${legacyPredicate}/migrated-examples`).toHaveLength(2);

      for (const example of migratedExamples ?? []) {
        expect(example.related_relation_ids, example.id).toEqual([
          canonicalRelationId,
        ]);
        for (const locale of locales) {
          const displayedInformation = [
            example.descriptions[locale],
            example.expected_result[locale],
            example.why_valid_or_invalid[locale],
          ].join("\n");
          expect(displayedInformation, `${example.id}/${locale}`).toContain(
            legacyPredicate,
          );
          expect(displayedInformation, `${example.id}/${locale}`).toContain(
            canonicalRelationId,
          );
        }
      }
    }
  });

  it("keeps the 24 repaired Info relations aligned to predicate-specific meanings", () => {
    expect(Object.keys(reviewedInfoRelationDefinitions)).toHaveLength(24);

    for (const [relationId, definition] of Object.entries(
      reviewedInfoRelationDefinitions,
    )) {
      const relation = relationById.get(relationId);
      expect(relation, relationId).toBeDefined();
      expect(relation?.status, relationId).toBe("accepted");
      expect(relation?.definitions, `${relationId}/definitions`).toEqual(definition);

      const generatedExamples = relation?.examples.filter((example) =>
        [
          `${relationId}-example-positive-001`,
          `${relationId}-example-boundary-001`,
        ].includes(example.id),
      );
      expect(generatedExamples, `${relationId}/generated-examples`).toHaveLength(2);
      for (const example of generatedExamples ?? []) {
        for (const locale of locales) {
          expect(
            example.descriptions[locale],
            `${relationId}/${example.id}/${locale}`,
          ).toContain(definition[locale]);
        }
      }
    }
  });

  it("does not reuse one generic localized definition across accepted semantic relations", () => {
    const acceptedSemanticRelations = [...relationById.values()].filter(
      (relation) => relation.status === "accepted" && relation.predicate !== "is_a",
    );

    for (const locale of locales) {
      const ownersByDefinition = new Map<string, string[]>();
      for (const relation of acceptedSemanticRelations) {
        const owners = ownersByDefinition.get(relation.definitions[locale]) ?? [];
        ownersByDefinition.set(relation.definitions[locale], [...owners, relation.id]);
      }
      const duplicates = [...ownersByDefinition.entries()]
        .filter(([, owners]) => owners.length > 1)
        .map(([definition, owners]) => ({ definition, owners }));
      expect(duplicates, `duplicate semantic relation definitions/${locale}`).toEqual([]);
    }
  });

  it("keeps standardized mapping change notes owned by their actual relation", () => {
    const errors: string[] = [];
    for (const relation of relationById.values()) {
      const note = relation.change_note;
      if (!note) continue;
      const tokens = [
        note.en.match(/direction of ([A-Za-z0-9_-]+) are reviewed/u)?.[1],
        note.zh.match(/当前 ([A-Za-z0-9_-]+) 的 source-to-target/u)?.[1],
        note.ja.match(/([A-Za-z0-9_-]+) の source-to-target/u)?.[1],
      ].filter((token): token is string => Boolean(token));
      for (const token of tokens) {
        if (token !== relation.id && token !== relation.predicate) {
          errors.push(`${relation.id}:${token}`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});
