export interface SourceLink {
  readonly id: string;
  readonly url: string;
}

export interface SourceLinkResult extends SourceLink {
  readonly finalUrl: string | null;
  readonly ok: boolean;
  readonly method: "HEAD" | "GET";
  readonly status: number | null;
  readonly diagnostic: string;
}

export interface SourceLinkReport {
  readonly checked: number;
  readonly results: readonly SourceLinkResult[];
  readonly failures: readonly SourceLinkResult[];
}

export interface SourceDnsAnswer {
  readonly address: string;
  readonly family: number;
}

export function checkSourceLinks(
  sources: readonly SourceLink[],
  options?: {
    readonly concurrency?: number;
    readonly timeoutMs?: number;
    readonly maxRedirects?: number;
    readonly fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
    readonly dnsLookupImpl?: (
      hostname: string,
      options: { readonly all: true; readonly verbatim: true },
    ) => Promise<readonly SourceDnsAnswer[] | SourceDnsAnswer | string>;
  },
): Promise<SourceLinkReport>;
