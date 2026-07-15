export interface LocalizedDomainClosureText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

export interface DomainClosurePlane {
  readonly id: string;
  readonly status: string;
  readonly includes: readonly LocalizedDomainClosureText[];
  readonly excludes: readonly LocalizedDomainClosureText[];
  readonly [key: string]: unknown;
}

export interface DomainClosureModule {
  readonly id: string;
  readonly plane_id: string;
  readonly status: string;
  readonly labels: LocalizedDomainClosureText;
}

export declare const buildReviewedDomainClosurePlanes: <T extends DomainClosurePlane>(
  planes: readonly T[],
  modules: readonly DomainClosureModule[],
) => T[];
