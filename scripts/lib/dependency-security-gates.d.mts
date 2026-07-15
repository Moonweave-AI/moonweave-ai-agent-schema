export interface DependencyPolicyViolation {
  readonly packageName: string;
  readonly field: string;
  readonly message: string;
}

export function validateReviewedDependencyPolicy(input: Readonly<Record<string, unknown>>): readonly DependencyPolicyViolation[];
export function assertReviewedDependencyPolicy(input: Readonly<Record<string, unknown>>): void;
export function loadReviewedDependencyInputs(repositoryRoot?: string): Readonly<Record<string, unknown>>;
export function runZeroToleranceNpmAudit(options?: Readonly<Record<string, unknown>>): unknown;
