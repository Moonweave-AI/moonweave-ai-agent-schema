import { ONTOLOGY_V3_DOMAIN_CLOSURE_CONTRACTS } from
  "../data/ontology-v3-domain-closure-contracts.mjs";

const LOCALES = Object.freeze(["zh", "en", "ja"]);
const LEGACY_TEMPLATE = /A closed problem space formed by|Identity semantics independently owned by other top-level domains/iu;

const cloneLocalized = (value) => Object.fromEntries(
  LOCALES.map((locale) => [locale, value[locale]]),
);

const validateEntry = ({ planeId, kind, entry, moduleById }) => {
  if (!Array.isArray(entry.owner_module_ids) || entry.owner_module_ids.length === 0) {
    throw new Error(`${planeId}/${kind} must name at least one owner Module`);
  }
  for (const moduleId of entry.owner_module_ids) {
    const module = moduleById.get(moduleId);
    if (!module || module.status !== "accepted") {
      throw new Error(`${planeId}/${kind} references missing or unaccepted Module ${moduleId}`);
    }
    const isOwned = module.plane_id === planeId;
    if ((kind === "includes") !== isOwned) {
      throw new Error(`${planeId}/${kind} references Module ${moduleId} in ${module.plane_id}`);
    }
    for (const locale of LOCALES) {
      const text = entry.text?.[locale];
      if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error(`${planeId}/${kind}/${moduleId} is missing ${locale} text`);
      }
      if (!text.includes(module.labels[locale])) {
        throw new Error(`${planeId}/${kind}/${moduleId}/${locale} must name ${module.labels[locale]}`);
      }
      if (!text.includes(`owner: ${moduleId}`)) {
        throw new Error(`${planeId}/${kind}/${moduleId}/${locale} must name owner: ${moduleId}`);
      }
      if (LEGACY_TEMPLATE.test(text)) {
        throw new Error(`${planeId}/${kind}/${moduleId}/${locale} retains a legacy template`);
      }
    }
  }
};

export const buildReviewedDomainClosurePlanes = (planes, modules) => {
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  if (moduleById.size !== modules.length) {
    throw new Error("Domain closure input contains duplicate Module ids");
  }
  const acceptedPlaneIds = planes
    .filter(({ status }) => status === "accepted")
    .map(({ id }) => id)
    .sort();
  const contractPlaneIds = Object.keys(ONTOLOGY_V3_DOMAIN_CLOSURE_CONTRACTS).sort();
  if (
    acceptedPlaneIds.length !== contractPlaneIds.length ||
    acceptedPlaneIds.some((planeId, index) => planeId !== contractPlaneIds[index])
  ) {
    throw new Error(
      `Domain closure contracts do not match accepted Domains: ` +
      `${acceptedPlaneIds.join(",")} != ${contractPlaneIds.join(",")}`,
    );
  }

  return planes.map((plane) => {
    if (plane.status !== "accepted") return { ...plane };
    const contract = ONTOLOGY_V3_DOMAIN_CLOSURE_CONTRACTS[plane.id];
    if (contract.includes.length !== 2 || contract.excludes.length !== 2) {
      throw new Error(`${plane.id} must define exactly two includes and two excludes`);
    }
    for (const entry of contract.includes) {
      validateEntry({ planeId: plane.id, kind: "includes", entry, moduleById });
    }
    for (const entry of contract.excludes) {
      validateEntry({ planeId: plane.id, kind: "excludes", entry, moduleById });
    }
    return {
      ...plane,
      includes: contract.includes.map(({ text }) => cloneLocalized(text)),
      excludes: contract.excludes.map(({ text }) => cloneLocalized(text)),
    };
  });
};
