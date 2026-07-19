import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import type {
  Expression,
  Node,
  ObjectLiteralExpression,
  PropertyName,
  SourceFile,
} from "typescript";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const ts = require("typescript") as typeof import("typescript");

const canonicalTypesPath = new URL("../src/lib/canonical-ontology-types.ts", import.meta.url);
const uiTextPath = new URL("../src/i18n/ui-text.ts", import.meta.url);

const unwrapObjectLiteral = (node: Expression | undefined): ObjectLiteralExpression | undefined => {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current))
  ) current = current.expression;
  return current && ts.isObjectLiteralExpression(current) ? current : undefined;
};

const propertyName = (name: PropertyName | undefined): string | undefined => (
  name && (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
    ? name.text
    : undefined
);

const sourceFile = (path: URL): SourceFile => ts.createSourceFile(
  path.pathname,
  readFileSync(path, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);

const typeAliasNames = (source: SourceFile): ReadonlySet<string> => new Set(
  source.statements.flatMap((statement) => ts.isTypeAliasDeclaration(statement)
    ? [statement.name.text]
    : []),
);

const propertySignatureNames = (source: SourceFile): ReadonlySet<string> => {
  const names = new Set<string>();
  const collect = (node: Node): void => {
    if (ts.isPropertySignature(node)) {
      const name = propertyName(node.name);
      if (name) names.add(name);
    }
    ts.forEachChild(node, collect);
  };
  collect(source);
  return names;
};

const authoredLocaleKeys = (source: SourceFile): ReadonlyMap<string, ReadonlySet<string>> => {
  const declaration = source.statements.flatMap((statement) => ts.isVariableStatement(statement)
    ? statement.declarationList.declarations
    : []).find((candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === "authoredUiText");
  const authored = unwrapObjectLiteral(declaration?.initializer);
  if (!authored) throw new Error("authoredUiText must remain a direct locale object");

  return new Map(authored.properties.flatMap((locale) => {
    if (!ts.isPropertyAssignment(locale)) return [];
    const language = propertyName(locale.name);
    const entries = unwrapObjectLiteral(locale.initializer);
    if (!language || !entries) return [];
    return [[language, new Set(entries.properties.flatMap((entry) => {
      const name = propertyName(entry.name);
      return name ? [name] : [];
    }))]];
  }));
};

describe("retired governance source cleanup", () => {
  it("defines the canonical consumer contract directly without retired governance declarations", () => {
    const source = sourceFile(canonicalTypesPath);
    const aliases = typeAliasNames(source);
    const properties = propertySignatureNames(source);
    const retiredAliases = ["Reviewer", "Review", "MappingConformance", "ExternalMapping"];
    const retiredProperties = [
      "review",
      "review_status",
      "reviewers",
      "maturity",
      "maturity_changes",
      "change_history",
      "change_log",
      "adaptation_mapping",
      "adaptation_mappings",
      "external_mappings",
      "axioms",
      "axiom_validation",
      "axioms_and_validation",
    ];
    const text = source.getFullText();

    expect([...aliases]).not.toEqual(expect.arrayContaining(retiredAliases));
    expect([...properties]).not.toEqual(expect.arrayContaining(retiredProperties));
    expect(text).not.toMatch(/\bOmit\s*</u);
    expect(text).not.toContain("schemas/source/agent-ontology-artifact-contract.json");
    expect(text).not.toContain("artifact_contract_sha256=");
  });

  it("keeps retired governance and external-mapping copy out of every authored locale without a runtime filter", () => {
    const source = sourceFile(uiTextPath);
    const authored = authoredLocaleKeys(source);
    const retiredKeys = [
      "lifecyclePosition",
      "solvesProblem",
      "validationRules",
      "externalMappings",
      "sourceClaims",
      "maturityChanges",
      "versionIri",
      "verifiedVersion",
      "mappingVersion",
      "mappingScope",
      "mappingKind",
      "conversionNote",
      "mappingConformance",
      "conformanceStatus",
      "conformanceTestId",
      "conformanceMethod",
      "introduced",
      "deprecated",
      "replacements",
      "changeNote",
      "expectedResult",
      "fieldValues",
      "mappingDirection",
      "mappingLoss",
      "interactionContract",
      "competencyQuestions",
      "deprecationReason",
      "hygieneGates",
      "status",
      "review",
      "reviewers",
    ];

    expect([...authored.keys()].sort()).toEqual(["en", "ja", "zh"]);
    for (const language of ["zh", "en", "ja"]) {
      expect([...authored.get(language)!]).not.toEqual(expect.arrayContaining(retiredKeys));
    }
    expect(source.getFullText()).not.toMatch(/\bretiredUiTextKeys\b|\bpublicUiText\b/u);
  });
});
