import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import v8Runtime from "@vitest/coverage-v8";
import { V8CoverageProvider } from "@vitest/coverage-v8/dist/provider.js";

import {
  selectIncludedProcessCoverage,
  subprocessCoverageDirectoryEnvironmentVariable,
} from "./lib/subprocess-v8-coverage.mjs";

class SubprocessAwareV8CoverageProvider extends V8CoverageProvider {
  initialize(context) {
    this.previousSubprocessCoverageDirectory =
      process.env[subprocessCoverageDirectoryEnvironmentVariable];
    super.initialize(context);
  }

  async clean(clean = true) {
    await super.clean(clean);
    this.subprocessCoverageDirectory = resolve(
      this.coverageFilesDirectory,
      "subprocess-v8",
    );
    await fs.mkdir(this.subprocessCoverageDirectory, { recursive: true });
    process.env[subprocessCoverageDirectoryEnvironmentVariable] =
      this.subprocessCoverageDirectory;
  }

  async generateCoverage(context) {
    const coverageMap = await super.generateCoverage(context);
    const filenames = await fs
      .readdir(this.subprocessCoverageDirectory ?? "", { withFileTypes: true })
      .then((entries) =>
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map((entry) => resolve(this.subprocessCoverageDirectory, entry.name))
          .sort(),
      )
      .catch((error) => {
        if (error?.code === "ENOENT") return [];
        throw error;
      });

    for (const filename of filenames) {
      const rawCoverage = JSON.parse(await fs.readFile(filename, "utf8"));
      const selectedCoverage = selectIncludedProcessCoverage(
        rawCoverage,
        (filePath) => this.isIncluded(filePath),
      );
      for (const scriptCoverage of selectedCoverage.result) {
        const source = await fs.readFile(fileURLToPath(scriptCoverage.url), "utf8");
        coverageMap.merge(
          await this.remapCoverage(
            scriptCoverage.url,
            scriptCoverage.startOffset ?? 0,
            { code: source },
            scriptCoverage.functions,
          ),
        );
      }
    }

    return coverageMap;
  }

  async reportCoverage(coverageMap, context) {
    try {
      await super.reportCoverage(coverageMap, context);
    } finally {
      if (this.previousSubprocessCoverageDirectory === undefined) {
        delete process.env[subprocessCoverageDirectoryEnvironmentVariable];
      } else {
        process.env[subprocessCoverageDirectoryEnvironmentVariable] =
          this.previousSubprocessCoverageDirectory;
      }
      if (this.subprocessCoverageDirectory) {
        await fs.rm(this.subprocessCoverageDirectory, {
          recursive: true,
          force: true,
        });
      }
    }
  }
}

export default {
  ...v8Runtime,
  getProvider: () => new SubprocessAwareV8CoverageProvider(),
};
