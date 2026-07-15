import { deprecationLineageText, uiText, type Language } from "../i18n/ui-text";
import {
  ontologyEntityLabel,
  ontologyEntityRef,
  type CanonicalConcept,
  type OntologyEntityRef,
  type OntologyIndex,
} from "../lib/ontology-index";

export const OntologyDeprecationLineageFact = ({
  index,
  predecessors,
  language,
  onNavigate,
}: {
  readonly index: OntologyIndex;
  readonly predecessors: readonly CanonicalConcept[];
  readonly language: Language;
  readonly onNavigate: (ref: OntologyEntityRef) => void;
}) => (
  <div>
    <dt>{deprecationLineageText[language]}</dt>
    <dd>{predecessors.length > 0
      ? predecessors.map((predecessor, position) => {
          const ref = ontologyEntityRef("concept", predecessor.id);
          const entity = index.entitiesByRef.get(ref);
          return (
            <span key={predecessor.id}>
              {position > 0 ? ", " : null}
              <button type="button" className="table-link" onClick={() => onNavigate(ref)}>
                {entity ? ontologyEntityLabel(entity, language) : predecessor.id}
              </button>{" "}<code>{predecessor.id}</code>
            </span>
          );
        })
      : uiText[language].notApplicable}</dd>
  </div>
);
