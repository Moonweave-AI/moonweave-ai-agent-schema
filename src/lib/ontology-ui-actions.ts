import { uiText, type Language } from "../i18n/ui-text";

export const ontologyEntityKindText = (
  kind: "root" | "plane" | "module" | "concept",
  language: Language,
): string => {
  const text = uiText[language];
  if (kind === "root") return text.ontologyKind;
  if (kind === "plane") return text.planeKind;
  if (kind === "module") return text.moduleKind;
  return text.conceptKind;
};

export const downloadJsonArtifact = (value: unknown, fileName: string): void => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
};
