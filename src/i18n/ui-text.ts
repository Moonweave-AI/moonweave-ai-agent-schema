export type Language = "zh" | "en" | "ja";

export const deprecationLineageText: Readonly<Record<Language, string>> = Object.freeze({
  zh: "替代的已弃用概念",
  en: "Replaces deprecated concepts",
  ja: "置き換えた廃止概念",
});

export interface OntologyUiText {
  readonly title: string;
  readonly viewer: string;
  readonly searchPlaceholder: string;
  readonly browseOntology: string;
  readonly searchOntology: string;
  readonly searchResults: string;
  readonly ontologyGraph: string;
  readonly hierarchy: string;
  readonly sceneBudgetReached: string;
  readonly concepts: string;
  readonly semanticRelations: string;
  readonly structureFields: string;
  readonly domainContents: string;
  readonly ontologyScale: string;
  readonly details: string;
  readonly sourcesGovernance: string;
  readonly logicalPosition: string;
  readonly primaryParent: string;
  readonly additionalParents: string;
  readonly directChildren: string;
  readonly definitionBoundary: string;
  readonly shortDefinition: string;
  readonly formalDefinition: string;
  readonly whyNeeded: string;
  readonly includes: string;
  readonly excludes: string;
  readonly confusedWith: string;
  readonly incomingRelations: string;
  readonly outgoingRelations: string;
  readonly engineeringExplanation: string;
  readonly lifecyclePosition: string;
  readonly solvesProblem: string;
  readonly typicalInput: string;
  readonly typicalOutput: string;
  readonly positiveExamples: string;
  readonly counterexamples: string;
  readonly instanceExamples: string;
  readonly structureConstraints: string;
  readonly validationRules: string;
  readonly caseFragments: string;
  readonly externalMappings: string;
  readonly sourceClaims: string;
  readonly maturityChanges: string;
  readonly showAll: (total: number) => string;
  readonly showingCount: (shown: number, total: number) => string;
  readonly collapseList: string;
  readonly focusNode: (label: string) => string;
  readonly focusRelation: (label: string) => string;
  readonly backToNode: string;
  readonly highlightCase: string;
  readonly clearCaseHighlight: string;
  readonly expandAdjacentNodes: (count: number) => string;
  readonly caseNextSteps: (count: number) => string;
  readonly expandNode: string;
  readonly syntheticExample: string;
  readonly realExample: string;
  readonly referenceExample: string;
  readonly verifiedVersion: string;
  readonly notApplicable: string;
  readonly noInformation: string;
  readonly organizationalNodeInstanceNote: string;
  readonly graphEmptyTitle: string;
  readonly graphEmptyBody: string;
  readonly rootRepairNotice: string;
  readonly invalidFocusNotice: string;
  readonly dataIntegrityError: (count: number, references: string) => string;
  readonly caseReferenceError: string;
  readonly derivedRelationLabels: Readonly<Record<string, string>>;
  readonly derivedRelationDefinitions: Readonly<Record<string, string>>;
  readonly status: string;
  readonly iri: string;
  readonly versionIri: string;
  readonly source: string;
  readonly domains: string;
  readonly modules: string;
  readonly visibleConcepts: string;
  readonly visibleEdges: string;
  readonly fields: string;
  readonly localFields: string;
  readonly inheritedFields: string;
  readonly declaredOn: string;
  readonly inheritanceDepth: string;
  readonly constraints: string;
  readonly controlledValues: string;
  readonly sourceClaimCount: string;
  readonly relationId: string;
  readonly relationStatement: string;
  readonly direction: string;
  readonly relationKind: string;
  readonly endpointRestrictions: string;
  readonly cardinality: string;
  readonly inverseReading: string;
  readonly conditions: string;
  readonly temporalScope: string;
  readonly introduced: string;
  readonly deprecated: string;
  readonly replacements: string;
  readonly changeNote: string;
  readonly identityKeys: string;
  readonly minimumJson: string;
  readonly fieldDatatype: string;
  readonly required: string;
  readonly allowedValues: string;
  readonly pattern: string;
  readonly exampleValue: string;
  readonly expectedResult: string;
  readonly fieldValues: string;
  readonly severity: string;
  readonly expression: string;
  readonly expressionLanguage: string;
  readonly supports: string;
  readonly locator: string;
  readonly authority: string;
  readonly priority: string;
  readonly year: string;
  readonly scenario: string;
  readonly previousStep: string;
  readonly currentStep: string;
  readonly nextStep: string;
  readonly mappingDirection: string;
  readonly mappingVersion: string;
  readonly mappingScope: string;
  readonly mappingKind: string;
  readonly mappingLoss: string;
  readonly conversionNote: string;
  readonly mappingConformance: string;
  readonly conformanceStatus: string;
  readonly conformanceTestId: string;
  readonly conformanceMethod: string;
  readonly targetConcept: string;
  readonly semanticKind: string;
  readonly applicability: string;
  readonly interactionContract: string;
  readonly taxonomyContract: string;
  readonly competencyQuestions: string;
  readonly requiredRelationConstraints: string;
  readonly review: string;
  readonly reviewers: string;
  readonly boundaryContext: string;
  readonly distinctFactRationale: string;
  readonly deprecationReason: string;
  readonly hygieneGates: string;
  readonly ontologyKind: string;
  readonly planeKind: string;
  readonly moduleKind: string;
  readonly conceptKind: string;
  readonly relationKindLabel: string;
  readonly buildIdentity: string;
  readonly buildIdentityLoading: string;
  readonly buildIdentityUnavailable: string;
  readonly buildIdentityMismatch: string;
  readonly buildCommit: string;
  readonly ontologyFingerprint: string;
  readonly darkTheme: string;
  readonly lightTheme: string;
  readonly downloadJson: string;
  readonly collapseDirectory: string;
  readonly expandDirectory: string;
  readonly noSearchResults: string;
  readonly derivedRelation: string;
  readonly canonicalRelation: string;
}

export const uiText: Readonly<Record<Language, OntologyUiText>> = {
  zh: {
    title: "本体查看器",
    viewer: "查看器",
    searchPlaceholder: "领域、模块、概念、关系、来源、案例",
    browseOntology: "浏览智能体本体层级",
    searchOntology: "搜索本体",
    searchResults: "搜索结果",
    ontologyGraph: "本体图谱",
    hierarchy: "逻辑层级与语义关系",
    sceneBudgetReached: "当前详情范围已达到显示上限，可通过目录继续定位其他节点",
    concepts: "概念",
    semanticRelations: "语义关系",
    structureFields: "结构字段",
    domainContents: "领域内容",
    ontologyScale: "本体规模",
    details: "节点与关系详细信息",
    sourcesGovernance: "来源与治理信息",
    logicalPosition: "逻辑定位",
    primaryParent: "直接上位概念",
    additionalParents: "其他上位概念",
    directChildren: "直接下位概念",
    definitionBoundary: "定义与边界",
    shortDefinition: "简要定义",
    formalDefinition: "正式定义",
    whyNeeded: "为什么需要",
    includes: "包含",
    excludes: "不包含",
    confusedWith: "易混淆项",
    incomingRelations: "入边",
    outgoingRelations: "出边",
    engineeringExplanation: "工程解释",
    lifecyclePosition: "Agent 生命周期位置",
    solvesProblem: "解决的问题",
    typicalInput: "典型输入",
    typicalOutput: "典型输出",
    positiveExamples: "正例",
    counterexamples: "反例与边界例",
    instanceExamples: "实例说明",
    structureConstraints: "结构与约束",
    validationRules: "公理与验证",
    caseFragments: "主案例片段",
    externalMappings: "适配映射",
    sourceClaims: "来源与引用",
    maturityChanges: "成熟度与变更",
    showAll: (total) => `展开全部（共 ${total} 项）`,
    showingCount: (shown, total) => `已显示 ${shown} / 共 ${total} 项`,
    collapseList: "收起",
    focusNode: (label) => `已选择：${label}`,
    focusRelation: (label) => `已选择关系：${label}`,
    backToNode: "返回节点说明",
    highlightCase: "在当前图谱中高亮此案例",
    clearCaseHighlight: "退出案例高亮",
    expandAdjacentNodes: (count) => `展开相邻节点（+${count}）`,
    caseNextSteps: (count) => `案例下一步（+${count}）`,
    expandNode: "显式展开下一级",
    syntheticExample: "合成示例",
    realExample: "真实记录引用",
    referenceExample: "参考记录",
    verifiedVersion: "核验版本",
    notApplicable: "不适用",
    noInformation: "本节点暂无经审核的对应信息",
    organizationalNodeInstanceNote: "本节点为领域/模块组织节点，不适用实例说明",
    graphEmptyTitle: "图谱层级数据不完整",
    graphEmptyBody: "当前节点缺少可解析的上位归属、下位概念或语义关系，请检查 canonical 层级数据。",
    rootRepairNotice: "链接中的图谱语境无法容纳焦点，已按该节点的规范主路径修复。",
    invalidFocusNotice: "链接中的焦点不存在；已保留有效的图谱语境，请从当前图谱重新选择。",
    dataIntegrityError: (count, references) => `Canonical 数据存在 ${count} 项未解析引用；有效图谱仍可浏览。请修复：${references}`,
    caseReferenceError: "案例路径引用不完整，修复下列 ID 后方可高亮：",
    derivedRelationLabels: {
      contains_domain: "包含领域",
      contains_module: "包含模块",
      declares_concept: "声明概念",
    },
    derivedRelationDefinitions: {
      contains_domain: "查看器依据 canonical 领域数组派生的组织关系，不是另存的本体事实。",
      contains_module: "查看器依据模块的 plane_id 派生的组织关系，不是另存的本体事实。",
      declares_concept: "查看器依据概念的 module_id 与规范主路径派生的目录归属，不是另存的本体事实。",
    },
    status: "状态",
    iri: "IRI",
    versionIri: "版本 IRI",
    source: "来源",
    domains: "领域",
    modules: "模块",
    visibleConcepts: "可见节点",
    visibleEdges: "可见边",
    fields: "结构字段",
    localFields: "本地声明字段",
    inheritedFields: "继承字段",
    declaredOn: "声明于概念",
    inheritanceDepth: "继承深度",
    constraints: "约束",
    controlledValues: "受控值",
    sourceClaimCount: "来源主张",
    relationId: "关系 ID",
    relationStatement: "关系表达",
    direction: "方向",
    relationKind: "关系类型",
    endpointRestrictions: "端点限制",
    cardinality: "基数",
    inverseReading: "逆向读法",
    conditions: "条件",
    temporalScope: "时间范围",
    introduced: "引入版本",
    deprecated: "弃用版本",
    replacements: "替代项",
    changeNote: "变更说明",
    identityKeys: "标识字段",
    minimumJson: "最小 JSON 片段",
    fieldDatatype: "数据类型",
    required: "必填",
    allowedValues: "允许值",
    pattern: "格式模式",
    exampleValue: "示例值",
    expectedResult: "预期结果",
    fieldValues: "字段取值",
    severity: "严重级别",
    expression: "验证表达式",
    expressionLanguage: "表达式语言",
    supports: "支持的主张",
    locator: "定位",
    authority: "权威类型",
    priority: "优先级",
    year: "年份",
    scenario: "场景",
    previousStep: "前一步",
    currentStep: "当前步骤",
    nextStep: "后一步",
    mappingDirection: "映射方向",
    mappingVersion: "外部版本",
    mappingScope: "映射范围",
    mappingKind: "映射类型",
    mappingLoss: "映射损失",
    conversionNote: "转换说明",
    mappingConformance: "一致性验证",
    conformanceStatus: "验证状态",
    conformanceTestId: "验证测试 ID",
    conformanceMethod: "验证方法",
    targetConcept: "目标概念",
    semanticKind: "语义种类",
    applicability: "适用范围",
    interactionContract: "交互合同",
    taxonomyContract: "分类合同",
    competencyQuestions: "能力问题",
    requiredRelationConstraints: "必要关系约束",
    review: "审查决定",
    reviewers: "审查者",
    boundaryContext: "边界上下文",
    distinctFactRationale: "独立事实理由",
    deprecationReason: "弃用原因",
    hygieneGates: "卫生门禁",
    ontologyKind: "本体",
    planeKind: "领域",
    moduleKind: "模块",
    conceptKind: "概念",
    relationKindLabel: "关系",
    buildIdentity: "构建身份",
    buildIdentityLoading: "正在核验构建信息",
    buildIdentityUnavailable: "构建信息暂不可用",
    buildIdentityMismatch: "构建信息与当前本体不一致",
    buildCommit: "提交",
    ontologyFingerprint: "本体指纹",
    darkTheme: "暗色",
    lightTheme: "亮色",
    downloadJson: "JSON",
    collapseDirectory: "收起",
    expandDirectory: "展开目录",
    noSearchResults: "没有匹配的本体节点",
    derivedRelation: "派生组织边",
    canonicalRelation: "Canonical 关系",
  },
  en: {
    invalidFocusNotice: "The linked focus does not exist; the valid graph context was preserved so you can select again.",
    dataIntegrityError: (count, references) => `Canonical data contains ${count} unresolved references; the valid graph remains browsable. Repair: ${references}`,
    caseReferenceError: "This case path has incomplete references. Repair these IDs before highlighting:",
    derivedRelationLabels: { contains_domain: "contains domain", contains_module: "contains module", declares_concept: "declares concept" },
    derivedRelationDefinitions: { contains_domain: "A viewer-derived organization relation based on the canonical domains array; it is not a separately stored ontology fact.", contains_module: "A viewer-derived organization relation based on module plane_id; it is not a separately stored ontology fact.", declares_concept: "A viewer-derived directory ownership relation based on concept module_id and its canonical primary path; it is not a separately stored ontology fact." },
    confusedWith: "Commonly confused with",
    versionIri: "Version IRI",
    verifiedVersion: "Verified version",
    currentStep: "Current step",
    mappingVersion: "External version",
    mappingScope: "Mapping scope",
    mappingKind: "Mapping kind",
    conversionNote: "Conversion note",
    mappingConformance: "Conformance",
    conformanceStatus: "Conformance status",
    conformanceTestId: "Conformance test ID",
    conformanceMethod: "Conformance method",
    sceneBudgetReached: "The detail scope has reached its display limit. Use the directory to locate another node.",
    title: "Ontology Viewer", viewer: "Viewer", searchPlaceholder: "domains, modules, concepts, relations, sources, cases", browseOntology: "Browse the Agent ontology hierarchy", searchOntology: "Search ontology", searchResults: "Search results", ontologyGraph: "Ontology graph", hierarchy: "Logical hierarchy and semantic relations", concepts: "Concepts", semanticRelations: "Semantic relations", structureFields: "Structure fields", domainContents: "Domain contents", ontologyScale: "Ontology scale", details: "Node and relation details", sourcesGovernance: "Sources and governance", logicalPosition: "Logical position", primaryParent: "Direct broader concept", additionalParents: "Additional broader concepts", directChildren: "Direct narrower concepts", definitionBoundary: "Definition and boundary", shortDefinition: "Short definition", formalDefinition: "Formal definition", whyNeeded: "Why this concept is needed", includes: "Includes", excludes: "Excludes", incomingRelations: "Incoming relations", outgoingRelations: "Outgoing relations", engineeringExplanation: "Engineering explanation", lifecyclePosition: "Agent lifecycle position", solvesProblem: "Problem addressed", typicalInput: "Typical input", typicalOutput: "Typical output", positiveExamples: "Positive examples", counterexamples: "Counterexamples and boundary cases", instanceExamples: "Instance examples", structureConstraints: "Structure and constraints", validationRules: "Axioms and validation", caseFragments: "Case fragments", externalMappings: "External mappings", sourceClaims: "Source claims", maturityChanges: "Maturity and change history", showAll: (total) => `Show all (${total} items)`, showingCount: (shown, total) => `Showing ${shown} of ${total} items`, collapseList: "Collapse", focusNode: (label) => `Selected: ${label}`, focusRelation: (label) => `Selected relation: ${label}`, backToNode: "Back to node details", highlightCase: "Highlight this case in the current graph", clearCaseHighlight: "Clear case highlight", expandAdjacentNodes: (count) => `Expand adjacent nodes (+${count})`, caseNextSteps: (count) => `Next case steps (+${count})`, expandNode: "Explicitly expand next level", syntheticExample: "Synthetic example", realExample: "Real record reference", referenceExample: "Reference record", notApplicable: "Not applicable", noInformation: "No reviewed information is available for this node", organizationalNodeInstanceNote: "This Domain/Module organization node does not use instance examples", graphEmptyTitle: "Incomplete graph hierarchy data", graphEmptyBody: "The current node has no resolvable parent ownership, narrower concept, or semantic relation. Check the canonical hierarchy data.", rootRepairNotice: "The linked graph context could not contain the focus and was repaired using its canonical primary path.", status: "Status", iri: "IRI", source: "Source", domains: "Domains", modules: "Modules", visibleConcepts: "Visible nodes", visibleEdges: "Visible edges", fields: "Structure fields", localFields: "Locally declared fields", inheritedFields: "Inherited fields", declaredOn: "Declared on concept", inheritanceDepth: "Inheritance depth", constraints: "Constraints", controlledValues: "Controlled values", sourceClaimCount: "Source claims", relationId: "Relation ID", relationStatement: "Relation statement", direction: "Direction", relationKind: "Relation kind", endpointRestrictions: "Endpoint restrictions", cardinality: "Cardinality", inverseReading: "Inverse reading", conditions: "Conditions", temporalScope: "Temporal scope", introduced: "Introduced in", deprecated: "Deprecated in", replacements: "Replacements", changeNote: "Change note", identityKeys: "Identity keys", minimumJson: "Minimal JSON fragment", fieldDatatype: "Datatype", required: "Required", allowedValues: "Allowed values", pattern: "Pattern", exampleValue: "Example value", expectedResult: "Expected result", fieldValues: "Field values", severity: "Severity", expression: "Validation expression", expressionLanguage: "Expression language", supports: "Supported claim", locator: "Locator", authority: "Authority", priority: "Priority", year: "Year", scenario: "Scenario", previousStep: "Previous step", nextStep: "Next step", mappingDirection: "Mapping direction", mappingLoss: "Mapping loss", targetConcept: "Target concept", semanticKind: "Semantic kind", applicability: "Applicability", interactionContract: "Interaction contract", taxonomyContract: "Taxonomy contract", competencyQuestions: "Competency questions", requiredRelationConstraints: "Required relation constraints", review: "Review decision", reviewers: "Reviewers", boundaryContext: "Boundary context", distinctFactRationale: "Distinct-fact rationale", deprecationReason: "Deprecation reason", hygieneGates: "Hygiene gates", ontologyKind: "Ontology", planeKind: "Domain", moduleKind: "Module", conceptKind: "Concept", relationKindLabel: "Relation", buildIdentity: "Build identity", buildIdentityLoading: "Verifying build information", buildIdentityUnavailable: "Build information is temporarily unavailable", buildIdentityMismatch: "Build information does not match the bundled ontology", buildCommit: "Commit", ontologyFingerprint: "Ontology fingerprint", darkTheme: "Dark", lightTheme: "Light", downloadJson: "JSON", collapseDirectory: "Collapse", expandDirectory: "Expand directory", noSearchResults: "No ontology nodes match", derivedRelation: "Derived organization edge", canonicalRelation: "Canonical relation",
  },
  ja: {
    invalidFocusNotice: "リンク先の焦点が存在しないため、有効なグラフ文脈を維持しました。現在のグラフから選び直してください。",
    dataIntegrityError: (count, references) => `Canonical データに ${count} 件の未解決参照があります。有効なグラフは引き続き閲覧できます。修復対象：${references}`,
    caseReferenceError: "ケース経路の参照が不完全です。強調表示する前に次の ID を修復してください：",
    derivedRelationLabels: { contains_domain: "ドメインを含む", contains_module: "モジュールを含む", declares_concept: "概念を宣言する" },
    derivedRelationDefinitions: { contains_domain: "canonical のドメイン配列からビューアが派生した組織関係であり、別に保存された本体事実ではありません。", contains_module: "モジュールの plane_id からビューアが派生した組織関係であり、別に保存された本体事実ではありません。", declares_concept: "概念の module_id と canonical 主経路からビューアが派生したディレクトリ所属であり、別に保存された本体事実ではありません。" },
    confusedWith: "混同しやすい項目",
    versionIri: "バージョン IRI",
    verifiedVersion: "検証済みバージョン",
    currentStep: "現在の手順",
    mappingVersion: "外部バージョン",
    mappingScope: "マッピング範囲",
    mappingKind: "マッピング種別",
    conversionNote: "変換注記",
    mappingConformance: "適合性検証",
    conformanceStatus: "検証状態",
    conformanceTestId: "検証テスト ID",
    conformanceMethod: "検証方法",
    sceneBudgetReached: "詳細範囲が表示上限に達しました。別のノードはディレクトリから選択できます。",
    title: "本体ビューア", viewer: "ビューア", searchPlaceholder: "ドメイン、モジュール、概念、関係、出典、ケース", browseOntology: "Agent 本体階層を閲覧", searchOntology: "本体を検索", searchResults: "検索結果", ontologyGraph: "本体グラフ", hierarchy: "論理階層と意味関係", concepts: "概念", semanticRelations: "意味関係", structureFields: "構造フィールド", domainContents: "ドメイン内容", ontologyScale: "本体規模", details: "ノードと関係の詳細", sourcesGovernance: "出典とガバナンス", logicalPosition: "論理的位置", primaryParent: "直接上位概念", additionalParents: "その他の上位概念", directChildren: "直接下位概念", definitionBoundary: "定義と境界", shortDefinition: "短い定義", formalDefinition: "正式な定義", whyNeeded: "この概念が必要な理由", includes: "含む", excludes: "含まない", incomingRelations: "入ってくる関係", outgoingRelations: "出ていく関係", engineeringExplanation: "工学的説明", lifecyclePosition: "Agent ライフサイクル上の位置", solvesProblem: "解決する問題", typicalInput: "代表的入力", typicalOutput: "代表的出力", positiveExamples: "正例", counterexamples: "反例と境界例", instanceExamples: "インスタンス例", structureConstraints: "構造と制約", validationRules: "公理と検証", caseFragments: "主要ケース断片", externalMappings: "外部マッピング", sourceClaims: "出典主張", maturityChanges: "成熟度と変更履歴", showAll: (total) => `すべて展開（全 ${total} 件）`, showingCount: (shown, total) => `${shown} / ${total} 件を表示`, collapseList: "折りたたむ", focusNode: (label) => `選択済み：${label}`, focusRelation: (label) => `関係を選択：${label}`, backToNode: "ノード説明へ戻る", highlightCase: "現在のグラフでこのケースを強調", clearCaseHighlight: "ケース強調を終了", expandAdjacentNodes: (count) => `隣接ノードを展開（+${count}）`, caseNextSteps: (count) => `ケースの次の手順（+${count}）`, expandNode: "次の階層を明示的に展開", syntheticExample: "合成例", realExample: "実記録参照", referenceExample: "参照記録", notApplicable: "適用外", noInformation: "このノードに対応するレビュー済み情報はありません", organizationalNodeInstanceNote: "このドメイン／モジュール組織ノードにはインスタンス説明を適用しません", graphEmptyTitle: "グラフ階層データが不完全です", graphEmptyBody: "現在のノードには解決可能な上位所属、下位概念、意味関係がありません。canonical 階層データを確認してください。", rootRepairNotice: "リンクのグラフ文脈が焦点を含められないため、canonical 主経路で修復しました。", status: "状態", iri: "IRI", source: "出典", domains: "ドメイン", modules: "モジュール", visibleConcepts: "表示ノード", visibleEdges: "表示エッジ", fields: "構造フィールド", localFields: "ローカル宣言フィールド", inheritedFields: "継承フィールド", declaredOn: "宣言元の概念", inheritanceDepth: "継承の深さ", constraints: "制約", controlledValues: "統制値", sourceClaimCount: "出典主張", relationId: "関係 ID", relationStatement: "関係表現", direction: "方向", relationKind: "関係種別", endpointRestrictions: "端点制限", cardinality: "基数", inverseReading: "逆方向の読み", conditions: "条件", temporalScope: "時間範囲", introduced: "導入版", deprecated: "廃止版", replacements: "代替", changeNote: "変更注記", identityKeys: "識別キー", minimumJson: "最小 JSON 断片", fieldDatatype: "データ型", required: "必須", allowedValues: "許容値", pattern: "パターン", exampleValue: "例の値", expectedResult: "期待結果", fieldValues: "フィールド値", severity: "重大度", expression: "検証式", expressionLanguage: "式言語", supports: "支持する主張", locator: "位置", authority: "権威種別", priority: "優先度", year: "年", scenario: "シナリオ", previousStep: "前の手順", nextStep: "次の手順", mappingDirection: "写像方向", mappingLoss: "写像損失", targetConcept: "対象概念", semanticKind: "意味種別", applicability: "適用範囲", interactionContract: "相互作用契約", taxonomyContract: "分類契約", competencyQuestions: "能力質問", requiredRelationConstraints: "必須関係制約", review: "レビュー決定", reviewers: "レビュー担当者", boundaryContext: "境界文脈", distinctFactRationale: "独立事実の根拠", deprecationReason: "廃止理由", hygieneGates: "衛生ゲート", ontologyKind: "本体", planeKind: "ドメイン", moduleKind: "モジュール", conceptKind: "概念", relationKindLabel: "関係", buildIdentity: "ビルド識別情報", buildIdentityLoading: "ビルド情報を検証中", buildIdentityUnavailable: "ビルド情報は現在利用できません", buildIdentityMismatch: "ビルド情報が同梱された本体と一致しません", buildCommit: "コミット", ontologyFingerprint: "本体フィンガープリント", darkTheme: "暗色", lightTheme: "明色", downloadJson: "JSON", collapseDirectory: "折りたたむ", expandDirectory: "目次を展開", noSearchResults: "一致する本体ノードはありません", derivedRelation: "派生組織エッジ", canonicalRelation: "Canonical 関係",
  },
};
