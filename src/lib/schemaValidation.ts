import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020";
import ontologySchema from "../../schemas/agent-ontology.schema.json";

export function createOntologyAjv() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true
  });
  addFormats(ajv);
  return ajv;
}

export function validateOntologyDataset(data: unknown) {
  const ajv = createOntologyAjv();
  const validate = ajv.compile(ontologySchema);
  const valid = validate(data);

  return {
    valid,
    errors: validate.errors ?? []
  };
}
