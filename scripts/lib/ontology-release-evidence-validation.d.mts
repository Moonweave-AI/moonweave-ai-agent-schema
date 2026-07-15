import type { FrozenV2SemanticBaseline } from "./ontology-v2-semantic-baseline.mjs";
import type {
  ObjectEvidenceConcept,
  ObjectEvidenceFallbackMetrics,
  ObjectEvidenceRelation,
} from "./ontology-v3-object-evidence.mjs";

export const ontologyReleaseEvidencePaths: readonly string[];

export function expectedConceptLedgerRelationChanges(input: Readonly<{
  conceptId: string;
  decision: string;
  replacementConceptIds: readonly string[];
}>): string;

export interface OntologyReleaseEvidenceEntry {
  readonly path?: string;
  readonly relativePath: string;
  readonly bytes?: Buffer;
}

export interface OntologyReleaseEvidence {
  readonly entries: readonly OntologyReleaseEvidenceEntry[];
  readonly rowsByPath: ReadonlyMap<string, readonly Readonly<Record<string, string>>[]>;
}

export function loadReleaseEvidence(input: Readonly<{
  repositoryRoot: string;
  required?: boolean;
}>): OntologyReleaseEvidence;

export function validateConceptLedgerMirrorsSources(input: Readonly<{
  rows: readonly Readonly<Record<string, string>>[];
  modules: readonly Readonly<Record<string, unknown> & {
    id: string;
    plane_id: string;
  }>[];
  classes: readonly Readonly<Record<string, unknown> & {
    id: string;
    module_id: string;
    status: string;
  }>[];
  relations: readonly Readonly<Record<string, unknown> & {
    id: string;
    status: string;
    source_id: string;
    target_id: string;
  }>[];
  baseline?: FrozenV2SemanticBaseline;
}>): void;

export function validateReleaseEvidenceMirrorsSources(
  input: Readonly<Record<string, unknown>>,
): void;

export function validateReleaseObjectEvidence(input: Readonly<{
  canonical: Readonly<{
    classes: readonly ObjectEvidenceConcept[];
    relations: readonly ObjectEvidenceRelation[];
  }>;
  releaseEvidence: OntologyReleaseEvidence;
}>): ObjectEvidenceFallbackMetrics | null;
