export declare const DELEGATION_NODE_INFORMATION_CONCEPT_IDS: readonly string[];

export interface DelegationNodeInformationPhases {
  readonly applyDelegationNodeInformation: () => void;
}

export declare const createDelegationNodeInformationPhases: (
  context: Readonly<Record<string, any>>,
) => DelegationNodeInformationPhases;
