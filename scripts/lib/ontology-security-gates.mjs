const FORBIDDEN_REASONING_KEYS = new Set([
  "chain_of_thought",
  "chainofthought",
  "cot",
  "hidden_reasoning",
  "internal_monologue",
  "private_reasoning",
  "reasoning_trace",
  "scratchpad",
  "thinking_trace",
]);

const PRIVATE_TRANSCRIPT_PATTERNS = [
  /<\/?(?:thinking|private[_-]?reasoning|chain[_-]?of[_-]?thought)>/iu,
  /\bBEGIN[ _-]+(?:PRIVATE[ _-]+REASONING|CHAIN[ _-]+OF[ _-]+THOUGHT)\b/iu,
  /\b(?:private[ _-]+reasoning|chain[ _-]+of[ _-]+thought)[ _-]+transcript\s*:/iu,
];

const SENSITIVE_ABSOLUTE_PATH =
  /(?:\b[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/]|(?:^|\s)\/(?:Users|home|root)\/|\\\\[^\\\s]+\\(?:Users|home)\\)/u;

const FORBIDDEN_UI_KEY_PATTERN =
  /(?:["'`](?:chain[_-]?of[_-]?thought|cot|hidden[_-]?reasoning|internal[_-]?monologue|private[_-]?reasoning|reasoning[_-]?trace|scratchpad|thinking[_-]?trace)["'`]|\b(?:chain_of_thought|hidden_reasoning|internal_monologue|private_reasoning|reasoning_trace|scratchpad|thinking_trace)\b)\s*[:=,)]/iu;

const normalizeKey = (key) => key.toLowerCase().replaceAll(/[^a-z0-9]+/gu, "_").replaceAll(/^_|_$/gu, "");

const walkPublishedValue = (value, visitor, path = "$") => {
  visitor(value, path, null);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walkPublishedValue(child, visitor, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    visitor(child, childPath, key);
    if (Array.isArray(child)) {
      child.forEach((item, index) => walkPublishedValue(item, visitor, `${childPath}[${index}]`));
    } else if (child && typeof child === "object") {
      walkPublishedValue(child, visitor, childPath);
    }
  }
};

export const findPublishedContentSecurityViolations = ({ documents, uiFiles }) => {
  const violations = [];
  for (const document of documents) {
    walkPublishedValue(document.value, (value, path, key) => {
      if (key && FORBIDDEN_REASONING_KEYS.has(normalizeKey(key))) {
        violations.push({
          label: document.label,
          path,
          message: `private reasoning payload key ${key} is forbidden`,
        });
      }
      if (typeof value !== "string") return;
      const transcriptPattern = PRIVATE_TRANSCRIPT_PATTERNS.find((pattern) => pattern.test(value));
      if (transcriptPattern) {
        violations.push({
          label: document.label,
          path,
          message: `private reasoning transcript marker ${transcriptPattern.source} is forbidden`,
        });
      }
      if (key === "locator" && SENSITIVE_ABSOLUTE_PATH.test(value)) {
        violations.push({
          label: document.label,
          path,
          message: "source-claim locator contains a sensitive absolute path",
        });
      }
    });
  }

  for (const uiFile of uiFiles) {
    if (/\bdangerouslySetInnerHTML\b/u.test(uiFile.text)) {
      violations.push({
        label: uiFile.label,
        path: "$",
        message: "dangerouslySetInnerHTML is forbidden in ontology UI source",
      });
    }
    if (FORBIDDEN_UI_KEY_PATTERN.test(uiFile.text)) {
      violations.push({
        label: uiFile.label,
        path: "$",
        message: "private reasoning payload key is forbidden in ontology UI source",
      });
    }
    const transcriptPattern = PRIVATE_TRANSCRIPT_PATTERNS.find((pattern) =>
      pattern.test(uiFile.text),
    );
    if (transcriptPattern) {
      violations.push({
        label: uiFile.label,
        path: "$",
        message: `private reasoning transcript marker ${transcriptPattern.source} is forbidden in ontology UI source`,
      });
    }
  }
  return violations;
};

export const assertPublishedContentSecurity = (input) => {
  const violations = findPublishedContentSecurityViolations(input);
  if (violations.length === 0) return;
  throw new Error(
    `Published-content security gate failed:\n${violations
      .map(({ label, path, message }) => `- ${label} ${path}: ${message}`)
      .join("\n")}`,
  );
};

const ISO_CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/u;

const parseCalendarDate = (value) => {
  if (!ISO_CALENDAR_DATE.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
};

const todayUtc = (now) => {
  const value = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (!Number.isFinite(value.getTime())) throw new Error("Source URL policy now must be a valid date");
  return Date.parse(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`);
};

const validateAllowlistEntry = (entry, nowTimestamp) => {
  if (!entry || typeof entry !== "object") return "allowlist entry must be an object";
  const required = ["source_id", "url", "reason", "approved_by", "approved_on", "review_by"];
  const missing = required.filter((key) => typeof entry[key] !== "string" || !entry[key].trim());
  if (missing.length > 0) return `allowlist entry is missing ${missing.join(", ")}`;
  try {
    const parsed = new URL(entry.url);
    if (parsed.protocol !== "http:" || !parsed.hostname) {
      return "allowlist entries must identify an exact historical http: URL";
    }
  } catch {
    return "allowlist entry contains an invalid URL";
  }
  const approvedOn = parseCalendarDate(entry.approved_on);
  if (approvedOn === null) return "approved_on must be a valid YYYY-MM-DD calendar date";
  const reviewBy = parseCalendarDate(entry.review_by);
  if (reviewBy === null) return "review_by must be a valid YYYY-MM-DD calendar date";
  if (approvedOn > nowTimestamp) return "approved_on must not be in the future";
  if (reviewBy < approvedOn) return "review_by must be on or after approved_on";
  if (reviewBy < nowTimestamp) return "review_by approval window has expired";
  return null;
};

export const validateSourceUrlPolicy = (
  sources,
  httpAllowlist,
  { now = new Date() } = {},
) => {
  const violations = [];
  const allowlistById = new Map();
  const nowTimestamp = todayUtc(now);
  for (const entry of httpAllowlist) {
    const issue = validateAllowlistEntry(entry, nowTimestamp);
    if (issue) {
      violations.push({ sourceId: String(entry?.source_id ?? "<unknown>"), message: issue });
      continue;
    }
    if (allowlistById.has(entry.source_id)) {
      violations.push({
        sourceId: entry.source_id,
        message: "only one approved HTTP exception is allowed per source ID",
      });
      continue;
    }
    allowlistById.set(entry.source_id, entry);
  }

  const sourceIds = new Set(sources.map(({ id }) => id));
  for (const entry of allowlistById.values()) {
    if (!sourceIds.has(entry.source_id)) {
      violations.push({
        sourceId: entry.source_id,
        message: "approved HTTP exception does not resolve to a source-registry row",
      });
    }
  }

  for (const source of sources) {
    let parsed;
    try {
      parsed = new URL(source.url);
    } catch {
      violations.push({ sourceId: source.id, message: "source URL is not parseable" });
      continue;
    }
    if (!new Set(["https:", "http:"]).has(parsed.protocol)) {
      violations.push({
        sourceId: source.id,
        message: `source URL protocol ${parsed.protocol} is forbidden; use https: or an approved http: exception`,
      });
      continue;
    }
    if (!parsed.hostname || parsed.username || parsed.password) {
      violations.push({
        sourceId: source.id,
        message: "source URL must have a hostname and must not embed credentials",
      });
      continue;
    }
    if (parsed.protocol === "https:") continue;
    if (parsed.protocol === "http:") {
      const approved = allowlistById.get(source.id);
      if (approved?.url === source.url) continue;
      violations.push({
        sourceId: source.id,
        message: "source URL must use https: or match an exact approved historical http: exception",
      });
      continue;
    }
  }
  return violations;
};

export const assertSourceUrlPolicy = (sources, httpAllowlist, options) => {
  const violations = validateSourceUrlPolicy(sources, httpAllowlist, options);
  if (violations.length === 0) return;
  throw new Error(
    `Source URL policy failed:\n${violations
      .map(({ sourceId, message }) => `- ${sourceId}: ${message}`)
      .join("\n")}`,
  );
};
