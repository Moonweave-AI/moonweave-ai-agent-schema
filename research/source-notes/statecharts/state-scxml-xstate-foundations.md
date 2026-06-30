# state-scxml-xstate-foundations: Harel, SCXML, and XState Foundations

metadata:
  domain: statecharts
  source_type: source-family
  authority_level: mixed-primary-implementation
  temporal_class: foundational-plus-current
  published_or_updated: 1987 to 2026-06-26
  last_checked: 2026-06-30
  url: https://www.w3.org/TR/scxml/
  deep_read_priority: A

## Covered Sources

| source_id | title | url | authority | temporal_class |
|---|---|---|---|---|
| state-harel-1987 | Statecharts: A Visual Formalism for Complex Systems | https://www.zingstudio.io/static/statecharts.pdf | paper | foundational |
| state-scxml-2015 | SCXML: State Machine Notation for Control Abstraction | https://www.w3.org/TR/scxml/ | W3C Recommendation | foundational |
| cand-state-xstate-machines | XState state machines | https://stately.ai/docs/machines | official-doc | current-docs |
| cand-state-xstate-actors | XState actors | https://stately.ai/docs/actors | official-doc | current-docs |
| cand-state-xstate-graph | XState graph and paths | https://stately.ai/docs/graph | official-doc | current-docs |
| cand-state-xstate-repo | XState repository | https://github.com/statelyai/xstate | repo | current-docs |

## Why This Source Family Matters

Harel establishes statecharts as a compact formalism for reactive systems, extending ordinary state machines with hierarchy, concurrency, and communication. SCXML standardizes an executable state machine notation. XState provides a current implementation model with machines, actors, snapshots, graph traversal, and path generation.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Statechart | State machine extension for complex reactive behavior. | Harel presents statecharts as extending state diagrams for hierarchy, concurrency, and communication. | high | L7 |
| State | Behavioral mode or node in a machine. | XState machines define states in a states property; SCXML defines state elements. | high | L7 |
| Transition | Directed behavior change triggered by an event. | XState transitions respond to events and target states. | high | L7 |
| Event | Occurrence that may cause a transition. | XState and Harel use events as transition triggers. | high | L7 |
| Guard | Condition determining whether a transition should be taken. | XState machine implementations include guards. | high | L7 |
| Action | Fire-and-forget side effect/effect associated with machine behavior. | XState machine implementations include actions. | high | L7 |
| Hierarchical State | State containing child states. | Harel hierarchy; XState parent/child states. | high | L7 |
| Parallel Region | Orthogonal/concurrent state region. | Harel orthogonality; XState parallel states. | high | L7 |
| Final State | Completion state of a machine or compound state. | XState docs describe final states; SCXML includes final. | high | L7 |
| Actor | Running process that receives/sends events and emits snapshots. | XState actors are running instances of actor logic/state machines. | high | L5, L7 |
| Invoked Actor | Actor started/stopped by parent state entry/exit. | XState actors docs differentiate invoked actors. | high | L7 |
| Spawned Actor | Actor started dynamically and stopped by action or parent stop. | XState actors docs differentiate spawned actors. | high | L7 |
| Snapshot | Emitted/read representation of an actor's current state. | XState actors emit snapshots after state transitions. | high | L7, L8 |
| Path | Sequence of event-triggered steps through a graph. | XState graph docs define paths and steps. | high | L8 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| machine_has_state | Machine | State | XState machine config and SCXML state elements. | high | Core visual graph relation. |
| state_has_transition | State | Transition | XState events/transitions. | high | |
| transition_triggered_by_event | Transition | Event | XState and Harel event-triggered transitions. | high | |
| transition_guarded_by | Transition | Guard | XState guard implementations. | high | |
| transition_has_action | Transition | Action | XState action implementations. | medium | Some actions are entry/exit, not transition-only. |
| state_contains_state | State | State | Harel hierarchy/XState child states. | high | |
| parallel_state_has_region | Parallel State | Region | Harel orthogonality/XState parallel states. | high | |
| actor_instantiates_logic | Actor | ActorLogic/Machine | XState actor logic and createActor. | high | |
| actor_emits_snapshot | Actor | Snapshot | XState actors docs. | high | |
| path_contains_step | Path | Step | XState graph docs. | high | |
| step_applies_event | Step | Event | XState graph step structure. | high | |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| initial | Machine/State | machine start or parent state entry | no | XState initial state; SCXML initial states. | |
| active | State | transition enters state | no | Statechart semantics. | |
| final | State | terminal state reached | yes | XState final; SCXML final. | Terminal at its scope. |
| actor_started | Actor | createActor(...).start() or invocation/spawn | no | XState actor docs. | |
| actor_stopped | Actor | stop action, parent exit, or root stop | yes | XState actor lifecycle. | |
| snapshot_emitted | Actor | state transition/output change | no | XState actor subscriptions. | |
| path_generated | Machine | graph traversal request | yes | XState graph utilities. | Testing artifact state. |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| A machine must declare initial state when it has states requiring deterministic start. | Machine | XState/SCXML initial semantics. | structural | Some derived or partial diagrams may be intentionally incomplete. |
| Transition source and target should resolve to known state nodes. | Transition | Graph semantics. | structural | External targets/history pseudostates need special handling. |
| Guards and actions should be referenced by stable identifiers in serializable artifacts. | Transition, State | XState separates implementations from logic via referenced implementations. | structural | Overfits XState if made universal. |
| Actor lifecycle control must distinguish invoked from spawned. | ActorRef | XState docs. | semantic | Non-XState actor models may name this differently. |
| Path generation should record event sequence and final state. | Path | XState graph docs. | structural | Explosive path growth for large graphs. |

## Schema Implications

Facts only, no final schema decisions:

- Core statechart candidate entities include Machine, StateNode, Transition, Event, Guard, Action, ActorRef, Snapshot, Path, and Step.
- Visualization and execution should be separated: Harel/SCXML define behavioral semantics; XState adds implementation conveniences and current JS/TS ergonomics.
- Actor lifecycle and machine snapshot concepts are important for modern agent runtime visualization.
- Graph/path generation is evidence for a testing/verification artifact layer.

## Framework Or Standard Specificity

Core candidates:

- Machine, State, Transition, Event, Guard, Action, FinalState, ParallelRegion, Snapshot, Path.

Adapter-only or implementation-specific candidates:

- XState setup/provide helper names, `xstate/graph` import path, TypeScript-specific typing helpers, Stately Studio UI affordances.

## Contradictions And Open Questions

| issue | evidence | impact | owner | deadline |
|---|---|---|---|---|
| SCXML executable content and XState implementation fields do not map one-to-one. | SCXML standard; XState implementation separation. | Need adapter mapping, not single canonical execution syntax. | research/statecharts | Before Phase 0C |
| Statechart semantics versus visualization convenience can blur. | Harel formalism; XState/Stately visual tooling. | Canonical graph must avoid UI-only fields. | research/statecharts | Before Phase 0C |
| Path generation can be complete or shortest only. | XState graph docs distinguish simple and shortest paths. | Testing artifacts need coverage semantics. | research/statecharts | Before Phase 0C |

## Follow-Up Sources

- Full SCXML sections on data model, invoke, executable content, and event processor.
- UML state machine spec for terminology alignment.
- XState changelog/release notes for v5/v6 boundary.
- Sismic and SCION for cross-runtime sanity checks.
