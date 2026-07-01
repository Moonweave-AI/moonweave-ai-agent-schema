import cytoscape from "cytoscape";
import cytoscapeFcose from "cytoscape-fcose";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import canonicalOntologyData from "../ontology/agent-ontology.json";
import { relaxLiveForceFrame } from "./lib/live-force";
import type { LiveForceEdge, LiveForceNode, LiveForceVelocity } from "./lib/live-force";

type EntityKind = "domain" | "plane" | "module" | "class";
type Maturity = "release" | "provisional" | "informative" | "mixed";
type Language = "zh" | "en" | "ja";
type ThemeMode = "dark" | "light";
type LocalizedDefinitions = Partial<Record<Language, string>>;

interface SourceBacked {
  source_ids?: string[];
}

interface DefinitionBacked {
  definition: string;
  definitions?: LocalizedDefinitions;
}

interface Plane extends SourceBacked, DefinitionBacked {
  id: string;
  label: string;
  term_ids: string[];
  module_ids: string[];
}

interface Module extends SourceBacked, DefinitionBacked {
  id: string;
  plane_id: string;
  label: string;
  class_ids: string[];
}

interface OntologyClass extends SourceBacked, DefinitionBacked {
  id: string;
  kind: string;
  plane_id: string;
  module_id: string;
  label: string;
}

interface ObjectProperty extends SourceBacked, DefinitionBacked {
  id: string;
  label: string;
  family: string;
  domain: string;
  range: string;
  acyclic: boolean;
}

interface DataProperty extends SourceBacked, DefinitionBacked {
  id: string;
  label: string;
  domain: string;
  range: string;
}

interface Individual extends SourceBacked, DefinitionBacked {
  id: string;
  label: string;
  class_id: string;
}

interface Axiom extends SourceBacked {
  id: string;
  type: string;
  statement: string;
  definitions?: LocalizedDefinitions;
}

interface AdapterMapping extends SourceBacked {
  adapter: string;
  maps_to: string[];
}

interface AgentOntology {
  id: string;
  label: string;
  definition: string;
  definitions?: LocalizedDefinitions;
  status: string;
  artifact_metadata: {
    base_iri: string;
    version_iri: string;
  };
  ontology_metrics: Record<string, number>;
  planes: Plane[];
  modules: Module[];
  classes: OntologyClass[];
  object_properties: ObjectProperty[];
  data_properties: DataProperty[];
  individuals: Individual[];
  axioms: Axiom[];
  adapter_mappings: AdapterMapping[];
  hygiene_gates: string[];
}

interface DirectoryItem {
  ref: string;
  id: string;
  kind: EntityKind;
  label: string;
  definition: string;
  definitions?: LocalizedDefinitions;
  maturity: Maturity;
  source_ids: string[];
  parent_ref?: string;
  plane_id?: string;
  module_id?: string;
}

const ontology = canonicalOntologyData as unknown as AgentOntology;
cytoscape.use(cytoscapeFcose);
const concreteOntologyIds = new Set([
  ontology.id,
  ...ontology.planes.map((plane) => plane.id),
  ...ontology.modules.map((module) => module.id),
  ...ontology.classes.map((klass) => klass.id)
]);
const hiddenAxiomTypes = new Set(["domain-range", "datatype-range", "module-membership"]);

type FcoseRelativePlacementConstraint =
  | { top: string; bottom: string; gap: number }
  | { left: string; right: string; gap: number };

interface CytoscapeGraphModel {
  elements: cytoscape.ElementDefinition[];
  nodeCount: number;
  edgeCount: number;
}

type FcoseQuality = "draft" | "default" | "proof";

const cytoscapeThemeColors: Record<
  ThemeMode,
  {
    bg: string;
    panel: string;
    text: string;
    muted: string;
    border: string;
    cyan: string;
    lilac: string;
    thread: string;
    mint: string;
    blush: string;
  }
> = {
  dark: {
    bg: "#060816",
    panel: "#10162a",
    text: "#fff8e8",
    muted: "#a6aed0",
    border: "#415078",
    cyan: "#74ecff",
    lilac: "#cba9ff",
    thread: "#8ddcff",
    mint: "#69efae",
    blush: "#f5a5cb"
  },
  light: {
    bg: "#f5f6fb",
    panel: "#ffffff",
    text: "#1d2440",
    muted: "#68708d",
    border: "#a9b3d2",
    cyan: "#067fa4",
    lilac: "#7c56c4",
    thread: "#1772b8",
    mint: "#158953",
    blush: "#b94d82"
  }
};

function cytoscapeAccentForKind(kind: EntityKind, theme: ThemeMode): string {
  const colors = cytoscapeThemeColors[theme];
  const accents: Record<EntityKind, string> = {
    domain: colors.cyan,
    plane: colors.lilac,
    module: colors.thread,
    class: colors.mint
  };
  return accents[kind];
}

function cytoscapeStyles(theme: ThemeMode): cytoscape.StylesheetJson {
  const colors = cytoscapeThemeColors[theme];

  return [
    {
      selector: "node",
      style: {
        width: "data(size)",
        height: "data(size)",
        "background-color": "data(accent)",
        "background-opacity": theme === "dark" ? 0.92 : 0.95,
        "border-width": 1.4,
        "border-color": theme === "dark" ? colors.border : colors.text,
        color: colors.text,
        label: "data(label)",
        "font-family": "Aptos, Segoe UI, Noto Sans SC, Noto Sans JP, sans-serif",
        "font-size": "data(fontSize)",
        "font-weight": "bold",
        "line-height": 1.12,
        "text-wrap": "wrap",
        "text-max-width": "260px",
        "text-valign": "center",
        "text-halign": (node: cytoscape.NodeSingular) => node.data("labelHalign") as "left" | "right",
        "text-margin-x": (node: cytoscape.NodeSingular) => Number(node.data("labelMarginX") ?? 14),
        "text-margin-y": 0,
        "text-outline-width": theme === "dark" ? 2 : 0,
        "text-outline-color": colors.bg,
        "min-zoomed-font-size": 9,
        "overlay-opacity": 0,
        "transition-property": "border-width, background-opacity",
        "transition-duration": 160
      }
    },
    {
      selector: "node.is-root",
      style: {
        width: 28,
        height: 28,
        "font-size": 17,
        "border-width": 2.4,
        "background-opacity": 1
      }
    },
    {
      selector: "node.expandable",
      style: {
        "border-width": 1.6
      }
    },
    {
      selector: "node.collapsed",
      style: {
        "border-style": "dashed"
      }
    },
    {
      selector: "node:selected",
      style: {
        "border-width": 3,
        "background-opacity": 1
      }
    },
    {
      selector: "edge",
      style: {
        width: 3.05,
        "curve-style": "straight",
        "line-color": theme === "dark" ? colors.thread : "#c7cad2",
        "line-opacity": theme === "dark" ? 0.66 : 0.78,
        "target-arrow-color": theme === "dark" ? colors.thread : "#bfc2ca",
        "target-arrow-shape": "triangle",
        "arrow-scale": 1.12,
        label: "",
        color: colors.muted,
        "font-family": "Cascadia Code, JetBrains Mono, Consolas, monospace",
        "font-size": 12,
        "font-weight": "bold",
        "text-background-color": colors.bg,
        "text-background-opacity": theme === "dark" ? 0.62 : 0.72,
        "text-background-padding": "2px",
        "text-rotation": "autorotate",
        "text-margin-y": -5,
        "min-zoomed-font-size": 8,
        "overlay-opacity": 0
      }
    },
    {
      selector: "edge.edge-semantic",
      style: {
        width: 2.6,
        "line-color": colors.cyan,
        "target-arrow-color": colors.cyan,
        "line-opacity": theme === "dark" ? 0.76 : 0.82
      }
    },
    {
      selector: "edge.is-hover-edge",
      style: {
        label: "data(label)",
        width: 3.3,
        "line-opacity": 0.96,
        "line-color": colors.cyan,
        "target-arrow-color": colors.cyan,
        color: colors.text,
        "font-size": 12.5,
        "text-background-opacity": theme === "dark" ? 0.84 : 0.9
      }
    },
    {
      selector: "node.is-hover-node",
      style: {
        "border-width": 3,
        "background-opacity": 1
      }
    },
    {
      selector: "node.is-dragging",
      style: {
        "border-width": 4,
        "border-color": colors.cyan,
        "background-opacity": 1
      }
    },
    {
      selector: "edge.edge-hierarchy",
      style: {
        "line-color": theme === "dark" ? colors.thread : "#c7cad2",
        "target-arrow-color": theme === "dark" ? colors.thread : "#bfc2ca"
      }
    },
    {
      selector: "edge:selected",
      style: {
        width: 2.8,
        "line-color": colors.lilac,
        "target-arrow-color": colors.lilac
      }
    }
  ];
}

const uiText = {
  zh: {
    languageName: "中文",
    skip: "跳到本体内容",
    brandEyebrow: "Moonweave 智能体本体",
    title: "本体查看器",
    viewer: "查看器",
    downloadJson: "下载 JSON",
    openLeft: "目录",
    closeLeft: "收起",
    openRight: "信息",
    closeRight: "收起",
    filters: "筛选",
    search: "搜索本体",
    searchPlaceholder: "类、模块、平面、来源",
    all: "全部",
    domainFilter: "领域",
    adapterFilter: "适配器",
    trustFilter: "信任",
    language: "语言",
    theme: "主题",
    darkTheme: "暗色",
    lightTheme: "亮色",
    path: "本体路径",
    entityDetail: "本体实体详情",
    structure: "结构",
    hierarchy: "根节点语义邻域",
    nodesEdges: (nodes: number, edges: number) => `${nodes} 个节点 / ${edges} 条边`,
    status: "状态",
    iri: "IRI",
    sources: "来源",
    modules: "模块",
    classes: "类",
    objectProperties: "关系谓词",
    dataProperties: "数据字段",
    planeContents: "平面内容",
    moduleContents: "模块内容",
    relations: "与当前根节点相关的类间关系",
    scalarFields: "当前根节点可用的字面量字段",
    ontologyMetrics: "本体统计",
    maturity: "成熟度",
    evidence: "证据",
    axioms: "公理",
    individuals: "个体",
    adapterMapping: "适配映射",
    browseDomains: "浏览智能体本体领域",
    browseLogs: "浏览本体记录",
    ontologicalCharacteristic: "本体特征",
    metaInformation: "元信息",
    instanceClassification: "实例分类",
    hasPart: "组成部分",
    containsClasses: "包含类",
    relationPredicates: "关系谓词",
    literalFields: "字面量字段",
    graphEmptyTitle: "没有可展示的图谱",
    graphEmptyBody: "没有可展示的下一级节点或关系。该实体仍可在本体特征表中查看定义、来源和字段信息。",
    classCount: (count: number) => `${count} 个类`,
    selectedJsonName: "agent-ontology.json"
  },
  en: {
    languageName: "English",
    skip: "Skip to ontology content",
    brandEyebrow: "Moonweave Agent Ontology",
    title: "Ontology Viewer",
    viewer: "Viewer",
    downloadJson: "Download JSON",
    openLeft: "Directory",
    closeLeft: "Collapse",
    openRight: "Metadata",
    closeRight: "Collapse",
    filters: "Filters",
    search: "Search ontology",
    searchPlaceholder: "Class, module, plane, source",
    all: "All",
    domainFilter: "Domains",
    adapterFilter: "Adapters",
    trustFilter: "Trust",
    language: "Language",
    theme: "Theme",
    darkTheme: "Dark",
    lightTheme: "Light",
    path: "Ontology path",
    entityDetail: "Ontology entity detail",
    structure: "Structure",
    hierarchy: "Rooted semantic neighborhood",
    nodesEdges: (nodes: number, edges: number) => `${nodes} nodes / ${edges} edges`,
    status: "Status",
    iri: "IRI",
    sources: "Sources",
    modules: "Modules",
    classes: "Classes",
    objectProperties: "Relation predicates",
    dataProperties: "Data fields",
    planeContents: "Plane contents",
    moduleContents: "Module contents",
    relations: "Class-to-class predicates relevant to the selected root",
    scalarFields: "Literal fields available to the selected root",
    ontologyMetrics: "Ontology Metrics",
    maturity: "Maturity",
    evidence: "Evidence",
    axioms: "Axioms",
    individuals: "Individuals",
    adapterMapping: "Adapter Mapping",
    browseDomains: "Browse agent ontology domains",
    browseLogs: "Browse ontology logs",
    ontologicalCharacteristic: "Ontological characteristic",
    metaInformation: "Meta-information",
    instanceClassification: "Instance classification",
    hasPart: "has part",
    containsClasses: "contains classes",
    relationPredicates: "relation predicates",
    literalFields: "literal fields",
    graphEmptyTitle: "No visible graph",
    graphEmptyBody: "No visible child nodes or relations. This entity can still be inspected through definitions, sources, and fields in the ontology characteristic table.",
    classCount: (count: number) => `${count} classes`,
    selectedJsonName: "agent-ontology.json"
  },
  ja: {
    languageName: "日本語",
    skip: "本体内容へ移動",
    brandEyebrow: "Moonweave エージェント本体",
    title: "本体ビューア",
    viewer: "ビューア",
    downloadJson: "JSON ダウンロード",
    openLeft: "目録",
    closeLeft: "折畳",
    openRight: "情報",
    closeRight: "折畳",
    filters: "フィルタ",
    search: "本体検索",
    searchPlaceholder: "クラス、モジュール、プレーン、出典",
    all: "すべて",
    domainFilter: "領域",
    adapterFilter: "アダプタ",
    trustFilter: "信頼",
    language: "言語",
    theme: "テーマ",
    darkTheme: "暗色",
    lightTheme: "明色",
    path: "本体パス",
    entityDetail: "本体エンティティ詳細",
    structure: "構造",
    hierarchy: "根ノードの意味近傍",
    nodesEdges: (nodes: number, edges: number) => `${nodes} ノード / ${edges} エッジ`,
    status: "状態",
    iri: "IRI",
    sources: "出典",
    modules: "モジュール",
    classes: "クラス",
    objectProperties: "関係述語",
    dataProperties: "データ項目",
    planeContents: "プレーン内容",
    moduleContents: "モジュール内容",
    relations: "選択した根ノードに関係するクラス間述語",
    scalarFields: "選択した根ノードで利用できるリテラル項目",
    ontologyMetrics: "本体統計",
    maturity: "成熟度",
    evidence: "証拠",
    axioms: "公理",
    individuals: "個体",
    adapterMapping: "適配マッピング",
    browseDomains: "エージェント本体領域を閲覧",
    browseLogs: "本体ログを閲覧",
    ontologicalCharacteristic: "本体特性",
    metaInformation: "メタ情報",
    instanceClassification: "インスタンス分類",
    hasPart: "構成部分",
    containsClasses: "含まれるクラス",
    relationPredicates: "関係述語",
    literalFields: "リテラル項目",
    graphEmptyTitle: "表示できるグラフはありません",
    graphEmptyBody: "表示できる子ノードまたは関係がありません。このエンティティの定義、出典、項目は本体特性表で確認できます。",
    classCount: (count: number) => `${count} クラス`,
    selectedJsonName: "agent-ontology.json"
  }
} as const;

const maturityLabels: Record<Language, Record<Maturity, string>> = {
  zh: {
    release: "发布",
    provisional: "暂定",
    informative: "说明",
    mixed: "混合"
  },
  en: {
    release: "Release",
    provisional: "Provisional",
    informative: "Informative",
    mixed: "Mixed"
  },
  ja: {
    release: "リリース",
    provisional: "暫定",
    informative: "参考",
    mixed: "混合"
  }
};

const kindLabels: Record<Language, Record<EntityKind, string>> = {
  zh: {
    domain: "领域",
    plane: "平面",
    module: "模块",
    class: "类"
  },
  en: {
    domain: "Domain",
    plane: "Plane",
    module: "Module",
    class: "Class"
  },
  ja: {
    domain: "領域",
    plane: "プレーン",
    module: "モジュール",
    class: "クラス"
  }
};

const metricLabels: Record<Language, Record<string, string>> = {
  zh: {
    domains: "领域",
    planes: "平面",
    modules: "模块",
    classes: "类",
    object_properties: "对象属性",
    data_properties: "数据属性",
    annotation_properties: "注释属性",
    individuals: "个体",
    axioms: "公理",
    datatypes: "数据类型",
    ontologies: "本体分区"
  },
  en: {
    domains: "Domains",
    planes: "Planes",
    modules: "Modules",
    classes: "Classes",
    object_properties: "Object properties",
    data_properties: "Data properties",
    annotation_properties: "Annotation properties",
    individuals: "Individuals",
    axioms: "Axioms",
    datatypes: "Datatypes",
    ontologies: "Ontologies"
  },
  ja: {
    domains: "領域",
    planes: "プレーン",
    modules: "モジュール",
    classes: "クラス",
    object_properties: "オブジェクト属性",
    data_properties: "データ属性",
    annotation_properties: "注釈属性",
    individuals: "個体",
    axioms: "公理",
    datatypes: "データ型",
    ontologies: "本体分区"
  }
};

const entityLabelOverrides: Record<Language, Record<string, string>> = {
  zh: {
    "agent-system-ontology": "智能体系统本体",
    "runtime-plane": "运行平面",
    "info-plane": "信息平面",
    "memory-plane": "记忆平面",
    "orchestration-plane": "编排平面",
    "tool-plane": "工具平面",
    "safety-plane": "安全平面",
    "feedback-plane": "反馈平面",
    "adapter-plane": "适配平面",
    "runtime-system": "运行系统模块",
    "runtime-actors": "运行参与者模块",
    "runtime-observability": "运行可观测性模块",
    "runtime-artifacts": "运行产物模块",
    "info-container-command": "容器与命令模块",
    "info-output-disclosure": "输出与披露模块",
    "info-storage-sources": "存储与来源模块",
    "info-messages-instructions": "消息与指令模块",
    "info-indexing": "信息索引模块",
    "memory-ingestion": "记忆摄入模块",
    "memory-chunking-situating": "分块与定位模块",
    "memory-embedding-indexes": "嵌入与索引模块",
    "memory-retrieval-ranking": "检索与排序模块",
    "memory-context": "上下文组装模块",
    "orchestration-task-planning": "任务规划模块",
    "orchestration-actors-delegation": "参与者与委派模块",
    "orchestration-routing-control": "路由与控制模块",
    "orchestration-composition": "组合模式模块",
    "orchestration-evaluation": "评估循环模块",
    "tool-registry-definition": "工具注册与定义模块",
    "tool-discovery-selection": "工具发现与选择模块",
    "tool-invocation-execution": "工具调用与执行模块",
    "tool-mcp-transport": "MCP 传输模块",
    "safety-trust-boundary": "信任边界模块",
    "safety-permission-policy": "权限与策略模块",
    "safety-sandbox-network": "沙箱与网络模块",
    "safety-injection-defense": "注入防御模块",
    "safety-commit-redaction": "提交与脱敏模块",
    "feedback-warning-error": "警告与错误模块",
    "feedback-review-optimization": "审查与优化模块",
    "feedback-metrics-evaluation": "指标与评估模块",
    "feedback-logging": "日志模块",
    "adapter-protocols": "协议适配模块",
    "adapter-frameworks": "框架适配模块",
    "adapter-benchmarks-statecharts": "基准与状态图适配模块",
    "adapter-schema-export": "模式与导出适配模块"
  },
  en: {},
  ja: {
    "agent-system-ontology": "エージェントシステム本体",
    "runtime-plane": "実行プレーン",
    "info-plane": "情報プレーン",
    "memory-plane": "記憶プレーン",
    "orchestration-plane": "オーケストレーションプレーン",
    "tool-plane": "ツールプレーン",
    "safety-plane": "安全プレーン",
    "feedback-plane": "フィードバックプレーン",
    "adapter-plane": "適配プレーン",
    "runtime-system": "実行システムモジュール",
    "runtime-actors": "実行参加者モジュール",
    "runtime-observability": "実行可観測性モジュール",
    "runtime-artifacts": "実行成果物モジュール",
    "info-container-command": "コンテナとコマンドモジュール",
    "info-output-disclosure": "出力と開示モジュール",
    "info-storage-sources": "保存と出典モジュール",
    "info-messages-instructions": "メッセージと指示モジュール",
    "info-indexing": "情報索引モジュール",
    "memory-ingestion": "記憶取り込みモジュール",
    "memory-chunking-situating": "分割と位置付けモジュール",
    "memory-embedding-indexes": "埋め込みと索引モジュール",
    "memory-retrieval-ranking": "検索と順位付けモジュール",
    "memory-context": "文脈組立モジュール",
    "orchestration-task-planning": "タスク計画モジュール",
    "orchestration-actors-delegation": "参加者と委任モジュール",
    "orchestration-routing-control": "ルーティングと制御モジュール",
    "orchestration-composition": "構成パターンモジュール",
    "orchestration-evaluation": "評価ループモジュール",
    "tool-registry-definition": "ツール登録と定義モジュール",
    "tool-discovery-selection": "ツール発見と選択モジュール",
    "tool-invocation-execution": "ツール呼出と実行モジュール",
    "tool-mcp-transport": "MCP 転送モジュール",
    "safety-trust-boundary": "信頼境界モジュール",
    "safety-permission-policy": "権限とポリシーモジュール",
    "safety-sandbox-network": "サンドボックスとネットワークモジュール",
    "safety-injection-defense": "注入防御モジュール",
    "safety-commit-redaction": "コミットと秘匿モジュール",
    "feedback-warning-error": "警告とエラーモジュール",
    "feedback-review-optimization": "レビューと最適化モジュール",
    "feedback-metrics-evaluation": "指標と評価モジュール",
    "feedback-logging": "ログモジュール",
    "adapter-protocols": "プロトコル適配モジュール",
    "adapter-frameworks": "フレームワーク適配モジュール",
    "adapter-benchmarks-statecharts": "ベンチマークと状態図適配モジュール",
    "adapter-schema-export": "スキーマとエクスポート適配モジュール"
  }
};

const wordTranslations: Record<Exclude<Language, "en">, Record<string, string>> = {
  zh: {
    action: "动作",
    actions: "动作",
    assembly: "组装",
    assembles: "组装",
    allows: "允许",
    and: "与",
    any: "任意",
    belongs: "归属",
    authorizes: "授权",
    blocks: "阻断",
    byte: "字节",
    chunks: "分块",
    code: "代码",
    count: "计数",
    controls: "控制",
    contains: "包含",
    coverage: "覆盖",
    crosses: "跨越",
    date: "日期",
    datetime: "日期时间",
    delegates: "委派",
    denies: "拒绝",
    discovers: "发现",
    distributes: "分发",
    distribution: "分发",
    duration: "持续时间",
    embeds: "嵌入",
    emits: "发出",
    evidence: "证据",
    escalate: "升级",
    escalates: "升级",
    executes: "执行",
    exposes: "暴露",
    feeds: "反馈",
    back: "",
    feedsback: "反馈",
    flow: "流",
    follows: "遵循",
    generates: "生成",
    information: "信息",
    for: "",
    from: "",
    governance: "治理",
    has: "",
    hash: "哈希",
    identifier: "标识符",
    in: "",
    integer: "整数",
    label: "标签",
    maps: "映射",
    milliseconds: "毫秒",
    module: "模块",
    number: "数值",
    object: "对象",
    of: "",
    on: "",
    privacy: "隐私",
    produces: "产生",
    properties: "属性",
    property: "属性",
    records: "记录",
    requires: "需要",
    returns: "返回",
    status: "状态",
    string: "字符串",
    temporal: "时间",
    time: "时间",
    timestamp: "时间戳",
    to: "",
    token: "令牌",
    type: "类型",
    uses: "使用",
    agent: "智能体",
    system: "系统",
    runtime: "运行",
    session: "会话",
    actor: "参与者",
    human: "人工",
    operator: "操作员",
    user: "用户",
    model: "模型",
    generative: "生成",
    embedding: "嵌入",
    reranker: "重排",
    remote: "远程",
    reference: "引用",
    transcript: "转录",
    trace: "追踪",
    event: "事件",
    state: "状态",
    snapshot: "快照",
    checkpoint: "检查点",
    budget: "预算",
    environment: "环境",
    lifecycle: "生命周期",
    start: "开始",
    end: "结束",
    pause: "暂停",
    resume: "恢复",
    run: "运行",
    attempt: "尝试",
    outcome: "结果",
    developer: "开发者",
    reviewer: "审查者",
    tool: "工具",
    service: "服务",
    external: "外部",
    role: "角色",
    binding: "绑定",
    capability: "能力",
    authority: "权限",
    scope: "范围",
    observability: "可观测性",
    span: "跨度",
    link: "链接",
    audit: "审计",
    record: "记录",
    redact: "脱敏",
    relates: "关联",
    diff: "差异",
    restore: "恢复",
    replay: "回放",
    observable: "可观测",
    summary: "摘要",
    retention: "保留",
    policy: "策略",
    artifact: "产物",
    draft: "草稿",
    final: "最终",
    patch: "补丁",
    report: "报告",
    schema: "模式",
    graph: "图",
    export: "导出",
    info: "信息",
    plane: "平面",
    container: "容器",
    command: "命令",
    area: "区域",
    execution: "执行",
    shell: "Shell",
    argument: "参数",
    exit: "退出",
    standard: "标准",
    output: "输出",
    error: "错误",
    process: "进程",
    handle: "句柄",
    working: "工作",
    directory: "目录",
    variable: "变量",
    window: "窗口",
    progressive: "渐进",
    disclosure: "披露",
    light: "轻量",
    index: "索引",
    indexes: "索引",
    stream: "流",
    segment: "片段",
    head: "头部",
    tail: "尾部",
    length: "长度",
    limit: "限制",
    stage: "阶段",
    rule: "规则",
    suppressed: "抑制",
    citation: "引用",
    storage: "存储",
    resource: "资源",
    file: "文件",
    database: "数据库",
    text: "文本",
    corpus: "语料库",
    network: "网络",
    message: "消息",
    conversation: "会话",
    history: "历史",
    instruction: "指令",
    prompt: "提示",
    "few-shot": "少样本",
    example: "示例",
    assistant: "助手",
    turn: "轮次",
    priority: "优先级",
    template: "模板",
    instance: "实例",
    memory: "记忆",
    store: "存储",
    document: "文档",
    chunk: "分块",
    chunking: "分块",
    situating: "定位",
    context: "上下文",
    retrieval: "检索",
    query: "查询",
    retrieved: "已检索",
    vector: "向量",
    tf: "TF",
    idf: "IDF",
    rank: "排序",
    ranking: "排序",
    fusion: "融合",
    ingestion: "摄入",
    loader: "加载器",
    namespace: "命名空间",
    deduplication: "去重",
    boundary: "边界",
    provenance: "溯源",
    situated: "定位",
    quality: "质量",
    signal: "信号",
    compression: "压缩",
    candidate: "候选",
    similarity: "相似度",
    lexical: "词汇",
    score: "分数",
    selection: "选择",
    filter: "过滤器",
    top: "Top",
    k: "K",
    slot: "槽位",
    ordering: "排序",
    exclusion: "排除",
    preference: "偏好",
    refresh: "刷新",
    task: "任务",
    planning: "规划",
    goal: "目标",
    objective: "目的",
    work: "工作",
    item: "项",
    plan: "计划",
    part: "组成部分",
    step: "步骤",
    dependency: "依赖",
    constraint: "约束",
    completion: "完成",
    criterion: "准则",
    orchestrator: "编排者",
    worker: "工作者",
    subagent: "子智能体",
    handoff: "交接",
    delegation: "委派",
    contract: "契约",
    pool: "池",
    responsibility: "责任",
    transfer: "转移",
    route: "路由",
    routing: "路由",
    orchestration: "编排",
    control: "控制",
    decision: "决策",
    branch: "分支",
    downstream: "下游",
    operation: "操作",
    gate: "门控",
    retry: "重试",
    stop: "停止",
    composition: "组合",
    chain: "链",
    parallel: "并行",
    parallelization: "并行化",
    section: "分区",
    sectioning: "分区",
    voting: "投票",
    synthesis: "综合",
    ballot: "票据",
    aggregation: "聚合",
    evaluation: "评估",
    evaluator: "评估器",
    optimizer: "优化器",
    review: "审查",
    feedback: "反馈",
    critique: "批判",
    revision: "修订",
    improvement: "改进",
    reflection: "反思",
    assignment: "分配",
    registry: "注册表",
    definition: "定义",
    name: "名称",
    description: "描述",
    result: "结果",
    version: "版本",
    deprecation: "弃用",
    notice: "通知",
    discovery: "发现",
    search: "搜索",
    match: "匹配",
    regex: "正则",
    fallback: "回退",
    disambiguation: "消歧",
    call: "调用",
    invocation: "调用",
    side: "副",
    effect: "作用",
    observation: "观察",
    client: "客户端",
    server: "服务器",
    transport: "传输",
    authorization: "授权",
    elicitation: "引导",
    trust: "信任",
    safety: "安全",
    data: "数据",
    domain: "定义域",
    zone: "区域",
    crossing: "跨越",
    internal: "内部",
    permission: "权限",
    range: "值域",
    allow: "允许",
    deny: "拒绝",
    escalation: "升级",
    grant: "授予",
    exception: "例外",
    approval: "批准",
    sandbox: "沙箱",
    socket: "套接字",
    proxy: "代理",
    outbound: "出站",
    inbound: "入站",
    request: "请求",
    response: "响应",
    denied: "已拒绝",
    escape: "逃逸",
    risk: "风险",
    injection: "注入",
    defense: "防御",
    pattern: "模式",
    scan: "扫描",
    signature: "签名",
    indirect: "间接",
    malicious: "恶意",
    quarantine: "隔离",
    sanitization: "净化",
    finding: "发现",
    commit: "提交",
    redaction: "脱敏",
    sensitive: "敏感",
    strength: "强度",
    warning: "警告",
    diagnostic: "诊断",
    failure: "失败",
    mode: "模式",
    retryable: "可重试",
    blocking: "阻塞",
    confidence: "置信度",
    automated: "自动",
    correction: "校正",
    learning: "学习",
    target: "目标",
    recovery: "恢复",
    rollback: "回滚",
    metric: "指标",
    rubric: "评分规程",
    scenario: "场景",
    success: "成功",
    cost: "成本",
    latency: "延迟",
    robustness: "鲁棒性",
    logging: "日志",
    log: "日志",
    telemetry: "遥测",
    subscription: "订阅",
    listener: "监听器",
    sink: "接收器",
    adapter: "适配器",
    protocol: "协议",
    framework: "框架",
    benchmark: "基准",
    statechart: "状态图",
    mapping: "映射",
    conversion: "转换",
    warning_type: "警告"
  },
  ja: {
    action: "アクション",
    actions: "アクション",
    assembly: "組立",
    assembles: "組み立て",
    allows: "許可",
    and: "と",
    any: "任意",
    belongs: "所属",
    authorizes: "認可",
    blocks: "ブロック",
    byte: "バイト",
    chunks: "分割",
    code: "コード",
    count: "数",
    controls: "制御",
    contains: "含む",
    coverage: "網羅性",
    crosses: "越境",
    date: "日付",
    datetime: "日時",
    delegates: "委任",
    denies: "拒否",
    discovers: "発見",
    distributes: "配分",
    distribution: "配分",
    duration: "期間",
    embeds: "埋め込み",
    emits: "発行",
    evidence: "証拠",
    escalate: "エスカレーション",
    escalates: "エスカレーション",
    executes: "実行",
    exposes: "公開",
    feeds: "フィードバック",
    back: "",
    feedsback: "フィードバック",
    flow: "フロー",
    follows: "準拠",
    generates: "生成",
    information: "情報",
    for: "",
    from: "",
    governance: "統治",
    has: "",
    hash: "ハッシュ",
    identifier: "識別子",
    in: "",
    integer: "整数",
    label: "ラベル",
    maps: "対応付け",
    milliseconds: "ミリ秒",
    module: "モジュール",
    number: "数値",
    object: "オブジェクト",
    of: "",
    on: "",
    privacy: "プライバシー",
    produces: "生成",
    properties: "属性",
    property: "属性",
    records: "記録",
    requires: "要求",
    retrieved: "検索済み",
    returns: "返却",
    status: "状態",
    string: "文字列",
    temporal: "時間",
    time: "時刻",
    timestamp: "タイムスタンプ",
    to: "",
    token: "トークン",
    type: "型",
    uses: "使用",
    agent: "エージェント",
    system: "システム",
    runtime: "実行",
    session: "セッション",
    actor: "参加者",
    human: "人間",
    operator: "操作者",
    user: "ユーザー",
    model: "モデル",
    generative: "生成",
    embedding: "埋め込み",
    reranker: "再順位付け",
    remote: "遠隔",
    reference: "参照",
    transcript: "記録",
    trace: "トレース",
    event: "イベント",
    state: "状態",
    snapshot: "スナップショット",
    checkpoint: "チェックポイント",
    budget: "予算",
    environment: "環境",
    lifecycle: "ライフサイクル",
    start: "開始",
    end: "終了",
    pause: "一時停止",
    resume: "再開",
    run: "実行",
    attempt: "試行",
    outcome: "結果",
    developer: "開発者",
    reviewer: "レビュー担当",
    tool: "ツール",
    service: "サービス",
    external: "外部",
    role: "役割",
    binding: "結合",
    capability: "能力",
    authority: "権限",
    scope: "範囲",
    observability: "可観測性",
    span: "スパン",
    link: "リンク",
    audit: "監査",
    record: "記録",
    redact: "秘匿",
    relates: "関連",
    diff: "差分",
    restore: "復元",
    replay: "再生",
    observable: "可観測",
    summary: "要約",
    retention: "保持",
    policy: "ポリシー",
    artifact: "成果物",
    draft: "草稿",
    final: "最終",
    patch: "パッチ",
    report: "報告",
    schema: "スキーマ",
    graph: "グラフ",
    export: "エクスポート",
    info: "情報",
    plane: "プレーン",
    container: "コンテナ",
    command: "コマンド",
    area: "領域",
    execution: "実行",
    output: "出力",
    error: "エラー",
    process: "プロセス",
    directory: "ディレクトリ",
    variable: "変数",
    window: "ウィンドウ",
    progressive: "段階的",
    disclosure: "開示",
    index: "索引",
    indexes: "索引化",
    stream: "ストリーム",
    segment: "断片",
    length: "長さ",
    limit: "制限",
    stage: "段階",
    rule: "規則",
    storage: "保存",
    resource: "資源",
    file: "ファイル",
    database: "データベース",
    text: "テキスト",
    corpus: "コーパス",
    network: "ネットワーク",
    message: "メッセージ",
    conversation: "会話",
    history: "履歴",
    instruction: "指示",
    prompt: "プロンプト",
    example: "例",
    assistant: "アシスタント",
    turn: "ターン",
    priority: "優先度",
    template: "テンプレート",
    instance: "インスタンス",
    memory: "記憶",
    store: "保存",
    document: "文書",
    chunk: "チャンク",
    chunking: "分割",
    situating: "位置付け",
    context: "文脈",
    retrieval: "検索",
    query: "クエリ",
    vector: "ベクトル",
    rank: "順位",
    ranking: "順位付け",
    fusion: "融合",
    ingestion: "取り込み",
    boundary: "境界",
    provenance: "来歴",
    quality: "品質",
    signal: "信号",
    compression: "圧縮",
    candidate: "候補",
    similarity: "類似度",
    score: "スコア",
    selection: "選択",
    filter: "フィルタ",
    preference: "嗜好",
    refresh: "更新",
    task: "タスク",
    planning: "計画",
    goal: "目標",
    objective: "目的",
    work: "作業",
    item: "項目",
    plan: "計画",
    part: "構成部分",
    step: "ステップ",
    dependency: "依存",
    constraint: "制約",
    completion: "完了",
    criterion: "基準",
    orchestrator: "統括者",
    worker: "作業者",
    subagent: "サブエージェント",
    handoff: "引き継ぎ",
    delegation: "委任",
    contract: "契約",
    pool: "プール",
    responsibility: "責任",
    transfer: "移転",
    route: "経路",
    routing: "ルーティング",
    orchestration: "オーケストレーション",
    control: "制御",
    decision: "判断",
    branch: "分岐",
    downstream: "下流",
    operation: "操作",
    gate: "ゲート",
    retry: "再試行",
    stop: "停止",
    composition: "構成",
    chain: "連鎖",
    parallel: "並列",
    parallelization: "並列化",
    section: "区分",
    sectioning: "区分化",
    voting: "投票",
    synthesis: "統合",
    evaluation: "評価",
    evaluator: "評価器",
    optimizer: "最適化器",
    review: "レビュー",
    feedback: "フィードバック",
    revision: "修正",
    improvement: "改善",
    reflection: "内省",
    assignment: "割当",
    registry: "登録簿",
    definition: "定義",
    name: "名称",
    description: "説明",
    result: "結果",
    version: "版",
    discovery: "発見",
    search: "検索",
    match: "照合",
    fallback: "代替",
    call: "呼出",
    invocation: "呼出",
    observation: "観測",
    client: "クライアント",
    server: "サーバー",
    transport: "転送",
    authorization: "認可",
    elicitation: "引出",
    trust: "信頼",
    safety: "安全",
    data: "データ",
    domain: "定義域",
    zone: "区域",
    crossing: "越境",
    internal: "内部",
    permission: "権限",
    range: "値域",
    allow: "許可",
    deny: "拒否",
    escalation: "上申",
    grant: "付与",
    exception: "例外",
    approval: "承認",
    sandbox: "サンドボックス",
    socket: "ソケット",
    proxy: "プロキシ",
    request: "要求",
    response: "応答",
    risk: "リスク",
    injection: "注入",
    defense: "防御",
    pattern: "パターン",
    scan: "走査",
    signature: "署名",
    malicious: "悪意",
    finding: "所見",
    commit: "コミット",
    redaction: "秘匿",
    sensitive: "機微",
    strength: "強度",
    warning: "警告",
    diagnostic: "診断",
    failure: "失敗",
    mode: "モード",
    confidence: "信頼度",
    automated: "自動",
    correction: "訂正",
    learning: "学習",
    target: "対象",
    recovery: "復旧",
    rollback: "ロールバック",
    metric: "指標",
    scenario: "シナリオ",
    success: "成功",
    cost: "コスト",
    latency: "遅延",
    robustness: "頑健性",
    logging: "ログ",
    log: "ログ",
    adapter: "適配器",
    protocol: "プロトコル",
    framework: "フレームワーク",
    benchmark: "ベンチマーク",
    statechart: "状態図",
    mapping: "マッピング",
    conversion: "変換"
  }
};

function localizeId(id: string, language: Language): string {
  return entityLabelOverrides[language][id] ?? id;
}

function translatePhrase(value: string, language: Language): string {
  if (language === "en") {
    return value;
  }

  const lower = value.toLowerCase();
  const exact = entityLabelOverrides[language][lower];
  if (exact) {
    return exact;
  }

  const words = lower
    .replaceAll("/", " ")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => {
      if (/^[a-z]*[0-9]+[a-z0-9]*$/i.test(word) || word.toUpperCase() === word) {
        return word.toUpperCase();
      }

      return wordTranslations[language][word] ?? word;
    })
    .filter(Boolean);

  return language === "zh" || language === "ja" ? words.join("") : words.join(" ");
}

function localizeEntityLabel(item: Pick<DirectoryItem, "id" | "label" | "kind">, language: Language): string {
  if (language === "en") {
    return item.label;
  }

  if (item.kind === "class") {
    const klass = ontology.classes.find((candidate) => candidate.id === item.id);
    if (klass) {
      return localizeClassLabel(klass, language);
    }
  }

  return entityLabelOverrides[language][item.id] ?? translatePhrase(item.label, language);
}

function localizeClassLabel(klass: OntologyClass, language: Language): string {
  if (language === "en") {
    return klass.label;
  }

  const label = entityLabelOverrides[language][klass.id] ?? translatePhrase(klass.label, language);
  if (klass.kind === "object_type" && klass.id.endsWith("Plane")) {
    return `${label}${language === "zh" ? "类" : "クラス"}`;
  }

  return label;
}

function localizePropertyLabel(property: ObjectProperty | DataProperty, language: Language): string {
  if (language === "en") {
    return property.label;
  }

  return translatePhrase(property.label, language);
}

function definitionForLanguage(item: Pick<DirectoryItem, "definition" | "definitions">, language: Language): string {
  return item.definitions?.[language]?.trim() || item.definition;
}

function localizeKind(kind: EntityKind, language: Language): string {
  return kindLabels[language][kind];
}

function localizeClassKind(kind: string, language: Language): string {
  if (language === "en") {
    return kind.replaceAll("_", " ");
  }

  const labels: Record<Exclude<Language, "en">, Record<string, string>> = {
    zh: {
      object_type: "对象类",
      event_type: "事件类",
      action_type: "动作类",
      policy_type: "策略类",
      resource_type: "资源类",
      index_type: "索引类",
      actor_type: "参与者类",
      relation_type: "关系类",
      adapter_type: "适配器类"
    },
    ja: {
      object_type: "オブジェクトクラス",
      event_type: "イベントクラス",
      action_type: "アクションクラス",
      policy_type: "ポリシークラス",
      resource_type: "資源クラス",
      index_type: "索引クラス",
      actor_type: "参加者クラス",
      relation_type: "関係クラス",
      adapter_type: "適配器クラス"
    }
  };

  return labels[language][kind] ?? translatePhrase(kind, language);
}

function localizeAdapterName(adapter: string, language: Language): string {
  if (language === "en") {
    return adapter;
  }

  const labels: Record<Exclude<Language, "en">, Record<string, string>> = {
    zh: {
      Benchmark: "基准",
      Framework: "框架",
      Schema: "模式",
      Statechart: "状态图"
    },
    ja: {
      Benchmark: "ベンチマーク",
      Framework: "フレームワーク",
      Schema: "スキーマ",
      Statechart: "状態図"
    }
  };

  return labels[language][adapter] ?? adapter;
}

function localizePropertyEndpoint(value: string, language: Language): string {
  if (value === "any") {
    return language === "zh" ? "任意" : language === "ja" ? "任意" : "any";
  }

  const klass = ontology.classes.find((candidate) => candidate.id === value);
  if (klass) {
    return localizeClassLabel(klass, language);
  }

  return translatePhrase(value, language);
}

function maturityForPlane(planeId: string): Maturity {
  if (planeId === "adapter-plane") {
    return "provisional";
  }

  if (["orchestration-plane", "safety-plane", "feedback-plane"].includes(planeId)) {
    return "mixed";
  }

  return "release";
}

function maturityForClass(klass: OntologyClass): Maturity {
  if (klass.plane_id === "adapter-plane" || klass.kind === "adapter_type") {
    return "provisional";
  }

  if (["policy_type", "event_type"].includes(klass.kind)) {
    return "mixed";
  }

  return "release";
}

function entityRef(kind: EntityKind, id: string): string {
  return `${kind}:${id}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = keyOf(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

function sourceIdsOf(sourceBacked: SourceBacked | undefined): string[] {
  return sourceBacked?.source_ids ?? [];
}

function isConcreteOntologyEndpoint(value: string): boolean {
  return concreteOntologyIds.has(value);
}

function isDisplayableObjectProperty(property: ObjectProperty): boolean {
  return isConcreteOntologyEndpoint(property.domain) && isConcreteOntologyEndpoint(property.range) && property.domain !== property.range;
}

function isDisplayableDataProperty(property: DataProperty): boolean {
  return isConcreteOntologyEndpoint(property.domain);
}

function isDisplayableAxiom(axiom: Axiom): boolean {
  return !hiddenAxiomTypes.has(axiom.type);
}

function planeSourceIds(planeId: string): string[] {
  return unique([
    ...ontology.modules.filter((module) => module.plane_id === planeId).flatMap((module) => sourceIdsOf(module)),
    ...ontology.classes.filter((klass) => klass.plane_id === planeId).flatMap((klass) => sourceIdsOf(klass))
  ]);
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  return items.reduce((groups, item) => {
    const key = keyOf(item);
    const next = groups.get(key) ?? [];
    groups.set(key, [...next, item]);
    return groups;
  }, new Map<string, T[]>());
}

function relationLabel(kind: "contains-plane" | "contains-module" | "declares-class" | "contains-class" | "belongs-to" | "has-field", language: Language): string {
  const labels: Record<Language, Record<typeof kind, string>> = {
    zh: {
      "contains-plane": "包含平面",
      "contains-module": "包含模块",
      "declares-class": "定义类",
      "contains-class": "包含类",
      "belongs-to": "归属于",
      "has-field": "具有字段"
    },
    en: {
      "contains-plane": "contains plane",
      "contains-module": "contains module",
      "declares-class": "declares class",
      "contains-class": "contains class",
      "belongs-to": "belongs to",
      "has-field": "has field"
    },
    ja: {
      "contains-plane": "プレーンを含む",
      "contains-module": "モジュールを含む",
      "declares-class": "クラスを定義",
      "contains-class": "クラスを含む",
      "belongs-to": "所属",
      "has-field": "項目を持つ"
    }
  };

  return labels[language][kind];
}

function relationFamilyLabel(family: string, language: Language): string {
  if (language === "en") {
    return family.replaceAll("_", " ");
  }

  const labels: Record<Exclude<Language, "en">, Record<string, string>> = {
    zh: {
      adapter_mapping: "适配映射",
      composition: "组合关系",
      event: "事件关系",
      feedback_flow: "反馈流",
      governance: "治理关系",
      information_flow: "信息流",
      memory_flow: "记忆流",
      module_composition: "模块组合",
      module_event: "模块事件",
      module_relation: "模块关系",
      observability: "可观测性",
      orchestration_flow: "编排流",
      safety_flow: "安全流",
      taxonomy: "分类关系",
      temporal: "时间关系",
      tool_flow: "工具流"
    },
    ja: {
      adapter_mapping: "適配マッピング",
      composition: "構成関係",
      event: "イベント関係",
      feedback_flow: "フィードバック流",
      governance: "統治関係",
      information_flow: "情報流",
      memory_flow: "記憶流",
      module_composition: "モジュール構成",
      module_event: "モジュールイベント",
      module_relation: "モジュール関係",
      observability: "可観測性",
      orchestration_flow: "オーケストレーション流",
      safety_flow: "安全流",
      taxonomy: "分類関係",
      temporal: "時間関係",
      tool_flow: "ツール流"
    }
  };

  return labels[language][family] ?? translatePhrase(family, language);
}

function buildDirectoryItems(): DirectoryItem[] {
  const domainItem: DirectoryItem = {
    ref: entityRef("domain", ontology.id),
    id: ontology.id,
    kind: "domain",
    label: ontology.label,
    definition: ontology.definition,
    definitions: ontology.definitions,
    maturity: "release",
    source_ids: ontology.planes.flatMap((plane) => planeSourceIds(plane.id))
  };

  const planeItems = ontology.planes.map((plane) => ({
    ref: entityRef("plane", plane.id),
    id: plane.id,
    kind: "plane" as const,
    label: plane.label,
    definition: plane.definition,
    definitions: plane.definitions,
    maturity: maturityForPlane(plane.id),
    source_ids: planeSourceIds(plane.id),
    parent_ref: domainItem.ref,
    plane_id: plane.id
  }));

  const moduleItems = ontology.modules.map((module) => ({
    ref: entityRef("module", module.id),
    id: module.id,
    kind: "module" as const,
    label: module.label,
    definition: module.definition,
    definitions: module.definitions,
    maturity: maturityForPlane(module.plane_id),
    source_ids: sourceIdsOf(module),
    parent_ref: entityRef("plane", module.plane_id),
    plane_id: module.plane_id,
    module_id: module.id
  }));

  const classItems = ontology.classes.map((klass) => ({
    ref: entityRef("class", klass.id),
    id: klass.id,
    kind: "class" as const,
    label: klass.label,
    definition: klass.definition,
    definitions: klass.definitions,
    maturity: maturityForClass(klass),
    source_ids: sourceIdsOf(klass),
    parent_ref: entityRef("module", klass.module_id),
    plane_id: klass.plane_id,
    module_id: klass.module_id
  }));

  return [domainItem, ...planeItems, ...moduleItems, ...classItems];
}

function downloadText(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [language, setLanguage] = useState<Language>("zh");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [selectedRef, setSelectedRef] = useState(entityRef("domain", ontology.id));
  const [query, setQuery] = useState("");
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(
    () => new Set([entityRef("domain", ontology.id), ...ontology.planes.map((plane) => entityRef("plane", plane.id))])
  );
  const [graphExpandedRefs, setGraphExpandedRefs] = useState<Set<string>>(() => new Set([entityRef("domain", ontology.id)]));
  const copy = uiText[language];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setGraphExpandedRefs(new Set([selectedRef]));
  }, [selectedRef]);

  const directoryItems = useMemo(() => buildDirectoryItems(), []);
  const itemByRef = useMemo(() => new Map(directoryItems.map((item) => [item.ref, item])), [directoryItems]);
  const planeById = useMemo(() => new Map(ontology.planes.map((plane) => [plane.id, plane])), []);
  const moduleById = useMemo(() => new Map(ontology.modules.map((module) => [module.id, module])), []);
  const classById = useMemo(() => new Map(ontology.classes.map((klass) => [klass.id, klass])), []);
  const modulesByPlane = useMemo(() => groupBy(ontology.modules, (module) => module.plane_id), []);
  const classesByModule = useMemo(() => groupBy(ontology.classes, (klass) => klass.module_id), []);
  const selectedItem = itemByRef.get(selectedRef) ?? directoryItems[0];
  const normalizedQuery = query.trim().toLowerCase();
  const filterActive = Boolean(normalizedQuery);

  const matchingRefs = useMemo(() => {
    if (!filterActive) {
      return new Set<string>();
    }

    const directMatches = directoryItems.filter((item) => {
      const text = `${item.label} ${item.id} ${item.definition}`.toLowerCase();
      return normalizedQuery ? text.includes(normalizedQuery) : true;
    });
    const refs = new Set<string>();

    for (const item of directMatches) {
      refs.add(item.ref);
      let parentRef = item.parent_ref;
      while (parentRef) {
        refs.add(parentRef);
        parentRef = itemByRef.get(parentRef)?.parent_ref;
      }
    }

    return refs;
  }, [directoryItems, filterActive, itemByRef, normalizedQuery]);

  const selectedPlaneId = selectedItem.plane_id ?? (selectedItem.kind === "domain" ? undefined : selectedItem.id);
  const selectedModuleId = selectedItem.module_id ?? (selectedItem.kind === "module" ? selectedItem.id : undefined);
  const selectedClass = selectedItem.kind === "class" ? classById.get(selectedItem.id) : undefined;
  const selectedModule = selectedModuleId ? moduleById.get(selectedModuleId) : undefined;
  const selectedPlane = selectedPlaneId ? planeById.get(selectedPlaneId) : undefined;

  const childModules = selectedItem.kind === "plane" ? modulesByPlane.get(selectedItem.id) ?? [] : [];
  const childClasses =
    selectedItem.kind === "module"
      ? classesByModule.get(selectedItem.id) ?? []
      : selectedItem.kind === "class" && selectedModule
        ? classesByModule.get(selectedModule.id) ?? []
        : [];

  const relevantObjectProperties = useMemo(() => {
    const displayableProperties = ontology.object_properties.filter(isDisplayableObjectProperty);

    if (selectedItem.kind === "domain") {
      return [];
    }

    if (selectedItem.kind === "plane") {
      const classIds = new Set(ontology.classes.filter((klass) => klass.plane_id === selectedItem.id).map((klass) => klass.id));
      const moduleIds = new Set((modulesByPlane.get(selectedItem.id) ?? []).map((module) => module.id));
      return uniqueBy(
        displayableProperties
          .filter(
            (property) =>
              moduleIds.has(property.domain) ||
              moduleIds.has(property.range) ||
              classIds.has(property.domain) ||
              classIds.has(property.range) ||
              property.domain === selectedItem.id ||
              property.range === selectedItem.id
          )
          .slice(0, 24),
        (property) => `${property.domain}->${property.range}:${property.id}`
      );
    }

    if (selectedItem.kind === "module") {
      const classIds = new Set((classesByModule.get(selectedItem.id) ?? []).map((klass) => klass.id));
      return uniqueBy(
        displayableProperties
          .filter((property) => property.domain === selectedItem.id || property.range === selectedItem.id || classIds.has(property.domain) || classIds.has(property.range))
          .slice(0, 24),
        (property) => `${property.domain}->${property.range}:${property.id}`
      );
    }

    if (selectedClass) {
      return uniqueBy(
        displayableProperties
          .filter((property) => property.domain === selectedClass.id || property.range === selectedClass.id)
          .slice(0, 24),
        (property) => `${property.domain}->${property.range}:${property.id}`
      );
    }

    return [];
  }, [classesByModule, modulesByPlane, selectedClass, selectedItem]);

  const relevantDataProperties = useMemo(() => {
    const displayableDataProperties = ontology.data_properties.filter(isDisplayableDataProperty);

    if (selectedItem.kind === "domain" || selectedItem.kind === "plane") {
      return [];
    }

    if (selectedItem.kind === "module") {
      return uniqueBy(
        displayableDataProperties.filter((property) => property.domain === selectedItem.id).slice(0, 18),
        (property) => property.id
      );
    }

    return uniqueBy(
      displayableDataProperties.filter((property) => property.domain === selectedClass?.id).slice(0, 18),
      (property) => property.id
    );
  }, [selectedClass?.id, selectedItem]);

  const relevantAxioms = useMemo(() => {
    const displayableAxioms = ontology.axioms.filter(isDisplayableAxiom);

    if (selectedItem.kind === "domain") {
      return uniqueBy(
        displayableAxioms.filter((axiom) => ["scope", "privacy", "adapter-boundary", "coverage"].includes(axiom.type)),
        (axiom) => axiom.type
      );
    }

    return uniqueBy(
      displayableAxioms
        .filter(
          (axiom) =>
            axiom.id.includes(selectedItem.id.replaceAll("-", "_")) ||
            axiom.statement.includes(selectedItem.id) ||
            axiom.statement.includes(selectedItem.label)
        )
        .slice(0, 8),
      (axiom) => `${axiom.type}:${axiom.statement}`
    );
  }, [selectedItem]);

  const relevantIndividuals = useMemo(() => {
    if (selectedItem.kind === "domain") {
      return ontology.individuals.slice(0, 12);
    }

    if (selectedItem.kind === "module") {
      return ontology.individuals.filter((individual) => individual.id.includes(selectedItem.id.replaceAll("-", "_"))).slice(0, 12);
    }

    if (selectedItem.kind === "class") {
      return ontology.individuals.filter((individual) => individual.class_id === selectedItem.id).slice(0, 12);
    }

    return ontology.individuals.filter((individual) => individual.id.includes(selectedItem.id.replaceAll("-", "_"))).slice(0, 12);
  }, [selectedItem]);

  const relevantAdapters = useMemo(() => {
    if (selectedItem.kind !== "class") {
      return ontology.adapter_mappings.filter((mapping) => selectedItem.kind === "domain" || mapping.maps_to.some((id) => classById.get(id)?.plane_id === selectedItem.id));
    }

    return ontology.adapter_mappings.filter((mapping) => mapping.maps_to.includes(selectedItem.id));
  }, [classById, selectedItem]);

  const graphModel = useMemo(() => {
    const nodes = new Map<string, cytoscape.ElementDefinition>();
    const edges = new Map<string, cytoscape.ElementDefinition>();
    const rootItem = selectedItem;
    type GraphChild = {
      item: DirectoryItem;
      label: string;
      className: string;
    };
    type GraphNodeMeta = {
      item: DirectoryItem;
      level: number;
      root: boolean;
      position: cytoscape.Position;
    };

    const itemForOntologyId = (id: string) =>
      itemByRef.get(entityRef("plane", id)) ?? itemByRef.get(entityRef("module", id)) ?? itemByRef.get(entityRef("class", id));

    const childrenForItem = (item: DirectoryItem): GraphChild[] => {
      if (item.kind === "domain") {
        return ontology.planes
          .map((plane) => itemByRef.get(entityRef("plane", plane.id)))
          .filter((child): child is DirectoryItem => Boolean(child))
          .map((child, index) => ({
            item: child,
            label: relationLabel("contains-plane", language),
            className: "viewer-edge viewer-edge--hierarchy"
          }));
      }

      if (item.kind === "plane") {
        return (modulesByPlane.get(item.id) ?? [])
          .map((module) => itemByRef.get(entityRef("module", module.id)))
          .filter((child): child is DirectoryItem => Boolean(child))
          .map((child, index) => ({
            item: child,
            label: relationLabel("contains-module", language),
            className: "viewer-edge viewer-edge--hierarchy"
          }));
      }

      if (item.kind === "module") {
        return (classesByModule.get(item.id) ?? [])
          .map((klass) => itemByRef.get(entityRef("class", klass.id)))
          .filter((child): child is DirectoryItem => Boolean(child))
          .map((child, index) => ({
            item: child,
            label: relationLabel("declares-class", language),
            className: "viewer-edge viewer-edge--hierarchy"
          }));
      }

      const klass = classById.get(item.id);
      if (!klass) {
        return [];
      }

      return uniqueBy(
        ontology.object_properties
          .filter(isDisplayableObjectProperty)
          .filter((property) => property.domain === klass.id || property.range === klass.id)
          .slice(0, 10)
          .map((property) => {
            const neighborId = property.domain === klass.id ? property.range : property.domain;
            const neighbor = itemForOntologyId(neighborId);
            if (!neighbor) {
              return undefined;
            }

            return {
              item: neighbor,
              label: localizePropertyLabel(property, language),
              className: "viewer-edge viewer-edge--semantic"
            };
          })
          .filter((child): child is GraphChild => Boolean(child)),
        (child) => child.item.ref
      );
    };

    const childCountByRef = new Map<string, number>();
    const graphNodeMeta = new Map<string, GraphNodeMeta>();
    const queuedExpandedRefs = new Set<string>();

    const addVisibleNode = (item: DirectoryItem, level: number, position: cytoscape.Position, root = false) => {
      const existing = graphNodeMeta.get(item.ref);
      if (existing && existing.level <= level) {
        return;
      }

      graphNodeMeta.set(item.ref, { item, level, root, position: { ...position } });
    };

    const addEdge = (source: string, target: string, label: string, className = "viewer-edge", index = 0) => {
      if (source === target) {
        return;
      }

      const id = `${source}->${target}:${label || className}`;
      if (edges.has(id)) {
        return;
      }

      edges.set(id, {
        group: "edges",
        data: {
          id,
          source,
          target,
          label,
          edgeIndex: index
        },
        classes: className.includes("semantic") ? "edge-semantic" : "edge-hierarchy"
      });
    };

    const stableUnit = (value: string, salt: number) => {
      let hash = 2166136261 ^ salt;
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }

      return (hash >>> 0) / 4294967295;
    };

    const queue: Array<{ item: DirectoryItem; level: number; angle: number; spread: number }> = [{ item: rootItem, level: 0, angle: -Math.PI / 2, spread: Math.PI * 2 }];
    queuedExpandedRefs.add(rootItem.ref);
    addVisibleNode(rootItem, 0, { x: 0, y: 0 }, true);

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const current = queue[queueIndex];
      const children = childrenForItem(current.item);
      childCountByRef.set(current.item.ref, children.length);

      if (!graphExpandedRefs.has(current.item.ref)) {
        continue;
      }

      const nextLevel = current.level + 1;
      const radius = current.level === 0 ? 190 : 150 + Math.min(children.length, 8) * 8;
      const spread = current.level === 0 ? Math.PI * 2 : Math.min(current.spread * 0.96, Math.max(0.38, children.length * 0.18));
      const start = current.level === 0 ? -Math.PI / 2 : current.angle - spread / 2;
      const step = current.level === 0 ? Math.PI * 2 / children.length : children.length <= 1 ? 0 : spread / (children.length - 1);
      const allocatedSpread = current.level === 0 ? step * 0.82 : children.length <= 1 ? spread * 0.72 : Math.max(0.22, (spread / children.length) * 0.9);
      const parentPosition = graphNodeMeta.get(current.item.ref)?.position ?? { x: 0, y: 0 };

      children.forEach((child, index) => {
        const angleJitter = current.level === 0 ? (stableUnit(child.item.ref, 7) - 0.5) * 0.42 : (stableUnit(child.item.ref, 11) - 0.5) * 0.14;
        const distanceJitter = current.level === 0 ? 0.9 + stableUnit(child.item.ref, 17) * 0.24 : 0.94 + stableUnit(child.item.ref, 19) * 0.12;
        const tangentJitter = current.level === 0 ? (stableUnit(child.item.ref, 23) - 0.5) * 42 : (stableUnit(child.item.ref, 29) - 0.5) * 24;
        const angle = (children.length === 1 ? current.angle : start + step * index) + angleJitter;
        const tangentAngle = angle + Math.PI / 2;
        const position = {
          x: parentPosition.x + Math.cos(angle) * radius * distanceJitter + Math.cos(tangentAngle) * tangentJitter,
          y: parentPosition.y + Math.sin(angle) * radius * distanceJitter + Math.sin(tangentAngle) * tangentJitter
        };
        addVisibleNode(child.item, nextLevel, position);
        addEdge(current.item.ref, child.item.ref, child.label, child.className, index);

        if (graphExpandedRefs.has(child.item.ref) && !queuedExpandedRefs.has(child.item.ref)) {
          queuedExpandedRefs.add(child.item.ref);
          queue.push({ item: child.item, level: nextLevel, angle, spread: allocatedSpread });
        }
      });
    }

    for (const [ref, value] of graphNodeMeta.entries()) {
      const childCount = childCountByRef.get(ref) ?? childrenForItem(value.item).length;
      const expanded = graphExpandedRefs.has(ref);
      const size = value.root ? 36 : value.level <= 1 ? 27 : 21;
      const fontSize = value.root ? 23 : value.level <= 1 ? 19 : 16;
      const labelLength = localizeEntityLabel(value.item, language).length;
      const labelOnLeft = !value.root && value.position.x < -24;
      const collisionRadius = value.root
        ? 88
        : Math.min(118, Math.max(54, size + labelLength * (language === "en" ? 4.8 : 5.8)));
      nodes.set(ref, {
        group: "nodes",
        position: value.position,
        data: {
          id: ref,
          label: localizeEntityLabel(value.item, language),
          labelHalign: labelOnLeft ? "left" : "right",
          labelMarginX: labelOnLeft ? -14 : 14,
          eyebrow: localizeKind(value.item.kind, language),
          maturity: value.item.maturity,
          selectionRef: value.item.ref,
          nodeKind: value.item.kind,
          kind: value.item.kind,
          expandable: childCount > 0,
          expanded,
          childCount,
          level: value.level,
          size,
          fontSize,
          collisionRadius,
          accent: cytoscapeAccentForKind(value.item.kind, theme)
        },
        classes: [
          `kind-${value.item.kind}`,
          `maturity-${value.item.maturity}`,
          value.root ? "is-root" : "",
          childCount > 0 ? "expandable" : "",
          childCount > 0 && !expanded ? "collapsed" : "",
          expanded ? "expanded" : ""
        ]
          .filter(Boolean)
          .join(" ")
      });
    }

    return {
      elements: [...nodes.values(), ...edges.values()],
      nodeCount: nodes.size,
      edgeCount: edges.size
    } satisfies CytoscapeGraphModel;
  }, [
    classById,
    classesByModule,
    graphExpandedRefs,
    itemByRef,
    language,
    modulesByPlane,
    selectedItem,
    theme
  ]);

  const cytoscapeContainerRef = useRef<HTMLDivElement | null>(null);
  const cytoscapeRef = useRef<cytoscape.Core | null>(null);
  const graphElements = graphModel.elements;
  const graphExpansionKey = [...graphExpandedRefs].sort().join("|");
  const graphStyles = useMemo(() => cytoscapeStyles(theme), [theme]);
  const hasVisibleGraph = graphModel.nodeCount > 1 && graphModel.edgeCount > 0;

  useEffect(() => {
    if (!hasVisibleGraph) {
      cytoscapeRef.current?.destroy();
      cytoscapeRef.current = null;
      return undefined;
    }

    const container = cytoscapeContainerRef.current;
    if (!container) {
      return undefined;
    }

    cytoscapeRef.current?.destroy();
    container.dataset.layoutEngine = "fcose-force";
    container.dataset.hoverRelations = "predecessor";
    container.dataset.dragLayout = "continuous-local-force";
    container.dataset.crossingPolicy = "label-collision-and-crossing-relaxation";
    container.dataset.panDuringDrag = "locked";
    const cy = cytoscape({
      container,
      elements: graphElements,
      style: graphStyles,
      layout: { name: "grid", fit: true, padding: 28 },
      minZoom: 0.16,
      maxZoom: 2.6,
      boxSelectionEnabled: false,
      selectionType: "single",
      autounselectify: false
    });

    cytoscapeRef.current = cy;
    const selectedNode = cy.getElementById(selectedRef);
    if (selectedNode.nonempty()) {
      selectedNode.select();
    }

    let activeLayout: cytoscape.Layouts | undefined;
    let dragLayoutFrame: number | undefined;
    let settleFrame: number | undefined;
    let liveVelocities: Record<string, LiveForceVelocity> = {};
    const runForceLayout = (options: {
      animate: boolean;
      fit: boolean;
      randomize: boolean;
      quality?: FcoseQuality;
    }) => {
      activeLayout?.stop();
      activeLayout = cy.layout({
        name: "fcose",
        quality: options.quality ?? "proof",
        randomize: options.randomize,
        animate: options.animate ? "end" : false,
        animationDuration: options.animate ? 420 : 0,
        fit: options.fit,
        padding: 42,
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        nodeSeparation: 185,
        nodeRepulsion: (node: cytoscape.NodeSingular) => {
          const level = Number(node.data("level") ?? 1);
          return level === 0 ? 76000 : 48000;
        },
        idealEdgeLength: (edge: cytoscape.EdgeSingular) => {
          const sourceLevel = Number(edge.source().data("level") ?? 1);
          return sourceLevel === 0 ? 250 : 190;
        },
        edgeElasticity: (edge: cytoscape.EdgeSingular) => {
          const sourceLevel = Number(edge.source().data("level") ?? 1);
          return sourceLevel === 0 ? 0.08 : 0.12;
        },
        nestingFactor: 0.12,
        numIter: 4600,
        gravity: 0.04,
        gravityRange: 3.6,
        initialEnergyOnIncremental: 0.24,
        tile: true,
        stop: () => {
          if (options.fit) {
            cy.fit(cy.elements(), 36);
          }
        }
      } as unknown as cytoscape.LayoutOptions);
      activeLayout.run();
    };

    const collectLiveNodes = (lockedNode?: cytoscape.NodeSingular): LiveForceNode[] =>
      cy.nodes().map((node) => {
        const position = node.position();
        return {
          id: node.id(),
          x: position.x,
          y: position.y,
          locked: lockedNode?.id() === node.id(),
          collisionRadius: Number(node.data("collisionRadius") ?? 60)
        };
      });

    const collectLiveEdges = (): LiveForceEdge[] =>
      cy.edges().map((edge) => ({
        source: edge.source().id(),
        target: edge.target().id()
      }));

    const applyLiveRelaxationFrame = (lockedNode?: cytoscape.NodeSingular) => {
      const result = relaxLiveForceFrame({
        nodes: collectLiveNodes(lockedNode),
        edges: collectLiveEdges(),
        velocities: liveVelocities,
        options: {
          idealEdgeLength: 225,
          attraction: 0.042,
          repulsion: 5200,
          damping: 0.5,
          maxStep: lockedNode ? 8 : 5,
          minimumDistance: 26,
          collisionRadius: 62,
          collisionStrength: 1.05,
          crossingStrength: 22
        }
      });

      liveVelocities = result.velocities;
      for (const node of result.nodes) {
        if (node.locked) {
          continue;
        }

        cy.getElementById(node.id).position({ x: node.x, y: node.y });
      }
    };

    const cancelDragFrames = () => {
      if (dragLayoutFrame !== undefined) {
        window.cancelAnimationFrame(dragLayoutFrame);
        dragLayoutFrame = undefined;
      }

      if (settleFrame !== undefined) {
        window.cancelAnimationFrame(settleFrame);
        settleFrame = undefined;
      }
    };

    const runSettleFrames = (remainingFrames: number, anchoredNode?: cytoscape.NodeSingular) => {
      if (remainingFrames <= 0) {
        settleFrame = undefined;
        return;
      }

      settleFrame = window.requestAnimationFrame(() => {
        applyLiveRelaxationFrame(anchoredNode);
        runSettleFrames(remainingFrames - 1, anchoredNode);
      });
    };

    runForceLayout({ animate: false, fit: true, randomize: true });

    const onNodeTap = (event: cytoscape.EventObject) => {
      const node = event.target;
      const ref = String(node.data("selectionRef"));
      const expandable = Boolean(node.data("expandable"));
      node.select();

      if (!expandable) {
        return;
      }

      setGraphExpandedRefs((current) => {
        const next = new Set(current);
        if (ref === selectedRef) {
          next.add(ref);
          return next;
        }

        if (next.has(ref)) {
          next.delete(ref);
        } else {
          next.add(ref);
        }
        return next;
      });
    };

    const clearHoverRelations = () => {
      cy.elements(".is-hover-node, .is-hover-edge").removeClass("is-hover-node is-hover-edge");
    };

    const onNodeMouseOver = (event: cytoscape.EventObject) => {
      clearHoverRelations();
      const node = event.target as cytoscape.NodeSingular;
      const incomingEdges = node.incomers("edge");
      const visibleEdges = incomingEdges.nonempty() ? incomingEdges : node.connectedEdges();
      node.addClass("is-hover-node");
      visibleEdges.addClass("is-hover-edge");
      visibleEdges.connectedNodes().addClass("is-hover-node");
    };

    const onNodeMouseOut = () => {
      clearHoverRelations();
    };

    const onNodeDrag = (event: cytoscape.EventObject) => {
      const node = event.target as cytoscape.NodeSingular;
      activeLayout?.stop();
      node.addClass("is-dragging");
      if (dragLayoutFrame !== undefined) {
        return;
      }

      dragLayoutFrame = window.requestAnimationFrame(() => {
        dragLayoutFrame = undefined;
        applyLiveRelaxationFrame(node);
      });
    };

    const onNodeDragFree = (event: cytoscape.EventObject) => {
      const node = event.target as cytoscape.NodeSingular;
      cancelDragFrames();
      node.removeClass("is-dragging");
      liveVelocities = {};
      runSettleFrames(14, node);
    };

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
      cy.fit(cy.elements(), 28);
    });

    cy.on("tap", "node", onNodeTap);
    cy.on("mouseover", "node", onNodeMouseOver);
    cy.on("mouseout", "node", onNodeMouseOut);
    cy.on("drag", "node", onNodeDrag);
    cy.on("dragfree", "node", onNodeDragFree);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelDragFrames();
      cy.off("tap", "node", onNodeTap);
      cy.off("mouseover", "node", onNodeMouseOver);
      cy.off("mouseout", "node", onNodeMouseOut);
      cy.off("drag", "node", onNodeDrag);
      cy.off("dragfree", "node", onNodeDragFree);
      activeLayout?.stop();
      cy.destroy();
      if (cytoscapeRef.current === cy) {
        cytoscapeRef.current = null;
      }
    };
  }, [graphElements, graphExpansionKey, graphStyles, hasVisibleGraph, selectedRef]);

  const sourceIds = unique([
    ...selectedItem.source_ids,
    ...planeSourceIds(selectedPlane?.id ?? ""),
    ...sourceIdsOf(selectedModule),
    ...sourceIdsOf(selectedClass),
    ...relevantObjectProperties.flatMap((property) => sourceIdsOf(property)),
    ...relevantDataProperties.flatMap((property) => sourceIdsOf(property)),
    ...relevantAxioms.flatMap((axiom) => sourceIdsOf(axiom))
  ]);

  const pathParts = [
    { label: ontology.label, ref: entityRef("domain", ontology.id) },
    selectedPlane ? { label: selectedPlane.label, ref: entityRef("plane", selectedPlane.id) } : undefined,
    selectedModule ? { label: selectedModule.label, ref: entityRef("module", selectedModule.id) } : undefined,
    selectedClass ? { label: selectedClass.label, ref: entityRef("class", selectedClass.id) } : undefined
  ].filter((part): part is { label: string; ref: string } => Boolean(part));

  const toggleExpanded = (ref: string) => {
    setExpandedRefs((current) => {
      const next = new Set(current);
      if (next.has(ref)) {
        next.delete(ref);
      } else {
        next.add(ref);
      }
      return next;
    });
  };

  const selectRef = (ref: string) => {
    setSelectedRef(ref);
    let parentRef = itemByRef.get(ref)?.parent_ref;
    setExpandedRefs((current) => {
      const next = new Set(current);
      while (parentRef) {
        next.add(parentRef);
        parentRef = itemByRef.get(parentRef)?.parent_ref;
      }
      return next;
    });
  };

  const exportOntology = () => {
    downloadText(copy.selectedJsonName, JSON.stringify(ontology, null, 2));
  };

  return (
    <>
      <a className="skip-link" href="#viewer-content">
        {copy.skip}
      </a>
      <main className="app-shell fibo-viewer" lang={language === "zh" ? "zh-Hans" : language}>
        <header className="viewer-header" aria-label={copy.title}>
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <div>
              <p className="eyebrow">{copy.brandEyebrow}</p>
              <h1>{copy.title}</h1>
            </div>
          </div>
          <div className="global-actions" aria-label={copy.viewer}>
            <div className="inline-switch" aria-label={copy.language}>
              {(["zh", "en", "ja"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  data-testid={`language-${lang}`}
                  className={language === lang ? "is-active" : ""}
                  aria-pressed={language === lang}
                  onClick={() => setLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="inline-switch" aria-label={copy.theme}>
              {(["dark", "light"] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  data-testid={`theme-${mode}`}
                  className={theme === mode ? "is-active" : ""}
                  aria-pressed={theme === mode}
                  onClick={() => setTheme(mode)}
                >
                  {mode === "dark" ? copy.darkTheme : copy.lightTheme}
                </button>
              ))}
            </div>
            <button type="button" className="download-link" onClick={exportOntology}>
              JSON
            </button>
          </div>
        </header>

        <section
          className={`viewer-grid ${leftCollapsed ? "is-left-collapsed" : ""}`}
          aria-label={copy.title}
        >
          <aside className={`directory-panel ${leftCollapsed ? "is-collapsed" : ""}`} aria-label={copy.search}>
            <div className="panel-control">
              <button type="button" onClick={() => setLeftCollapsed((value) => !value)} aria-expanded={!leftCollapsed}>
                {leftCollapsed ? copy.openLeft : copy.closeLeft}
              </button>
            </div>
            <div className="directory-search">
              <p className="panel-kicker">{copy.browseDomains}</p>
              <h2>{localizeEntityLabel(directoryItems[0], language)}</h2>
              <label htmlFor="ontology-search">{copy.search}</label>
              <input
                id="ontology-search"
                value={query}
                type="search"
                placeholder={copy.searchPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="tree-root" data-testid="ontology-directory">
              <DirectoryButton
                item={directoryItems[0]}
                depth={0}
                selectedRef={selectedRef}
                expandedRefs={expandedRefs}
                matchingRefs={matchingRefs}
                hasChildren
                queryActive={filterActive}
                language={language}
                onToggle={toggleExpanded}
                onSelect={selectRef}
              />
              {(expandedRefs.has(entityRef("domain", ontology.id)) || filterActive) &&
                ontology.planes.map((plane) => (
                  <PlaneBranch
                    key={plane.id}
                    plane={plane}
                    modules={modulesByPlane.get(plane.id) ?? []}
                    classesByModule={classesByModule}
                    selectedRef={selectedRef}
                    expandedRefs={expandedRefs}
                    matchingRefs={matchingRefs}
                    queryActive={filterActive}
                    language={language}
                    itemByRef={itemByRef}
                    onToggle={toggleExpanded}
                    onSelect={selectRef}
                  />
                ))}
            </div>
            <section className="sidebar-statistics" data-testid="left-statistics" aria-label={copy.ontologyMetrics}>
              <p className="panel-kicker">{copy.browseLogs}</p>
              <h2>{copy.ontologyMetrics}</h2>
              <div className="metric-stack">
                {Object.entries(ontology.ontology_metrics).map(([key, value]) => (
                  <div key={key}>
                    <span>{metricLabels[language][key] ?? translatePhrase(key, language)}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section id="viewer-content" className="content-panel" aria-label={copy.entityDetail}>
            <div className="breadcrumb" aria-label={copy.path}>
              {pathParts.map((part, index) => (
                <button key={part.ref} type="button" onClick={() => selectRef(part.ref)}>
                  {index > 0 ? <span>/</span> : null}
                  {localizeEntityLabel(itemByRef.get(part.ref) ?? { id: part.ref, label: part.label, kind: "domain" }, language)}
                </button>
              ))}
            </div>

            <article className="entity-hero">
              <div>
                <p className="eyebrow">{localizeKind(selectedItem.kind, language)}</p>
                <h2>{localizeEntityLabel(selectedItem, language)}</h2>
                <p>{definitionForLanguage(selectedItem, language)}</p>
              </div>
              <dl className="summary-metrics">
                <div>
                  <dt>{copy.status}</dt>
                  <dd>{maturityLabels[language][selectedItem.maturity]}</dd>
                </div>
                <div>
                  <dt>{copy.iri}</dt>
                  <dd>{ontology.artifact_metadata.base_iri}{selectedItem.id}</dd>
                </div>
                <div>
                  <dt>{copy.sources}</dt>
                  <dd>{sourceIds.length}</dd>
                </div>
              </dl>
            </article>

            {hasVisibleGraph ? (
              <section className="viewer-canvas" data-testid="ontology-canvas" aria-label={copy.structure}>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{copy.structure}</p>
                    <h3>{copy.hierarchy}</h3>
                  </div>
                  <span data-testid="graph-count" data-node-count={graphModel.nodeCount} data-edge-count={graphModel.edgeCount}>
                    {copy.nodesEdges(graphModel.nodeCount, graphModel.edgeCount)}
                  </span>
                </div>
                <div
                  key={`${selectedRef}-${language}-${graphExpansionKey}-${leftCollapsed ? "left-closed" : "left-open"}`}
                  ref={cytoscapeContainerRef}
                  className="cytoscape-graph"
                  data-testid="cytoscape-graph"
                  role="application"
                  aria-label={copy.structure}
                />
              </section>
            ) : (
              <section className="graph-empty-state" data-testid="graph-empty-state" aria-label={copy.graphEmptyTitle}>
                <p className="eyebrow">{copy.structure}</p>
                <h3>{copy.graphEmptyTitle}</h3>
                <p>{copy.graphEmptyBody}</p>
              </section>
            )}

            <section className="ontology-characteristics" data-testid="ontology-characteristics" aria-label={copy.ontologicalCharacteristic}>
              <h3>{copy.ontologicalCharacteristic}</h3>
              <table>
                <tbody>
                  <tr>
                    <th scope="row">{copy.instanceClassification}</th>
                    <td>
                      <button type="button" className="table-link" onClick={() => selectedItem.parent_ref && selectRef(selectedItem.parent_ref)}>
                        {selectedModule
                          ? localizeEntityLabel({ id: selectedModule.id, label: selectedModule.label, kind: "module" }, language)
                          : localizeKind(selectedItem.kind, language)}
                      </button>
                      <span>{localizeKind(selectedItem.kind, language)}</span>
                    </td>
                  </tr>

                  {childModules.length > 0 ? (
                    <tr>
                      <th scope="row">{copy.hasPart}</th>
                      <td>
                        <ul>
                          {childModules.map((module) => (
                            <li key={module.id}>
                              <button type="button" className="table-link" onClick={() => selectRef(entityRef("module", module.id))}>
                                {localizeEntityLabel(itemByRef.get(entityRef("module", module.id)) ?? { id: module.id, label: module.label, kind: "module" }, language)}
                              </button>
                              <span>{copy.classCount(module.class_ids.length)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}

                  {childClasses.length > 0 ? (
                    <tr>
                      <th scope="row">{copy.containsClasses}</th>
                      <td>
                        <ul>
                          {childClasses.slice(0, 28).map((klass) => (
                            <li key={klass.id}>
                              <button type="button" className="table-link" onClick={() => selectRef(entityRef("class", klass.id))}>
                                {localizeClassLabel(klass, language)}
                              </button>
                              <span>{localizeClassKind(klass.kind, language)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}

                  {relevantObjectProperties.length > 0 ? (
                    <tr>
                      <th scope="row">{copy.relationPredicates}</th>
                      <td>
                        <ul>
                          {relevantObjectProperties.slice(0, 24).map((property) => (
                            <li key={property.id}>
                              <strong>{localizePropertyLabel(property, language)}</strong>
                              <span>{`${localizePropertyEndpoint(property.domain, language)} -> ${localizePropertyEndpoint(property.range, language)}`}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}

                  {relevantDataProperties.length > 0 ? (
                    <tr>
                      <th scope="row">{copy.literalFields}</th>
                      <td>
                        <ul>
                          {relevantDataProperties.slice(0, 24).map((property) => (
                            <li key={property.id}>
                              <strong>{localizePropertyLabel(property, language)}</strong>
                              <span>{translatePhrase(property.range, language)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}

                  <tr>
                    <th scope="row">{copy.metaInformation}</th>
                    <td>
                      <ul>
                        <li>
                          <strong>{copy.status}</strong>
                          <span>{maturityLabels[language][selectedItem.maturity]}</span>
                        </li>
                        <li>
                          <strong>{copy.sources}</strong>
                          <span>{sourceIds.slice(0, 12).join(" / ")}</span>
                        </li>
                        {relevantAxioms.slice(0, 4).map((axiom) => (
                          <li key={axiom.id}>
                            <strong>{translatePhrase(axiom.type, language)}</strong>
                            <span>{language === "en" ? axiom.statement : language === "zh" ? "该约束用于保持本体结构、证据和边界的一致性。" : "この制約は本体構造、証拠、境界の一貫性を保ちます。"}</span>
                          </li>
                        ))}
                        {relevantAdapters.slice(0, 4).map((adapter) => (
                          <li key={adapter.adapter}>
                            <strong>{localizeAdapterName(adapter.adapter, language)}</strong>
                            <span>{adapter.maps_to.slice(0, 6).map((id) => localizePropertyEndpoint(id, language)).join(" / ")}</span>
                          </li>
                        ))}
                        {relevantIndividuals.slice(0, 4).map((individual) => (
                          <li key={individual.id}>
                            <strong>{copy.individuals}</strong>
                            <span>{translatePhrase(individual.label, language)}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </section>

        </section>
      </main>
    </>
  );
}

interface DirectoryButtonProps {
  item: DirectoryItem;
  depth: number;
  selectedRef: string;
  expandedRefs: Set<string>;
  matchingRefs: Set<string>;
  hasChildren: boolean;
  queryActive: boolean;
  language: Language;
  onToggle: (ref: string) => void;
  onSelect: (ref: string) => void;
}

function DirectoryButton({
  item,
  depth,
  selectedRef,
  expandedRefs,
  matchingRefs,
  hasChildren,
  queryActive,
  language,
  onToggle,
  onSelect
}: DirectoryButtonProps) {
  const hiddenByQuery = queryActive && !matchingRefs.has(item.ref);
  const isSelected = selectedRef === item.ref;
  const isExpanded = expandedRefs.has(item.ref);

  if (hiddenByQuery) {
    return null;
  }

  return (
    <div className="tree-item" style={{ "--tree-depth": depth } as CSSProperties}>
      {hasChildren ? (
        <button
          type="button"
          className="tree-toggle"
          aria-label={`${isExpanded ? uiText[language].closeLeft : uiText[language].openLeft} ${localizeEntityLabel(item, language)}`}
          onClick={() => onToggle(item.ref)}
        >
          {isExpanded ? "-" : "+"}
        </button>
      ) : (
        <span className="tree-spacer" aria-hidden="true" />
      )}
      <button
        type="button"
        className={`tree-button ${isSelected ? "is-selected" : ""} tree-button--${item.maturity}`}
        aria-current={isSelected ? "true" : undefined}
        onClick={() => onSelect(item.ref)}
      >
        <span>{localizeEntityLabel(item, language)}</span>
        <small>{localizeKind(item.kind, language)}</small>
      </button>
    </div>
  );
}

interface PlaneBranchProps {
  plane: Plane;
  modules: Module[];
  classesByModule: Map<string, OntologyClass[]>;
  selectedRef: string;
  expandedRefs: Set<string>;
  matchingRefs: Set<string>;
  queryActive: boolean;
  language: Language;
  itemByRef: Map<string, DirectoryItem>;
  onToggle: (ref: string) => void;
  onSelect: (ref: string) => void;
}

function PlaneBranch({
  plane,
  modules,
  classesByModule,
  selectedRef,
  expandedRefs,
  matchingRefs,
  queryActive,
  language,
  itemByRef,
  onToggle,
  onSelect
}: PlaneBranchProps) {
  const planeRef = entityRef("plane", plane.id);
  const planeItem = itemByRef.get(planeRef);

  if (!planeItem) {
    return null;
  }

  return (
    <>
      <DirectoryButton
        item={planeItem}
        depth={1}
        selectedRef={selectedRef}
        expandedRefs={expandedRefs}
        matchingRefs={matchingRefs}
        hasChildren={modules.length > 0}
        queryActive={queryActive}
        language={language}
        onToggle={onToggle}
        onSelect={onSelect}
      />
      {(expandedRefs.has(planeRef) || queryActive) &&
        modules.map((module) => (
          <ModuleBranch
            key={module.id}
            module={module}
            classes={classesByModule.get(module.id) ?? []}
            selectedRef={selectedRef}
            expandedRefs={expandedRefs}
            matchingRefs={matchingRefs}
            queryActive={queryActive}
            language={language}
            itemByRef={itemByRef}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

interface ModuleBranchProps {
  module: Module;
  classes: OntologyClass[];
  selectedRef: string;
  expandedRefs: Set<string>;
  matchingRefs: Set<string>;
  queryActive: boolean;
  language: Language;
  itemByRef: Map<string, DirectoryItem>;
  onToggle: (ref: string) => void;
  onSelect: (ref: string) => void;
}

function ModuleBranch({
  module,
  classes,
  selectedRef,
  expandedRefs,
  matchingRefs,
  queryActive,
  language,
  itemByRef,
  onToggle,
  onSelect
}: ModuleBranchProps) {
  const moduleRef = entityRef("module", module.id);
  const moduleItem = itemByRef.get(moduleRef);

  if (!moduleItem) {
    return null;
  }

  return (
    <>
      <DirectoryButton
        item={moduleItem}
        depth={2}
        selectedRef={selectedRef}
        expandedRefs={expandedRefs}
        matchingRefs={matchingRefs}
        hasChildren={classes.length > 0}
        queryActive={queryActive}
        language={language}
        onToggle={onToggle}
        onSelect={onSelect}
      />
      {(expandedRefs.has(moduleRef) || queryActive) &&
        classes.map((klass) => {
          const classItem = itemByRef.get(entityRef("class", klass.id));
          if (!classItem) {
            return null;
          }

          return (
            <DirectoryButton
              key={klass.id}
              item={classItem}
              depth={3}
              selectedRef={selectedRef}
              expandedRefs={expandedRefs}
              matchingRefs={matchingRefs}
              hasChildren={false}
              queryActive={queryActive}
              language={language}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          );
        })}
    </>
  );
}

export default App;
