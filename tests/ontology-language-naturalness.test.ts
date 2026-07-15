import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ontologyArtifactPath } from "./helpers/ontology-artifact";

type Language = "zh" | "en" | "ja";
type JsonRecord = Record<string, unknown>;
type LocalizedText = Partial<Record<Language, string>>;

interface LabeledEntity extends JsonRecord {
  id: string;
  labels: LocalizedText;
}

interface OntologyModule extends LabeledEntity {
  definitions?: LocalizedText;
  purpose?: LocalizedText;
  includes?: LocalizedText[];
  excludes?: LocalizedText[];
}

interface Concept extends LabeledEntity {
  semantic_kind?: unknown;
}

interface Relation extends LabeledEntity {
  status?: string;
  definitions?: LocalizedText;
}

interface CandidateOntology {
  modules: OntologyModule[];
  classes: Concept[];
  relations: Relation[];
}

interface TextEntry {
  ownerId: string;
  path: string;
  text: string;
}

const languages = ["zh", "en", "ja"] as const;

const bannedTemplatePatterns = [
  /本模块在“.*”边界内/u,
  /以 .* 为代表闭包/u,
  /把概念层级、语义关系和节点内信息组织成/u,
  /Within the .* Module boundary/u,
  /uses .* as a representative closure fact/u,
  /organizes taxonomy, semantic relations, and node information as one queryable, verifiable graph/u,
  /^工程师借助.+判断一项事实是否由.+语义拥有，并沿同一 canonical 图追踪其输入、输出、失败边界与恢复路径。$/u,
  /^.+以.+为关键概念，组织.+及其真实分类、组成、阶段和产出关系。$/u,
  /^.+等具有独立身份、定义和来源的概念家族。$/u,
  /^由.+出发、经审查的分类与结构骨架，以及附着在原节点和关系上的例子、约束和来源。$/u,
  /^.+拥有的核心语义不在此重复定义；跨边界使用只引用 .+ 的 canonical ID 与关系事实。$/u,
  /^Engineers use .+ to decide whether a fact belongs to .+ semantics and to trace its inputs, outputs, failure boundary, and recovery path in the same canonical graph\.$/u,
  /^.+ uses .+ as its key notion and organizes .+ through real specialization, composition, phase, and production relations\.$/u,
  /^Concept families with independent identity, definitions, and provenance, including .+\.$/u,
  /^The reviewed taxonomy and structural backbone rooted at .+, with examples, constraints, and evidence attached to original nodes and relations\.$/u,
  /^Core semantics owned by .+ are not redefined here; cross-boundary use references canonical IDs and relation facts owned by .+\.$/u,
  /以 .+ 关系连接 .+，二者保持各自的 semantic kind/u,
  /connects to .+ through .+ while both retain their semantic kinds/iu,
  /は .+ により .+ へ接続し、両者はそれぞれの semantic kind を保ちます/u,
] as const;

const unreviewedDomainTerms = [
  "信息制品",
  "能力表面",
  "流程闭包",
  "摄入界面",
] as const;

const localeSuffixes: Readonly<Record<Language, RegExp>> = {
  zh: /模块\s*$/u,
  en: /\bModule\s*$/u,
  ja: /モジュール\s*$/u,
};

const readCandidate = (): CandidateOntology =>
  JSON.parse(readFileSync(ontologyArtifactPath(), "utf8")) as CandidateOntology;

const localizedEntries = (
  ownerId: string,
  path: string,
  value: LocalizedText | LocalizedText[] | undefined,
): TextEntry[] => {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.flatMap((item, index) =>
    languages.flatMap((language) => {
      const text = item[language];
      return typeof text === "string"
        ? [{
            ownerId,
            path: `${path}${Array.isArray(value) ? `[${index}]` : ""}.${language}`,
            text,
          }]
        : [];
    }),
  );
};

const moduleTextEntries = (module: OntologyModule): TextEntry[] => [
  ...localizedEntries(module.id, "labels", module.labels),
  ...localizedEntries(module.id, "definitions", module.definitions),
  ...localizedEntries(module.id, "purpose", module.purpose),
  ...localizedEntries(module.id, "includes", module.includes),
  ...localizedEntries(module.id, "excludes", module.excludes),
];

const relationTextEntries = (relation: Relation): TextEntry[] => [
  ...localizedEntries(relation.id, "definitions", relation.definitions),
];

describe("ontology language naturalness release gates", () => {
  it("rejects banned template phrases", () => {
    const candidate = readCandidate();
    const entries = [
      ...candidate.modules.flatMap(moduleTextEntries),
      ...candidate.relations
        .filter(({ status }) => status === "accepted")
        .flatMap(relationTextEntries),
    ];
    const violations = entries.flatMap(({ ownerId, path, text }) =>
        bannedTemplatePatterns.some((pattern) => pattern.test(text))
          ? [`${ownerId}:${path}`]
          : [],
    );

    expect(violations).toEqual([]);
  });

  it("rejects unresolved semantic-kind question marks", () => {
    const violations = readCandidate().classes.flatMap((concept) => {
      const semanticKind = concept.semantic_kind;
      return typeof semanticKind === "string" && /[?？]/u.test(semanticKind)
        ? [`${concept.id}:${semanticKind}`]
        : [];
    });

    expect(violations).toEqual([]);
  });

  it("requires artifact translations to use reviewed domain terms", () => {
    const violations = readCandidate().modules.flatMap((module) =>
      moduleTextEntries(module).flatMap(({ ownerId, path, text }) =>
        unreviewedDomainTerms.flatMap((term) =>
          text.includes(term) ? [`${ownerId}:${path}:${term}`] : [],
        ),
      ),
    );

    expect(violations).toEqual([]);
  });

  it("requires trilingual labels after each module rename", () => {
    const violations = readCandidate().modules.flatMap((module) =>
      languages.flatMap((language) => {
        const label = module.labels[language];
        if (typeof label !== "string" || label.trim().length === 0) {
          return [`${module.id}:labels.${language}:missing`];
        }
        return localeSuffixes[language].test(label)
          ? [`${module.id}:labels.${language}:legacy-suffix`]
          : [];
      }),
    );

    expect(violations).toEqual([]);
  });
});
