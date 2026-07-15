const localized = (zh, en, ja) => Object.freeze({ zh, en, ja });

const entry = (ownerModuleIds, text) => Object.freeze({
  owner_module_ids: Object.freeze(ownerModuleIds),
  text,
});

export const ONTOLOGY_V3_DOMAIN_CLOSURE_CONTRACTS = Object.freeze({
  "info-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["info-content-block-modality", "info-indexing"],
        localized(
          "信息域负责内容表示（owner: info-content-block-modality）与上下文发现（owner: info-indexing）：前者定义多模态内容的可解释形态，后者定义证据的索引、引用和访问路径。",
          "The Info domain owns Content representation (owner: info-content-block-modality) and Context discovery (owner: info-indexing): the first defines interpretable multimodal content forms, while the second defines evidence indexes, references, and access paths.",
          "情報ドメインは内容表現（owner: info-content-block-modality）とコンテキスト発見（owner: info-indexing）を所有します。前者は解釈可能なマルチモーダル内容形式を、後者は証拠の索引・参照・アクセス経路を定義します。",
        ),
      ),
      entry(
        ["info-output-disclosure"],
        localized(
          "信息域还负责输出披露（owner: info-output-disclosure），即决定已经形成的信息如何分段、解释并向当前接收者呈现，但不在此重新定义授权或长期记忆身份。",
          "The Info domain also owns Output disclosure (owner: info-output-disclosure), which determines how formed information is segmented, explained, and presented to the current recipient without redefining authorization or persistent-memory identity.",
          "情報ドメインは出力開示（owner: info-output-disclosure）も所有し、形成済み情報を現在の受信者へどう分割・説明・提示するかを定めますが、認可や永続記憶の同一性は再定義しません。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["memory-context"],
        localized(
          "上下文组装（owner: memory-context）属于记忆域，因为它选择并编排可持续使用的记忆内容；信息域只提供可引用的信息单位与披露形式，并通过显式关系连接该外域职责。",
          "Context assembly (owner: memory-context) belongs to Memory because it selects and composes memory content for continued use; Info supplies referable information units and disclosure forms and connects to that foreign responsibility only through explicit relations.",
          "コンテキスト組み立て（owner: memory-context）は継続利用する記憶内容を選択・編成するため記憶ドメインに属します。情報ドメインは参照可能な情報単位と開示形式を供給し、明示的関係だけでこの外部責務へ接続します。",
        ),
      ),
      entry(
        ["safety-disclosure-redaction"],
        localized(
          "披露与脱敏（owner: safety-disclosure-redaction）属于安全域，因为它依据敏感性和策略决定允许显示的范围；信息域描述输出结构，不复制脱敏规则、授权判定或安全责任。",
          "Disclosure and redaction (owner: safety-disclosure-redaction) belongs to Safety because it decides permitted visibility from sensitivity and policy; Info describes output structure without copying redaction rules, authorization decisions, or safety accountability.",
          "開示と墨消し（owner: safety-disclosure-redaction）は機密性と方針から表示可能範囲を決めるため安全ドメインに属します。情報ドメインは出力構造を記述しますが、墨消し規則・認可判断・安全責任を複製しません。",
        ),
      ),
    ]),
  }),
  "orchestration-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["orchestration-task-planning", "orchestration-delegation-handoff"],
        localized(
          "编排域负责目标与任务规划（owner: orchestration-task-planning）以及委派与移交（owner: orchestration-delegation-handoff），把目标分解、责任转移和交付确认组织成连续协作决策。",
          "Orchestration owns Goals and task planning (owner: orchestration-task-planning) and Delegation and handoff (owner: orchestration-delegation-handoff), organizing goal decomposition, responsibility transfer, and delivery confirmation into continuous collaboration decisions.",
          "編成ドメインは目標とタスク計画（owner: orchestration-task-planning）および委任と引き継ぎ（owner: orchestration-delegation-handoff）を所有し、目標分解・責任移転・引き渡し確認を連続した協働判断へ編成します。",
        ),
      ),
      entry(
        ["orchestration-routing-control"],
        localized(
          "编排域还负责路由与门控（owner: orchestration-routing-control），根据任务状态、候选能力和协作约束选择下一路径并控制分支汇合，而不执行具体运行尝试。",
          "Orchestration also owns Routing and gates (owner: orchestration-routing-control), selecting the next path and controlling branch convergence from task state, candidate capabilities, and collaboration constraints without executing the concrete runtime attempt.",
          "編成ドメインは経路制御とゲート（owner: orchestration-routing-control）も所有し、タスク状態・候補能力・協働制約から次の経路と分岐統合を制御しますが、具体的な実行試行は行いません。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["runtime-execution-attempts"],
        localized(
          "执行尝试与结果（owner: runtime-execution-attempts）属于运行域，因为它记录一次实际执行的开始、终止和结果身份；编排域只决定应当执行什么及由谁执行。",
          "Execution attempts and outcomes (owner: runtime-execution-attempts) belongs to Runtime because it records the identity, start, termination, and outcome of an actual execution; Orchestration decides what should run and who should run it.",
          "実行試行と結果（owner: runtime-execution-attempts）は実際の実行の同一性・開始・終了・結果を記録するため実行ドメインに属します。編成ドメインは何を誰が実行すべきかだけを決めます。",
        ),
      ),
      entry(
        ["feedback-metrics-evaluation"],
        localized(
          "评估与度量（owner: feedback-metrics-evaluation）属于反馈域，因为它定义测量、阈值和评价证据；编排域可以触发评估或依据结果改路，但不重新拥有指标语义。",
          "Evaluation and measurement (owner: feedback-metrics-evaluation) belongs to Feedback because it defines measurements, thresholds, and evaluation evidence; Orchestration may trigger evaluation or reroute from its result but does not re-own metric semantics.",
          "評価と測定（owner: feedback-metrics-evaluation）は測定・閾値・評価証拠を定義するためフィードバックドメインに属します。編成は評価を起動し結果で経路変更できますが、指標意味を再所有しません。",
        ),
      ),
    ]),
  }),
  "runtime-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["runtime-system", "runtime-execution-attempts"],
        localized(
          "运行域负责运行环境与会话（owner: runtime-system）以及执行尝试与结果（owner: runtime-execution-attempts），明确一次执行发生在哪里、以何种会话边界启动并形成何种结果。",
          "Runtime owns Runtime environments and sessions (owner: runtime-system) and Execution attempts and outcomes (owner: runtime-execution-attempts), identifying where an execution occurs, within which session boundary it starts, and which outcome it produces.",
          "実行ドメインは実行環境とセッション（owner: runtime-system）および実行試行と結果（owner: runtime-execution-attempts）を所有し、実行場所・開始セッション境界・生成結果を特定します。",
        ),
      ),
      entry(
        ["runtime-artifacts"],
        localized(
          "运行域还负责运行产物（owner: runtime-artifacts），为执行期间产生且可按标识与版本继续引用的文件、补丁、构建物和其他成果赋予持久运行身份。",
          "Runtime also owns Runtime artifacts (owner: runtime-artifacts), assigning persistent runtime identity to files, patches, builds, and other products created during execution and subsequently referable by identifier and version.",
          "実行ドメインは実行成果物（owner: runtime-artifacts）も所有し、実行中に生成され識別子と版で継続参照できるファイル・パッチ・ビルド等へ永続的な実行同一性を与えます。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["orchestration-task-planning"],
        localized(
          "目标与任务规划（owner: orchestration-task-planning）属于编排域，因为它定义执行前的目标分解和工作意图；运行域只实例化计划并记录实际发生的尝试与状态。",
          "Goals and task planning (owner: orchestration-task-planning) belongs to Orchestration because it defines pre-execution goal decomposition and work intent; Runtime instantiates the plan and records attempts and states that actually occur.",
          "目標とタスク計画（owner: orchestration-task-planning）は実行前の目標分解と作業意図を定義するため編成ドメインに属します。実行ドメインは計画を具体化し、実際の試行と状態を記録します。",
        ),
      ),
      entry(
        ["feedback-review-optimization"],
        localized(
          "审查与纠正（owner: feedback-review-optimization）属于反馈域，因为它判断既有结果是否需要修订并记录纠正理由；运行域保留被审查的执行事实，不拥有改进判定。",
          "Review and correction (owner: feedback-review-optimization) belongs to Feedback because it judges whether an existing result needs revision and records the correction rationale; Runtime preserves the reviewed execution facts without owning improvement judgment.",
          "レビューと修正（owner: feedback-review-optimization）は既存結果の修訂要否と修正理由を扱うためフィードバックドメインに属します。実行ドメインは審査対象の実行事実を保持しますが改善判断を所有しません。",
        ),
      ),
    ]),
  }),
  "adapter-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["adapter-mapping-infrastructure", "adapter-protocols"],
        localized(
          "适配域负责映射规则与验证（owner: adapter-mapping-infrastructure）以及协议映射（owner: adapter-protocols），显式记录外部标识、方向、损失和一致性检查如何对应核心本体。",
          "Adapter owns Mapping rules and validation (owner: adapter-mapping-infrastructure) and Protocol mappings (owner: adapter-protocols), explicitly recording how external identifiers, direction, loss, and conformance checks correspond to the core ontology.",
          "適配ドメインは写像規則と検証（owner: adapter-mapping-infrastructure）およびプロトコル写像（owner: adapter-protocols）を所有し、外部識別子・方向・損失・適合性検査と中核本体の対応を明示します。",
        ),
      ),
      entry(
        ["adapter-schema-export"],
        localized(
          "适配域还负责模式导出（owner: adapter-schema-export），把已审查的核心概念、字段与约束投影为目标模式产物，并明确无法无损表达的部分。",
          "Adapter also owns Schema exports (owner: adapter-schema-export), projecting reviewed core concepts, fields, and constraints into target-schema artifacts while declaring what cannot be represented without loss.",
          "適配ドメインはスキーマ出力（owner: adapter-schema-export）も所有し、審査済みの中核概念・フィールド・制約を対象スキーマ成果物へ投影し、無損失で表現できない部分を明示します。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["runtime-system"],
        localized(
          "运行环境与会话（owner: runtime-system）属于运行域，因为它描述真实执行容器与会话身份；适配域可以映射这些对象的外部表示，但不创建或管理运行会话。",
          "Runtime environments and sessions (owner: runtime-system) belongs to Runtime because it describes real execution containers and session identity; Adapter may map their external representation but does not create or manage runtime sessions.",
          "実行環境とセッション（owner: runtime-system）は実在する実行コンテナとセッション同一性を記述するため実行ドメインに属します。適配は外部表現を写像できますがセッションを生成・管理しません。",
        ),
      ),
      entry(
        ["feedback-metrics-evaluation"],
        localized(
          "评估与度量（owner: feedback-metrics-evaluation）属于反馈域，因为它拥有评价目标、测量值和通过阈值；适配域只映射外部基准或结果格式，不改变评价语义。",
          "Evaluation and measurement (owner: feedback-metrics-evaluation) belongs to Feedback because it owns evaluation targets, measurement values, and pass thresholds; Adapter maps external benchmarks or result formats without changing evaluation semantics.",
          "評価と測定（owner: feedback-metrics-evaluation）は評価対象・測定値・合格閾値を所有するためフィードバックドメインに属します。適配は外部ベンチマークや結果形式を写像しますが評価意味を変更しません。",
        ),
      ),
    ]),
  }),
  "tool-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["tool-registry-definition", "tool-discovery-selection"],
        localized(
          "工具域负责能力定义与注册（owner: tool-registry-definition）以及能力发现与选择（owner: tool-discovery-selection），从可调用能力合同一直覆盖到按约束检索和选定候选工具。",
          "Tool owns Capability definition and registration (owner: tool-registry-definition) and Capability discovery and selection (owner: tool-discovery-selection), covering the callable capability contract through constrained retrieval and candidate-tool selection.",
          "ツールドメインは能力定義と登録（owner: tool-registry-definition）および能力発見と選択（owner: tool-discovery-selection）を所有し、呼出可能な能力契約から制約付き検索と候補選択までを扱います。",
        ),
      ),
      entry(
        ["tool-invocation-execution"],
        localized(
          "工具域还负责调用与执行（owner: tool-invocation-execution），描述针对已选能力形成调用请求、参数绑定、工具级尝试及返回结果的语义闭环。",
          "Tool also owns Invocation and execution (owner: tool-invocation-execution), describing the semantic loop from a selected capability through invocation request, argument binding, tool-level attempt, and returned result.",
          "ツールドメインは呼び出しと実行（owner: tool-invocation-execution）も所有し、選択能力から呼出要求・引数束縛・ツール試行・返却結果までの意味的閉ループを記述します。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["orchestration-delegation-handoff"],
        localized(
          "委派与移交（owner: orchestration-delegation-handoff）属于编排域，因为它转移任务责任和协作所有权；把智能体当作工具调用也不会把责任移交语义并入工具合同。",
          "Delegation and handoff (owner: orchestration-delegation-handoff) belongs to Orchestration because it transfers task responsibility and collaboration ownership; invoking an agent as a tool does not merge handoff semantics into the tool contract.",
          "委任と引き継ぎ（owner: orchestration-delegation-handoff）はタスク責任と協働所有権を移転するため編成ドメインに属します。エージェントをツールとして呼んでも移交意味はツール契約へ統合されません。",
        ),
      ),
      entry(
        ["runtime-execution-attempts"],
        localized(
          "执行尝试与结果（owner: runtime-execution-attempts）属于运行域，因为它统一记录智能体运行层的一次实际尝试；工具域只拥有其中的工具调用与工具结果子过程。",
          "Execution attempts and outcomes (owner: runtime-execution-attempts) belongs to Runtime because it records an actual agent-runtime attempt as a whole; Tool owns only the tool-invocation and tool-result subprocess within it.",
          "実行試行と結果（owner: runtime-execution-attempts）はエージェント実行全体の実試行を記録するため実行ドメインに属します。ツールは内部のツール呼出と結果の部分過程だけを所有します。",
        ),
      ),
    ]),
  }),
  "safety-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["safety-trust-boundary", "safety-permission-policy"],
        localized(
          "安全域负责信任边界与数据区（owner: safety-trust-boundary）以及授权与策略决策（owner: safety-permission-policy），先界定主体、资源和信任区，再计算允许、拒绝与约束。",
          "Safety owns Trust boundaries and data zones (owner: safety-trust-boundary) and Authorization and policy decisions (owner: safety-permission-policy), first delimiting actors, resources, and trust zones and then computing permissions, denials, and constraints.",
          "安全ドメインは信頼境界とデータゾーン（owner: safety-trust-boundary）および認可とポリシー判断（owner: safety-permission-policy）を所有し、主体・資源・信頼区を定めて許可・拒否・制約を算出します。",
        ),
      ),
      entry(
        ["safety-commit-redaction"],
        localized(
          "安全域还负责副作用提交控制（owner: safety-commit-redaction），在外部状态真正改变前审查意图、批准范围、可回滚性和提交结果。",
          "Safety also owns Side-effect commit control (owner: safety-commit-redaction), reviewing intent, approved scope, rollback capability, and commit outcome before external state is actually changed.",
          "安全ドメインは副作用コミット制御（owner: safety-commit-redaction）も所有し、外部状態の実変更前に意図・承認範囲・ロールバック可能性・コミット結果を審査します。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["tool-invocation-execution"],
        localized(
          "调用与执行（owner: tool-invocation-execution）属于工具域，因为它定义能力调用、参数和工具结果；安全域授权、限制或拒绝调用，但不复制工具执行语义。",
          "Invocation and execution (owner: tool-invocation-execution) belongs to Tool because it defines capability calls, arguments, and tool results; Safety authorizes, constrains, or denies a call without copying tool-execution semantics.",
          "呼び出しと実行（owner: tool-invocation-execution）は能力呼出・引数・ツール結果を定義するためツールドメインに属します。安全は呼出を認可・制限・拒否しますが実行意味を複製しません。",
        ),
      ),
      entry(
        ["info-output-disclosure"],
        localized(
          "输出披露（owner: info-output-disclosure）属于信息域，因为它组织已允许信息的解释与呈现；安全域决定哪些内容允许离开信任边界，但不拥有输出叙事结构。",
          "Output disclosure (owner: info-output-disclosure) belongs to Info because it organizes explanation and presentation of already-permitted information; Safety decides what may cross a trust boundary without owning the output narrative structure.",
          "出力開示（owner: info-output-disclosure）は許可済み情報の説明と提示を編成するため情報ドメインに属します。安全は信頼境界を越えられる内容を決めますが出力叙述構造を所有しません。",
        ),
      ),
    ]),
  }),
  "feedback-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["feedback-logging", "feedback-metrics-evaluation"],
        localized(
          "反馈域负责日志与遥测（owner: feedback-logging）以及评估与度量（owner: feedback-metrics-evaluation），把观察记录转成可比较的测量、阈值判定和评价证据。",
          "Feedback owns Logging and telemetry (owner: feedback-logging) and Evaluation and measurement (owner: feedback-metrics-evaluation), turning observations into comparable measurements, threshold decisions, and evaluation evidence.",
          "フィードバックドメインはログとテレメトリ（owner: feedback-logging）および評価と測定（owner: feedback-metrics-evaluation）を所有し、観測記録を比較可能な測定・閾値判断・評価証拠へ変換します。",
        ),
      ),
      entry(
        ["feedback-review-optimization"],
        localized(
          "反馈域还负责审查与纠正（owner: feedback-review-optimization），根据评价证据确认缺陷、提出修订并验证纠正是否改善了目标结果。",
          "Feedback also owns Review and correction (owner: feedback-review-optimization), using evaluation evidence to confirm defects, propose revisions, and verify whether a correction improved the target outcome.",
          "フィードバックドメインはレビューと修正（owner: feedback-review-optimization）も所有し、評価証拠から欠陥を確認し、修訂を提案し、修正が対象結果を改善したかを検証します。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["runtime-observability"],
        localized(
          "追踪与检查点（owner: runtime-observability）属于运行域，因为它记录具体执行时序、跨度和检查点身份；反馈域消费这些事实形成评价，而不重建运行追踪。",
          "Tracing and checkpoints (owner: runtime-observability) belongs to Runtime because it records concrete execution chronology, spans, and checkpoint identity; Feedback consumes those facts for evaluation without rebuilding runtime traces.",
          "トレースとチェックポイント（owner: runtime-observability）は具体的実行時系列・スパン・チェックポイント同一性を記録するため実行ドメインに属します。フィードバックは評価に利用しますが追跡を再構築しません。",
        ),
      ),
      entry(
        ["orchestration-evaluation"],
        localized(
          "改进循环编排（owner: orchestration-evaluation）属于编排域，因为它决定何时评估、修订和停止协作循环；反馈域提供评价与纠正证据，但不拥有循环控制流。",
          "Improvement-loop orchestration (owner: orchestration-evaluation) belongs to Orchestration because it decides when a collaboration loop evaluates, revises, and stops; Feedback supplies evaluation and correction evidence without owning loop control flow.",
          "改善ループ編成（owner: orchestration-evaluation）は協働ループの評価・修訂・停止時機を決めるため編成ドメインに属します。フィードバックは評価と修正証拠を提供しますが制御フローを所有しません。",
        ),
      ),
    ]),
  }),
  "memory-plane": Object.freeze({
    includes: Object.freeze([
      entry(
        ["memory-ingestion", "memory-embedding-indexes"],
        localized(
          "记忆域负责记忆接入（owner: memory-ingestion）以及表示与索引（owner: memory-embedding-indexes），把候选内容转成具有来源、表示和可检索身份的持久记忆对象。",
          "Memory owns Memory ingestion (owner: memory-ingestion) and Representations and indexes (owner: memory-embedding-indexes), turning candidate content into persistent memory objects with provenance, representation, and retrievable identity.",
          "記憶ドメインは記憶取り込み（owner: memory-ingestion）および表現と索引（owner: memory-embedding-indexes）を所有し、候補内容を来歴・表現・検索可能な同一性を持つ永続記憶へ変換します。",
        ),
      ),
      entry(
        ["memory-retrieval-ranking", "memory-lifecycle"],
        localized(
          "记忆域还负责检索与排序（owner: memory-retrieval-ranking）以及记忆生命周期（owner: memory-lifecycle），既选择与当前任务最相关的记忆，也管理保留、更新、压缩和删除。",
          "Memory also owns Retrieval and ranking (owner: memory-retrieval-ranking) and Memory lifecycle (owner: memory-lifecycle), selecting memories relevant to the current task while governing retention, update, compaction, and deletion.",
          "記憶ドメインは検索と順位付け（owner: memory-retrieval-ranking）および記憶ライフサイクル（owner: memory-lifecycle）も所有し、現タスクに関連する記憶を選択しつつ保持・更新・圧縮・削除を管理します。",
        ),
      ),
    ]),
    excludes: Object.freeze([
      entry(
        ["info-indexing"],
        localized(
          "上下文发现（owner: info-indexing）属于信息域，因为它定位可供当前上下文使用的信息证据与访问路径；记忆域提供可检索对象和排序结果，但不拥有通用信息发现界面。",
          "Context discovery (owner: info-indexing) belongs to Info because it locates information evidence and access paths for the current context; Memory supplies retrievable objects and rankings without owning the general information-discovery interface.",
          "コンテキスト発見（owner: info-indexing）は現在の文脈で使う情報証拠とアクセス経路を特定するため情報ドメインに属します。記憶は検索対象と順位を供給しますが一般的発見インターフェースを所有しません。",
        ),
      ),
      entry(
        ["runtime-artifacts"],
        localized(
          "运行产物（owner: runtime-artifacts）属于运行域，因为文件、补丁或构建物的身份来自具体执行和版本；记忆域可以保存其引用或摘要，但不重新声明产物所有权。",
          "Runtime artifacts (owner: runtime-artifacts) belongs to Runtime because file, patch, or build identity comes from a concrete execution and version; Memory may retain a reference or summary without redeclaring artifact ownership.",
          "実行成果物（owner: runtime-artifacts）はファイル・パッチ・ビルドの同一性が具体的実行と版に由来するため実行ドメインに属します。記憶は参照や要約を保持できますが成果物所有権を再宣言しません。",
        ),
      ),
    ]),
  }),
});
