export interface SharedPrefixAuditInput {
  readonly concepts: readonly Readonly<Record<string, unknown>>[];
  readonly modules: readonly Readonly<Record<string, unknown>>[];
  readonly relations: readonly Readonly<Record<string, unknown>>[];
  readonly ledgerRows: readonly Readonly<Record<string, string>>[];
}

export interface OntologyParentIndexInput {
  readonly concepts: readonly Readonly<Record<string, unknown>>[];
  readonly relations: readonly Readonly<Record<string, unknown>>[];
}

export interface OntologyParentIndexes {
  readonly taxonomy_parent_by_concept_id: Readonly<Record<string, string | null>>;
  readonly logical_parent_by_concept_id: Readonly<Record<string, string | null>>;
}

export interface SharedPrefixAuditCandidate {
  readonly pair_id: string;
  readonly concept_ids: readonly [string, string];
  readonly module_ids: readonly string[];
  readonly scope: "same-module" | "adjacent-module";
  readonly peer_basis:
    | "directly-related"
    | "same-logical-parent"
    | "same-taxonomy-parent"
    | "same-taxonomy-and-logical-parent"
    | "terminal-ledger-decision";
  readonly shared_parent_basis: readonly Readonly<{
    readonly kind: "taxonomy" | "logical-backbone";
    readonly parent_id: string;
  }>[];
  readonly logical_depths: Readonly<Record<string, number>>;
  readonly discovery_basis: readonly Readonly<Record<string, string>>[];
  readonly decision_evidence: readonly Readonly<Record<string, unknown>>[];
  readonly decision_type: string;
  readonly decision_status: "decided" | "unresolved";
}

export interface SharedPrefixAudit {
  readonly discovery_contract: Readonly<Record<string, unknown>>;
  readonly candidate_count: number;
  readonly decision_counts: Readonly<Record<string, number>>;
  readonly unresolved_count: number;
  readonly candidates: readonly SharedPrefixAuditCandidate[];
  readonly lexical_families: readonly Readonly<Record<string, unknown>>[];
}

export function buildSharedPrefixAudit(input: SharedPrefixAuditInput): SharedPrefixAudit;
export function buildOntologyParentIndexes(
  input: OntologyParentIndexInput,
): OntologyParentIndexes;
export function assertSharedPrefixAuditResolved(audit: SharedPrefixAudit): SharedPrefixAudit;
