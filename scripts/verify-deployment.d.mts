export function verifyDeployment(options?: Readonly<{
  deploymentUrl?: string;
  expectedCommitSha?: string;
  fetchImplementation?: typeof fetch;
  delays?: readonly number[];
  attemptTimeoutMs?: number;
  wait?: (delay: number) => Promise<void>;
}>): Promise<Readonly<{
  manifest: Readonly<Record<string, unknown> & { commit_sha: string }>;
  manifestUrl: string;
}>>;
