import path from "node:path";
import { fileURLToPath } from "node:url";

export const isMainModule = (moduleUrl, executablePath = process.argv[1]) =>
  typeof executablePath === "string" &&
  path.resolve(executablePath) === path.resolve(fileURLToPath(moduleUrl));
