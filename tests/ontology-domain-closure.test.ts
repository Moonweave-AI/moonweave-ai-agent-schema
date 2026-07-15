import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildReviewedDomainClosurePlanes } from
  "../scripts/lib/ontology-domain-closure.mjs";

type Locale = "zh" | "en" | "ja";

interface LocalizedText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

interface DomainRecord {
  readonly id: string;
  readonly purpose: LocalizedText;
  readonly includes: readonly LocalizedText[];
  readonly excludes: readonly LocalizedText[];
  readonly status: string;
}

interface ModuleRecord {
  readonly id: string;
  readonly plane_id: string;
  readonly labels: LocalizedText;
  readonly status: string;
}

const sourceRoot = resolve(import.meta.dirname, "../ontology/source");
const product = JSON.parse(
  readFileSync(resolve(sourceRoot, "agent-ontology.product.json"), "utf8"),
) as { readonly planes: readonly DomainRecord[] };
const persistenceSource = readFileSync(
  resolve(import.meta.dirname, "../scripts/migration/semantic-depth-v3/persistence.mjs"),
  "utf8",
);

const modules = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((plane) =>
    readdirSync(resolve(sourceRoot, plane.name))
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        const source = JSON.parse(
          readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
        ) as { readonly module?: ModuleRecord };
        return source.module === undefined ? [] : [source.module];
      }),
  );

const moduleById = new Map(modules.map((module) => [module.id, module]));
const locales = ["zh", "en", "ja"] as const satisfies readonly Locale[];

const expectedClosureAnchors = {
  "info-plane": {
    includes: ["info-content-block-modality", "info-indexing", "info-output-disclosure"],
    excludes: ["memory-context", "safety-disclosure-redaction"],
  },
  "orchestration-plane": {
    includes: ["orchestration-task-planning", "orchestration-delegation-handoff", "orchestration-routing-control"],
    excludes: ["runtime-execution-attempts", "feedback-metrics-evaluation"],
  },
  "runtime-plane": {
    includes: ["runtime-system", "runtime-execution-attempts", "runtime-artifacts"],
    excludes: ["orchestration-task-planning", "feedback-review-optimization"],
  },
  "adapter-plane": {
    includes: ["adapter-mapping-infrastructure", "adapter-protocols", "adapter-schema-export"],
    excludes: ["runtime-system", "feedback-metrics-evaluation"],
  },
  "tool-plane": {
    includes: ["tool-registry-definition", "tool-discovery-selection", "tool-invocation-execution"],
    excludes: ["orchestration-delegation-handoff", "runtime-execution-attempts"],
  },
  "safety-plane": {
    includes: ["safety-trust-boundary", "safety-permission-policy", "safety-commit-redaction"],
    excludes: ["tool-invocation-execution", "info-output-disclosure"],
  },
  "feedback-plane": {
    includes: ["feedback-logging", "feedback-metrics-evaluation", "feedback-review-optimization"],
    excludes: ["runtime-observability", "orchestration-evaluation"],
  },
  "memory-plane": {
    includes: ["memory-ingestion", "memory-embedding-indexes", "memory-retrieval-ranking", "memory-lifecycle"],
    excludes: ["info-indexing", "runtime-artifacts"],
  },
} as const;

const legacyTemplatePatterns: Readonly<Record<Locale, readonly RegExp[]>> = {
  zh: [/组成的闭环问题空间/u, /其他一级领域独立拥有的身份语义/u, /跨域事实只通过 canonical 关系连接/iu],
  en: [/A closed problem space formed by/iu, /Identity semantics independently owned by other top-level domains/iu, /cross-domain facts connect only through canonical relations/iu],
  ja: [/で構成される閉じた問題空間/u, /他の最上位ドメインが独立所有する同一性意味/u, /ドメイン横断事実は canonical 関係だけ/u],
};

const normalize = (value: string): string =>
  value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase();

describe("Domain-level semantic closure", () => {
  it("gives every Domain independently authored trilingual purpose, inclusion, and exclusion contracts", () => {
    const acceptedDomains = product.planes.filter(({ status }) => status === "accepted");
    expect(acceptedDomains).toHaveLength(8);
    expect(acceptedDomains.map(({ id }) => id).sort()).toEqual(
      Object.keys(expectedClosureAnchors).sort(),
    );

    for (const domain of acceptedDomains) {
      expect(domain.includes, `${domain.id}/includes`).toHaveLength(2);
      expect(domain.excludes, `${domain.id}/excludes`).toHaveLength(2);
      for (const locale of locales) {
        const purpose = domain.purpose[locale];
        const inclusions = domain.includes.map((entry) => entry[locale]);
        const exclusions = domain.excludes.map((entry) => entry[locale]);
        expect(purpose.trim().length, `${domain.id}/purpose/${locale}`).toBeGreaterThan(12);
        expect(inclusions.join(" ").length, `${domain.id}/includes/${locale}`).toBeGreaterThan(70);
        expect(exclusions.join(" ").length, `${domain.id}/excludes/${locale}`).toBeGreaterThan(90);
        expect(new Set(inclusions.map(normalize)).size, `${domain.id}/includes/${locale}/unique`).toBe(inclusions.length);
        expect(new Set(exclusions.map(normalize)).size, `${domain.id}/excludes/${locale}/unique`).toBe(exclusions.length);
        for (const pattern of legacyTemplatePatterns[locale]) {
          expect(`${purpose} ${inclusions.join(" ")} ${exclusions.join(" ")}`, `${domain.id}/${locale}/${pattern}`).not.toMatch(pattern);
        }
      }
    }

    for (const locale of locales) {
      for (const field of ["purpose", "includes", "excludes"] as const) {
        const values = acceptedDomains.flatMap((domain) =>
          field === "purpose"
            ? [domain.purpose[locale]]
            : domain[field].map((entry) => entry[locale]),
        );
        expect(new Set(values.map(normalize)).size, `${field}/${locale}/cross-domain uniqueness`).toBe(values.length);
      }
    }
  });

  it("names real owned Module families in includes and real foreign owners in excludes", () => {
    for (const domain of product.planes.filter(({ status }) => status === "accepted")) {
      const expected = expectedClosureAnchors[domain.id as keyof typeof expectedClosureAnchors];
      expect(expected, domain.id).toBeDefined();
      const inclusionText = Object.fromEntries(
        locales.map((locale) => [locale, domain.includes.map((entry) => entry[locale]).join(" ")]),
      ) as Record<Locale, string>;
      const exclusionText = Object.fromEntries(
        locales.map((locale) => [locale, domain.excludes.map((entry) => entry[locale]).join(" ")]),
      ) as Record<Locale, string>;
      const exclusionOwners = domain.excludes.map((entry, index) => {
        const ownersByLocale = locales.map((locale) => [
          ...entry[locale].matchAll(/owner: ([a-z0-9-]+)/gu),
        ].map((match) => match[1]));
        for (const owners of ownersByLocale) {
          expect(owners, `${domain.id}/excludes/${index}/one-owner`).toHaveLength(1);
        }
        expect(new Set(ownersByLocale.flat()).size, `${domain.id}/excludes/${index}/same-owner`)
          .toBe(1);
        return ownersByLocale[0]?.[0];
      });
      expect(exclusionOwners.sort(), `${domain.id}/excludes/exact-foreign-owners`).toEqual(
        [...expected.excludes].sort(),
      );

      for (const moduleId of expected.includes) {
        const module = moduleById.get(moduleId);
        expect(module, `${domain.id}/owned/${moduleId}`).toBeDefined();
        expect(module?.status, `${domain.id}/owned/${moduleId}/status`).toBe("accepted");
        expect(module?.plane_id, `${domain.id}/owned/${moduleId}/plane`).toBe(domain.id);
        for (const locale of locales) {
          expect(inclusionText[locale], `${domain.id}/includes/${locale}/${moduleId}`).toContain(
            module?.labels[locale],
          );
          expect(inclusionText[locale], `${domain.id}/includes/${locale}/${moduleId}/owner`).toContain(
            `owner: ${moduleId}`,
          );
        }
      }

      for (const moduleId of expected.excludes) {
        const module = moduleById.get(moduleId);
        expect(module, `${domain.id}/foreign/${moduleId}`).toBeDefined();
        expect(module?.status, `${domain.id}/foreign/${moduleId}/status`).toBe("accepted");
        expect(module?.plane_id, `${domain.id}/foreign/${moduleId}/plane`).not.toBe(domain.id);
        for (const locale of locales) {
          expect(exclusionText[locale], `${domain.id}/excludes/${locale}/${moduleId}/label`).toContain(
            module?.labels[locale],
          );
          expect(exclusionText[locale], `${domain.id}/excludes/${locale}/${moduleId}/owner`).toContain(
            `owner: ${moduleId}`,
          );
        }
      }
    }
  });

  it("reapplies the reviewed closure contracts idempotently after a full migration", () => {
    const stalePlanes = product.planes.map((domain) => ({
      ...domain,
      includes: [{ zh: "旧模板", en: "Legacy template", ja: "旧テンプレート" }],
      excludes: [{ zh: "旧模板", en: "Legacy template", ja: "旧テンプレート" }],
    }));
    const repaired = buildReviewedDomainClosurePlanes(stalePlanes, modules);
    const repeated = buildReviewedDomainClosurePlanes(repaired, modules);

    expect(repaired).toEqual(product.planes);
    expect(repeated).toEqual(repaired);
    expect(stalePlanes.every(({ includes, excludes }) =>
      includes[0]?.en === "Legacy template" && excludes[0]?.en === "Legacy template"))
      .toBe(true);
  });

  it("wires the full migration to the reviewed contracts instead of legacy templates", () => {
    expect(persistenceSource).toContain("document.planes = buildReviewedDomainClosurePlanes(");
    expect(persistenceSource).not.toContain("A closed problem space formed by");
    expect(persistenceSource).not.toContain(
      "Identity semantics independently owned by other top-level domains",
    );
  });
});
