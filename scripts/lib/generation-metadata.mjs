export const ONTOLOGY_GENERATOR_VERSION = "moonweave-ontology-builder/2.0.0";

export const deterministicGeneratedAt = (
  sourceDate,
  sourceDateEpoch = process.env.SOURCE_DATE_EPOCH,
) => {
  if (sourceDateEpoch !== undefined) {
    if (!/^-?\d+$/u.test(sourceDateEpoch)) {
      throw new Error("SOURCE_DATE_EPOCH must be an integer number of seconds");
    }
    const milliseconds = Number(sourceDateEpoch) * 1000;
    if (!Number.isSafeInteger(milliseconds)) {
      throw new Error("SOURCE_DATE_EPOCH is outside the supported date range");
    }
    const timestamp = new Date(milliseconds);
    if (Number.isNaN(timestamp.valueOf())) {
      throw new Error("SOURCE_DATE_EPOCH is outside the supported date range");
    }
    return timestamp.toISOString();
  }

  const timestamp = new Date(`${sourceDate}T00:00:00.000Z`);
  if (Number.isNaN(timestamp.valueOf())) {
    throw new Error(`Product release date is invalid: ${sourceDate}`);
  }
  return timestamp.toISOString();
};
