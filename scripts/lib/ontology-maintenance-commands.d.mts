export const parseNoArguments: (
  arguments_: readonly string[],
  commandName: string,
) => Readonly<Record<string, never>>;
export const parseSourceLinkArguments: (
  arguments_: readonly string[],
) => Readonly<{
  referencedOnly: boolean;
  json: boolean;
  concurrency: number;
  timeoutMs: number;
  allowInconclusive: boolean;
}>;
export const loadProductSource: (repositoryRoot?: string) => any;
export const loadRegistryAndAllowlist: (repositoryRoot?: string) => any;
export const loadReferencedSourceIds: (repositoryRoot?: string) => ReadonlySet<string>;
export const loadDecisionInputs: (repositoryRoot?: string) => any;
export const loadSecurityInputs: (repositoryRoot?: string) => any;
export const classifySourceLinkFailures: (failures: readonly any[]) => any;
export const runBuildSourceIndexCommand: (options?: any) => any;
export const runGeneratedCheckCommand: (options?: any) => void;
export const runCleanWorktreeCommand: (options?: any) => void;
export const runSourceLinkCheckCommand: (options?: any) => Promise<any>;
export const runOntologyDecisionCommand: (options?: any) => any;
export const runLegacyMigrationAuditCommand: (options?: any) => any;
export const runOntologySecurityCommand: (options?: any) => void;
export const runCliAdapter: (options: any) => Promise<boolean>;
