export interface JavaScriptSyntaxCheckResult {
  readonly checkedFileCount: number;
}

export interface JavaScriptSyntaxCheckOptions {
  readonly repositoryRoot?: string;
  readonly files?: readonly string[];
  readonly processObject?: Readonly<Pick<NodeJS.Process, "execPath">>;
  readonly spawn?: (...arguments_: readonly unknown[]) => any;
  readonly log?: (message: string) => void;
}

export function listProjectJavaScriptModules(repositoryRoot?: string): readonly string[];
export function checkJavaScriptSyntax(
  options?: JavaScriptSyntaxCheckOptions,
): Readonly<JavaScriptSyntaxCheckResult>;
export function main(options?: Readonly<Record<string, unknown>>): JavaScriptSyntaxCheckResult;
