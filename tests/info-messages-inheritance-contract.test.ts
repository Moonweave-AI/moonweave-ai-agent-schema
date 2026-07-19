import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
  readonly allowed_values?: readonly unknown[];
  readonly definitions?: {
    readonly en?: unknown;
  };
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly relation_kind?: unknown;
    readonly target?: unknown;
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const elementRoot = join(
  resolve("ontology"),
  "info-plane",
  "info-messages-instructions",
  "Conversation",
  "ConversationElement",
);

const readNode = (relativePath: string): OntologyNode => parse(readFileSync(
  join(elementRoot, relativePath, "node.yaml"),
  "utf8",
)) as OntologyNode;

const strings = (values: readonly unknown[] | undefined): readonly string[] => (
  values?.flatMap((value) => typeof value === "string" && value.trim().length > 0 ? [value] : []) ?? []
);

const fieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    typeof field.id === "string" && field.id.trim().length > 0 ? [field.id] : []
  )) ?? []
);

const requiredFieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    field.required === true && typeof field.id === "string" && field.id.trim().length > 0
      ? [field.id]
      : []
  )) ?? []
);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const elementSubtypes = [
  { path: "ConversationTurn", expectedKind: "conversation-turn" },
  { path: "InstructionBlock", expectedKind: "instruction-block" },
  { path: "Message", expectedKind: "message" },
] as const;

const messageSubtypes = [
  { path: "Message/AssistantMessage", expectedFunction: "model-response" },
  { path: "Message/DeveloperMessage", expectedFunction: "instruction" },
  { path: "Message/SystemMessage", expectedFunction: "instruction" },
  { path: "Message/ToolObservationMessage", expectedFunction: "tool-observation" },
  { path: "Message/UserMessage", expectedFunction: "user-request" },
] as const;

describe("info-messages ConversationElement inheritance contract", () => {
  const parent = readNode(".");
  const inheritedRequired = requiredFieldIds(parent);

  it("keeps the audited first-level message and conversation specializations explicit", () => {
    expect(elementSubtypes.map(({ path }) => readNode(path).id)).toEqual([
      "ConversationTurn",
      "InstructionBlock",
      "Message",
    ]);
  });

  it("retains every ConversationElement identity and required field in each first-level specialization", () => {
    const violations = elementSubtypes.flatMap(({ path }) => {
      const child = readNode(path);
      const childFields = new Set(fieldIds(child));
      const childIdentity = new Set(strings(child.structure?.identity_keys));
      const missingFields = inheritedRequired.filter((id) => !childFields.has(id));
      const missingIdentity = strings(parent.structure?.identity_keys).filter((id) => !childIdentity.has(id));
      const invalidEdge = child.parent_relation?.predicate !== "is_a"
        || child.parent_relation?.relation_kind !== "hierarchy"
        || child.parent_relation?.target !== "concept:ConversationElement";

      return missingFields.length === 0 && missingIdentity.length === 0 && !invalidEdge
        ? []
        : [`${path}: ${[
          missingFields.length > 0 ? `fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `identity ${missingIdentity.join(", ")}` : null,
          invalidEdge ? "must remain an is_a hierarchy edge to ConversationElement" : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("uses a subtype-specific local element kind and shows inherited values in positive and instance examples", () => {
    const violations = elementSubtypes.flatMap(({ path, expectedKind }) => {
      const child = readNode(path);
      const fields = child.structure?.fields ?? [];
      const elementKind = fields.find((field) => field.id === "element_kind");
      const kindValues = strings(elementKind?.allowed_values);
      const required = new Set([...inheritedRequired, ...requiredFieldIds(child)]);
      const incompleteExamples = (child.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = [...required].filter((id) => !(id in values));
        const wrongKind = values.element_kind !== expectedKind;
        return missing.length === 0 && !wrongKind
          ? []
          : [`${path}/${String(example.id)}: ${[
            missing.length > 0 ? `missing ${missing.join(", ")}` : null,
            wrongKind ? `element_kind must be ${expectedKind}` : null,
          ].filter(Boolean).join("; ")}`];
      });

      return kindValues.length === 1 && kindValues[0] === expectedKind && incompleteExamples.length === 0
        ? []
        : [
          ...(kindValues.length === 1 && kindValues[0] === expectedKind
            ? []
            : [`${path}: element_kind must be constrained to ${expectedKind}`]),
          ...incompleteExamples,
        ];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps the five audited message-role specializations explicit", () => {
    expect(messageSubtypes.map(({ path }) => readNode(path).id)).toEqual([
      "AssistantMessage",
      "DeveloperMessage",
      "SystemMessage",
      "ToolObservationMessage",
      "UserMessage",
    ]);
  });

  it("retains complete Message and ConversationElement contracts in every message specialization", () => {
    const message = readNode("Message");
    const inheritedRequired = new Set([
      ...requiredFieldIds(parent),
      ...requiredFieldIds(message),
    ]);
    const inheritedIdentity = new Set([
      ...strings(parent.structure?.identity_keys),
      ...strings(message.structure?.identity_keys),
    ]);
    const violations = messageSubtypes.flatMap(({ path }) => {
      const child = readNode(path);
      const childFields = new Set(fieldIds(child));
      const childIdentity = new Set(strings(child.structure?.identity_keys));
      const missingFields = [...inheritedRequired].filter((id) => !childFields.has(id));
      const missingIdentity = [...inheritedIdentity].filter((id) => !childIdentity.has(id));
      const invalidEdge = child.parent_relation?.predicate !== "is_a"
        || child.parent_relation?.relation_kind !== "hierarchy"
        || child.parent_relation?.target !== "concept:Message";

      return missingFields.length === 0 && missingIdentity.length === 0 && !invalidEdge
        ? []
        : [`${path}: ${[
          missingFields.length > 0 ? `fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `identity ${missingIdentity.join(", ")}` : null,
          invalidEdge ? "must remain an is_a hierarchy edge to Message" : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("gives each message specialization a fixed local function and complete usable examples", () => {
    const message = readNode("Message");
    const inheritedRequired = new Set([
      ...requiredFieldIds(parent),
      ...requiredFieldIds(message),
    ]);
    const violations = messageSubtypes.flatMap(({ path, expectedFunction }) => {
      const child = readNode(path);
      const fields = child.structure?.fields ?? [];
      const messageFunction = fields.find((field) => field.id === "message_function");
      const functionValues = strings(messageFunction?.allowed_values);
      const required = new Set([...inheritedRequired, ...requiredFieldIds(child)]);
      const incompleteExamples = (child.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = [...required].filter((id) => !(id in values));
        const wrongElementKind = values.element_kind !== "message";
        const wrongFunction = values.message_function !== expectedFunction;
        return missing.length === 0 && !wrongElementKind && !wrongFunction
          ? []
          : [`${path}/${String(example.id)}: ${[
            missing.length > 0 ? `missing ${missing.join(", ")}` : null,
            wrongElementKind ? "element_kind must be message" : null,
            wrongFunction ? `message_function must be ${expectedFunction}` : null,
          ].filter(Boolean).join("; ")}`];
      });

      return functionValues.length === 1 && functionValues[0] === expectedFunction && incompleteExamples.length === 0
        ? []
        : [
          ...(functionValues.length === 1 && functionValues[0] === expectedFunction
            ? []
            : [`${path}: message_function must be constrained to ${expectedFunction}`]),
          ...incompleteExamples,
        ];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
