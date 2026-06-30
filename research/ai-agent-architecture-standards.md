# AI Agent Architecture Standards and Frameworks
## Deep Research Report for Multi-Agent Ontology Design

**Date:** 2026-06-30  
**Purpose:** Inform the design of a comprehensive ontology for multi-agent systems

---

## 1. Formal Agent Standards

### 1.1 FIPA (Foundation for Intelligent Physical Agents)

FIPA is the IEEE-standardized body that defined the canonical specifications for agent interoperability. Its standards remain the most rigorous formal foundation for agent communication and management.

#### 1.1.1 FIPA-ACL (Agent Communication Language) Message Structure

The FIPA ACL message is a structured envelope for inter-agent communication. Each message contains a set of parameters organized into four categories:

| Parameter | Category | Description |
|-----------|----------|-------------|
| `performative` | **Communicative Act** (mandatory) | Type of speech act (e.g., `inform`, `request`, `query-if`, `propose`, `cfp`) |
| `sender` | Participant | Agent identifier of the message originator |
| `receiver` | Participant | Agent identifier(s) of intended recipient(s) |
| `reply-to` | Participant | Agent to receive subsequent replies (overrides sender) |
| `content` | Content | The semantic payload of the message |
| `language` | Description of Content | Formal language of the content expression (e.g., SL, KIF, SPARQL) |
| `encoding` | Description of Content | Encoding scheme for the content |
| `ontology` | Description of Content | Ontology(s) used to interpret symbols in the content |
| `protocol` | Control of Conversation | Interaction protocol governing this exchange |
| `conversation-id` | Control of Conversation | Unique identifier for the conversation thread |
| `reply-with` | Control of Conversation | Expression the sender expects in `in-reply-to` of the response |
| `in-reply-to` | Control of Conversation | References the `reply-with` of the message being replied to |
| `reply-by` | Control of Conversation | Deadline for the reply |

**Key design principle:** Only the `performative` is strictly mandatory. However, practical implementations almost always include `sender`, `receiver`, and `content`.

FIPA defines **22 communicative acts** (performatives), including:
- `inform`, `request`, `agree`, `refuse`, `not-understood`
- `query-if`, `query-ref`, `cfp` (call for proposal), `propose`
- `accept-proposal`, `reject-proposal`, `cancel`, `subscribe`

**Ontology Relevance:** The separation of `language`, `ontology`, and `content` is a powerful pattern — it decouples the message structure from the domain semantics, enabling agents with different internal representations to communicate via shared ontologies.

> **Source:** FIPA ACL Message Structure Specification (SC00061G), http://www.fipa.org/specs/fipa00061/  
> **Source:** SmythOS FIPA-ACL Introduction, https://smythos.com/developers/agent-development/fipa-agent-communication-language/

---

#### 1.1.2 FIPA Interaction Protocols

FIPA defines 11 named interaction protocols, each specifying a pattern of message exchanges between agents:

| # | Protocol | Spec ID | Purpose |
|---|----------|---------|---------|
| 1 | **Request** | SC00026H | One agent requests another to perform an action |
| 2 | **Query** | SC00027H | Request information via `query-if` or `query-ref` |
| 3 | **Request-When** | SC00028H | Conditional request — execute when a condition holds |
| 4 | **Contract Net** | SC00029H | Manager broadcasts CFP, receives proposals, selects contractor |
| 5 | **Iterated Contract Net** | SC00030H | Iterative refinement of CFP until satisfactory contract |
| 6 | **English Auction** | SC00031 | Ascending-price auction protocol |
| 7 | **Dutch Auction** | SC00032 | Descending-price auction protocol |
| 8 | **Brokering** | SC00033 | Intermediary agent finds suitable service providers |
| 9 | **Recruiting** | SC00034 | Agent recruits others to perform a task |
| 10 | **Subscribe** | SC00035 | Agent subscribes to notifications from another |
| 11 | **Propose** | SC00036 | Agent proposes an action to another |

**Contract Net Protocol (CNP) Detail:**
1. **Manager** issues a `cfp` (call for proposals) specifying the task and constraints
2. **Contractors** respond with `propose` (bid) or `refuse`
3. **Manager** evaluates proposals against optimization criteria (price, time, etc.)
4. **Manager** sends `accept-proposal` to winner(s), `reject-proposal` to others
5. **Selected contractor** performs task and sends `inform` (result) or `failure`

**Ontology Relevance:** These protocols define reusable coordination patterns that should be first-class entities in an ontology — each with defined roles, message sequences, and state transitions.

> **Source:** FIPA Interaction Protocol Library (TypeScript implementation), https://github.com/amlhubs/fipa-ip  
> **Source:** FIPA-JADE tutorial, https://www.emse.fr/~boissier/enseignement/maop14/courses/readings/FIPA-JADE.pdf

---

#### 1.1.3 FIPA Agent Management Specification

The FIPA Agent Management spec defines the reference architecture for an **Agent Platform (AP)**:

**Mandatory Platform Components:**

| Component | Role | Service Type |
|-----------|------|-------------|
| **AMS** (Agent Management System) | Supervisory control; manages agent lifecycle (create, delete, suspend, resume, migrate); provides **white pages** directory (name → address mapping) | Lifecycle + Directory |
| **DF** (Directory Facilitator) | **Yellow pages** service; agents register/discover services by capability | Service Discovery |
| **ACC** (Agent Communication Channel) | Message transport between agents (intra- and inter-platform) | Transport |

**Agent Lifecycle States (FIPA):**

```
Initiated → Active → {Waiting, Suspended, Transit} → Active → ... → Terminated
```

| State | Description |
|-------|-------------|
| `Initiated` | Agent created but not yet registered with AMS |
| `Active` | Agent registered and operational |
| `Waiting` | Agent blocked, awaiting an event |
| `Suspended` | Agent halted; can be resumed |
| `Transit` | Agent migrating between platforms |
| `Terminated` | Agent destroyed |

**Agent Identifier (AID):**
- `name`: Globally unique agent name
- `addresses`: Set of transport addresses
- `resolvers`: Set of name resolution services

**Ontology Relevance:** The AMS/DF/ACC triad maps directly to ontology concepts: identity management, service discovery, and communication infrastructure. The lifecycle states provide a formal state machine for agent existence.

> **Source:** FIPA Agent Management Specification (SC00023K)  
> **Source:** JADE FIPA-compliant Agent Framework, https://jmvidal.cse.sc.edu/library/jade.pdf

---

#### 1.1.4 FIPA Ontology Service

FIPA's approach to ontologies is embedded in its ACL via the `ontology` parameter, which names the shared vocabulary used to interpret message content. The FIPA Ontology Service specification defines:

- **Ontology registration** — agents register ontologies with a dedicated Ontology Agent
- **Ontology lookup** — agents query for ontologies by name or capability
- **Ontology translation** — mediation between agents using different ontologies

The `fipa-agent-management` ontology is itself a standardized ontology defining concepts like `agent-identifier`, `agent-description`, `service-description`, `search-constraints`, and `platform-description`.

---

### 1.2 BDI (Belief-Desire-Intention) Architecture

The BDI architecture is the most influential cognitive agent model, originating from Bratman's philosophical theory of practical reasoning.

#### 1.2.1 Core Concepts

| Concept | Formal Definition | Implementation |
|---------|------------------|----------------|
| **Beliefs** | Agent's informational state about the world (may be incomplete, incorrect) | Knowledge base / fact store; updated via perception and communication |
| **Desires** | Motivational state — states of affairs the agent would like to achieve | Goal set; may be mutually inconsistent |
| **Intentions** | Deliberative state — desires the agent has committed to pursue | Selected goals with associated plans; drive behavior |
| **Plans** | Recipes for action — sequences of steps to achieve intentions | Plan library: `triggering_event : context <- body` |
| **Events** | Changes in beliefs or goals that trigger plan selection | Internal (goal adoption) or external (perception) |

**BDI Reasoning Cycle:**
1. **Perceive** the environment → update beliefs
2. **Generate events** from belief changes and new goals
3. **Select event** to handle (event selection function)
4. **Find applicable plans** — plans whose trigger matches the event and whose context is satisfied by current beliefs
5. **Select plan** (option selection function)
6. **Push selected plan** onto an intention stack
7. **Select intention** to execute (intention selection function)
8. **Execute** next step of the selected intention

**Commitment Strategies (Rao & Georgeff):**
- **Blind commitment** (fanatical): Maintain intention until believed achieved
- **Single-minded commitment**: Maintain intention until believed achieved OR believed impossible
- **Open-minded commitment**: Maintain intention as long as the motivating desire persists

#### 1.2.2 AgentSpeak Language

AgentSpeak(L), created by Anand Rao (1996), is a logic-based programming language for BDI agents:

**Syntax:**
```
// Beliefs
location(robot, room1).
battery(high).

// Plan: triggering_event : context <- body
+!clean(Room) : location(robot, Room) & battery(high)
    <- vacuum(Room); !report(done).

+!clean(Room) : not location(robot, Room)
    <- !goto(Room); !clean(Room).
```

**Language constructs:**
- **Beliefs**: Predicate-logic atoms (`location(robot, room1)`)
- **Achievement goals**: `!goal` — create a new goal to achieve
- **Test goals**: `?goal` — query the belief base
- **Plan structure**: `triggering_event : context <- body`
  - Triggering events: `+belief` (belief addition), `-belief` (belief deletion), `+!goal` (goal adoption), `-!goal` (goal dropping)
  - Context: Logical conjunction over beliefs
  - Body: Sequence of actions, goals, and belief operations

#### 1.2.3 Jason Interpreter

Jason is the reference implementation of AgentSpeak, developed by Bordini and Hübner:

- **Implements** the structural operational semantics of AgentSpeak
- **Extensions** beyond base AgentSpeak:
  - Strong negation (open-world assumption support)
  - Speech-act based inter-agent communication
  - Internal actions (Java-implemented primitives)
  - Customizable selection functions: `selectMessage()`, `selectEvent()`, `selectOption()`, `selectIntention()`
  - Customizable belief revision (`brf()`) and social acceptance (`socAcc()`)
  - Annotations on beliefs, plans, and goals
  - Plan failure handling

**Ontology Relevance:** The BDI model provides a rich vocabulary for agent mental states that should be captured in any agent ontology: beliefs, desires/goals, intentions, plans, events, and the reasoning cycle that connects them.

> **Source:** Rao, A.S. "AgentSpeak(L): BDI agents speak out in a logical computable language" (MAAMAW 1996)  
> **Source:** Jason platform, https://jason-lang.github.io/  
> **Source:** Bordini & Moreira, "On the Formal Semantics of Speech-Act Based Communication in an Agent-Oriented Programming Language" (JAIR)

---

### 1.3 KQML (Knowledge Query and Manipulation Language)

KQML is the predecessor to FIPA-ACL, developed under the DARPA Knowledge Sharing Effort (early 1990s).

**Three-Layer Architecture:**

| Layer | Purpose | Content |
|-------|---------|---------|
| **Content** | The actual information/knowledge payload | Domain-specific, any representation language |
| **Message** | The speech act and its arguments | Performative + keyword/value pairs |
| **Communication** | Transport-level parameters | Sender, receiver, routing info |

**Message Format:**
```lisp
(ask-one
  :sender    agent-A
  :receiver  agent-B
  :content   (price IBM ?x)
  :language  KIF
  :ontology  NYSE-ticks
  :reply-with q1)
```

**Key Performatives:**
- `ask-one`, `ask-all` — Query for one or all matching answers
- `tell` — Assert a fact
- `subscribe` — Request notification of changes
- `register`, `unregister` — Service directory operations
- `forward`, `broadcast` — Message routing
- `achieve` — Request goal achievement

**Communication Facilitators:**
KQML introduced the concept of specialized intermediary agents that coordinate interactions — a precursor to FIPA's DF and modern service mesh patterns.

**Status:** KQML is superseded by FIPA-ACL, but its layered architecture and facilitator concepts remain influential.

> **Source:** Finin et al., "KQML as an agent communication language" (CIKM 1994), https://dl.acm.org/doi/10.1145/191246.191322  
> **Source:** DARPA KQML Specification, https://research.cs.umbc.edu/kqml/kqmlspec/spec.html

---

## 2. Modern Multi-Agent Frameworks

### 2.1 AutoGen (Microsoft) → Microsoft Agent Framework

**Status:** AutoGen is now in maintenance mode (2026). Microsoft Agent Framework (MAF) 1.0 GA is the production successor, merging AutoGen + Semantic Kernel.

#### AutoGen (Historical) Core Abstractions

| Abstraction | Description |
|-------------|-------------|
| `ConversableAgent` | Base agent class with LLM and/or code execution capabilities |
| `AssistantAgent` | LLM-powered agent for conversation and task completion |
| `UserProxyAgent` | Human-in-the-loop proxy; can execute code |
| `GroupChat` | Multi-agent conversation container |
| `GroupChatManager` | Orchestrator for group conversations |

**Communication Pattern:** Event-driven conversation loops. Agents exchange messages in a shared thread; `initiate_chat()` starts a conversation that continues until termination conditions are met.

**State Management:** Implicit — conversation history serves as state. No built-in checkpointing.

#### Microsoft Agent Framework (MAF) 1.0 Core Abstractions

| Abstraction | Description |
|-------------|-------------|
| `Agent` / `IAIAgent` | Individual LLM-powered agent with instructions, tools, and model reference |
| `Tool` / `AIFunction` | Type-safe function callable by agents (replaces SK plugins) |
| `Workflow` | Graph-based execution engine connecting agents and functions |
| `AgentNode` | Agent as a node in a workflow graph |
| `Edge` | Typed connection between nodes carrying state |
| `GraphState` | Explicit, typed state object flowing through workflow edges |
| `Checkpointer` | Persistence mechanism for long-running workflow state |
| `Session` | State management across multi-turn interactions |
| `Middleware` | Interceptors for agent actions (logging, validation, etc.) |

**Orchestration Patterns:**
- **Sequential Pipeline**: Agent A → Agent B → Agent C
- **Concurrent Fan-out**: Multiple agents work in parallel, results merged
- **Group Chat** (Selector): Agents discuss until convergence (from AutoGen)
- **Handoff**: Agent transfers control to specialist
- **MagenticOne**: Complex task decomposition pattern

**State Management:** Explicit, typed `GraphState` with schema validation. Supports checkpointing via CosmosDB or PostgreSQL for pause/resume of long-running workflows.

**Communication:** Graph-based state propagation along typed edges. Human-in-the-loop via request/response patterns that pause workflow execution.

**Interoperability:** MCP (Model Context Protocol) for tool discovery; A2A (Agent-to-Agent) protocol for cross-runtime agent communication.

> **Source:** Microsoft Agent Framework 1.0 GA, https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/  
> **Source:** MAF Overview, https://learn.microsoft.com/en-us/agent-framework/overview/

---

### 2.2 CrewAI

CrewAI is an open-source Python framework emphasizing role-based agent collaboration with two primary architectural layers: **Crews** (autonomous collaboration) and **Flows** (production orchestration).

#### Core Abstractions

| Abstraction | Description | Key Properties |
|-------------|-------------|----------------|
| `Agent` | Autonomous unit with a role and goal | `role`, `goal`, `backstory`, `tools`, `llm`, `memory`, `allow_delegation`, `function_calling_llm` |
| `Task` | Specific piece of work assigned to an agent | `description`, `expected_output`, `agent`, `tools`, `context` (list of prerequisite tasks) |
| `Crew` | Team of agents working on tasks | `agents`, `tasks`, `process` (sequential/hierarchical), `memory`, `manager_llm` |
| `Flow` | Event-driven workflow wrapping Crews | `@start`, `@listen` decorators, Pydantic state models, `@persist` for durability |
| `Memory` | Unified memory system with hierarchical scopes | Short-term, long-term, entity-based; LLM-driven extraction and recall |
| `Tool` | Capability an agent can use | Function with description, input schema |

**Process Types:**
- **Sequential**: Tasks executed linearly, output of one feeds the next
- **Hierarchical**: Manager agent coordinates delegation and validates outcomes

**Memory Architecture:**
- Hierarchical scope tree (filesystem-like: `/`, `/project/alpha`, `/agent/researcher`)
- LLM-driven analysis on save (infers scope, categories, importance)
- Composite scoring on recall (semantic similarity + recency + importance)
- `MemoryScope` restricts agent access to subtree branches

**Communication:** Agents communicate through task outputs and shared memory. Delegation is controlled via `allow_delegation` flag.

**State Management:** Flows use Pydantic models for typed state. `@persist` decorator enables resume-on-failure.

> **Source:** CrewAI docs, https://docs.crewai.com/en/introduction  
> **Source:** CrewAI GitHub, https://github.com/crewAIInc/crewAI/

---

### 2.3 LangGraph (LangChain)

LangGraph is a low-level orchestration framework for building stateful, long-running agent workflows using directed graphs.

#### Core Abstractions

| Abstraction | Description |
|-------------|-------------|
| `StateGraph` | Directed graph definition with nodes and edges |
| `State` (TypedDict) | Shared data structure flowing through all nodes |
| `Node` | Processing step (Python function or agent) — receives state, returns updates |
| `Edge` | Connection between nodes (unconditional) |
| `Conditional Edge` | Branching based on state values (routing function) |
| `Checkpointer` | Short-term, thread-scoped persistence (conversation continuity, fault tolerance) |
| `Store` | Long-term, cross-thread persistence (user preferences, shared knowledge) |
| `START` / `END` | Special sentinel nodes |

**Minimal Graph Definition:**
```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class AgentState(TypedDict):
    messages: list
    current_step: str

def plan_node(state: AgentState) -> dict:
    return {"current_step": "planning", ...}

def execute_node(state: AgentState) -> dict:
    return {"current_step": "executing", ...}

builder = StateGraph(AgentState)
builder.add_node("plan", plan_node)
builder.add_node("execute", execute_node)
builder.add_edge(START, "plan")
builder.add_conditional_edges("plan", route_function, {...})
builder.add_edge("execute", END)
graph = builder.compile(checkpointer=MemorySaver())
```

**State Management:**
- **Checkpointers**: Persist thread state as snapshots (short-term). Enable time-travel, human-in-the-loop, and fault recovery.
- **Stores**: Persist application data across threads (long-term). Key-value storage for user preferences, facts, shared knowledge.
- **Reducers**: Define how state updates are merged (e.g., append messages vs. replace).

**Communication:** State propagation through graph edges. No direct inter-agent messaging — all communication happens via shared state. Conditional edges enable dynamic routing.

**Key Differentiator:** Cyclic graphs — nodes can be revisited, enabling plan-execute-reflect loops that are central to agent behavior.

> **Source:** LangGraph GitHub, https://github.com/langchain-ai/langgraph  
> **Source:** LangGraph Overview, https://docs.langchain.com/oss/python/langgraph/overview

---

### 2.4 Semantic Kernel → Microsoft Agent Framework

**Status:** Semantic Kernel is now in maintenance mode. Its capabilities have been merged into the Microsoft Agent Framework (MAF).

#### Semantic Kernel (Historical) Core Abstractions

| Abstraction | MAF Equivalent | Description |
|-------------|----------------|-------------|
| `Kernel` | `Agent` (no central kernel needed) | Central orchestrator managing plugins, memory, and LLM |
| `Plugin` | Tool collections via `AIFunction` | Collection of related functions exposed to the LLM |
| `KernelFunction` | `AIFunction.Create()` | Individual callable function with schema |
| `Planner` (Handlebars, Stepwise) | Native function calling + Workflows | Automatic plan generation from available functions |
| `Connector` | Service Connectors | Integration with external services (Azure, OpenAI, etc.) |
| `Memory` | Session + Context Providers | Semantic memory with embeddings |
| `AgentGroupChat` | Workflow orchestration | Multi-agent conversation |

**Migration Path:** `[KernelFunction]` methods → `AIFunction.Create()` lambdas or `[AIFunction]` attributes. Plugins become tool collections passed directly to agents.

> **Source:** SK → MAF Migration Guide, https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-semantic-kernel/

---

### 2.5 Swarm (OpenAI) → OpenAI Agents SDK

**Status:** Swarm was an experimental/educational framework (Oct 2024). Replaced by the OpenAI Agents SDK (March 2025).

#### Core Abstractions

| Abstraction | Description |
|-------------|-------------|
| `Agent` | LLM with `instructions` (system prompt), `tools` (callable functions), and `handoffs` (agents to delegate to) |
| `Handoff` | Transfer of conversation control to another agent — the receiving agent takes over the full conversation history |
| `Guardrail` | Input/output validation callbacks |
| `Runner` | Async execution loop managing turns, tool calls, and handoffs |
| `Session` | State persistence across turns |

**Handoff vs. Agent-as-Tool:**

| Pattern | Ownership | Use When |
|---------|-----------|----------|
| **Handoff** | Specialist takes over the conversation | Different instructions, tools, or policy needed |
| **Agent-as-Tool** | Manager retains control, calls specialist | Bounded task (summarization, classification) |

**Design Principle:** "Start with one agent. Add specialists only when they materially improve capability isolation, policy isolation, prompt clarity, or trace legibility."

**Communication:** Conversation history passes through handoffs. No explicit state objects — context flows via message history.

> **Source:** OpenAI Swarm, https://github.com/openai/swarm  
> **Source:** OpenAI Agents SDK, https://openai.github.io/openai-agents-python/  
> **Source:** Agent Orchestration Guide, https://developers.openai.com/api/docs/guides/agents/orchestration

---

### 2.6 DSPy (Stanford NLP / Databricks)

DSPy (Declarative Self-improving Python) takes a fundamentally different approach: it treats LLM calls as parameterized, optimizable modules rather than prompt-engineered black boxes.

#### Core Abstractions

| Abstraction | Description |
|-------------|-------------|
| `Signature` | Typed input/output specification for a task (replaces prompt templates) |
| `Module` | Parameterized LM invocation strategy (`Predict`, `ChainOfThought`, `ReAct`) |
| `Optimizer` | Compiler that tunes prompts/demonstrations against a metric |
| `Metric` | Scoring function evaluating program quality |
| `Tool` | Plain Python function passed to `ReAct` module |
| `Example` | Typed data point for training/optimization |

**Signature Definition:**
```python
class Triage(dspy.Signature):
    """Classify the support ticket and route to the right team."""
    ticket: str = dspy.InputField()
    category: str = dspy.OutputField()
    priority: str = dspy.OutputField()
```

**Module Types:**
- `dspy.Predict` — Basic LM call
- `dspy.ChainOfThought` — Step-by-step reasoning before output
- `dspy.ReAct` — Agent loop with tool use (Reason + Act)
- `dspy.ProgramOfThought` — Code generation for computation

**Agent Creation:**
```python
agent = dspy.ReAct(Triage, tools=[search, classify])
```

**Optimization:**
```python
optimizer = dspy.MIPROv2(metric=accuracy_metric, auto="medium")
optimized_agent = optimizer.compile(agent, trainset=examples)
```

**State Management:** Implicit within module execution. No explicit persistence layer — DSPy focuses on program quality optimization rather than runtime state.

**Communication:** DSPy programs are composable — modules call other modules. No inter-agent messaging protocol.

**Key Differentiator:** The compilation/optimization loop — DSPy can automatically discover prompts and few-shot demonstrations that maximize a quality metric, enabling small models to match or exceed hand-prompted large models.

> **Source:** DSPy, https://dspy.ai/  
> **Source:** Khattab et al., "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines" (ICLR 2024)

---

### 2.7 Framework Comparison Matrix

| Dimension | MAF (AutoGen+SK) | CrewAI | LangGraph | OpenAI Agents SDK | DSPy |
|-----------|----------|--------|-----------|-------------------|------|
| **Orchestration Model** | Graph-based workflow | Role-based crews + event-driven flows | Directed graph (cyclic) | Handoff chain | Module composition |
| **State Management** | Typed GraphState + checkpointing | Pydantic models + @persist | TypedDict + checkpointer/store | Conversation history + sessions | Implicit in module execution |
| **Communication** | State propagation on typed edges | Task outputs + shared memory | Shared state through graph | Conversation history handoff | Module-to-module calls |
| **Agent Definition** | IAIAgent with tools | role + goal + backstory | Python function node | instructions + tools + handoffs | Signature + Module |
| **Tool Integration** | AIFunction + MCP | Tool classes with schemas | Tool nodes | Function tools + hosted tools | Plain Python functions |
| **Multi-Agent** | Workflows with agent nodes | Crews (sequential/hierarchical) | Multi-graph composition | Handoffs / agent-as-tool | Module composition |
| **Persistence** | Cosmos/Postgres checkpointing | Flow state + @persist | Checkpointer + Store | Sessions | Save/load compiled programs |
| **Human-in-the-Loop** | Request/response pause | Flow event triggers | Graph interrupts | Guardrails | Not built-in |

---

## 3. Agent Capability Ontologies

### 3.1 Properties Defining Agent Capabilities

Based on the surveyed standards and frameworks, an agent's capabilities are defined by:

| Property | Description | Examples |
|----------|-------------|---------|
| **Functional Capabilities** | What the agent can do | Search, classify, generate code, negotiate |
| **Tools/Functions** | External actions available | API calls, database queries, file operations |
| **Knowledge Domain** | What the agent knows about | Finance, medicine, legal compliance |
| **Reasoning Abilities** | How the agent thinks | Planning, reflection, chain-of-thought, deduction |
| **Autonomy Level** | Degree of independent action | Fully autonomous, human-in-the-loop, supervised |
| **Communication Protocols** | How the agent interacts | FIPA-ACL, handoff, pub/sub, shared memory |
| **Resource Requirements** | What the agent needs | Model type, context window, compute, memory |
| **Quality Attributes** | Non-functional properties | Latency, accuracy, cost, reliability |

### 3.2 Tool/Function Modeling

Modern frameworks converge on a common pattern for tool definitions:

```typescript
// Canonical tool schema (synthesis across frameworks)
interface ToolDefinition {
  name: string;                    // Unique identifier
  description: string;             // Natural language description for LLM
  parameters: JSONSchema;          // Input schema with types, constraints
  returns: JSONSchema;             // Output schema
  requiresApproval?: boolean;      // Human-in-the-loop gate
  timeout?: number;                // Maximum execution time
  retryPolicy?: RetryConfig;       // Retry behavior on failure
  permissions?: string[];          // Required capabilities/roles
}
```

**MCP (Model Context Protocol)** standardizes tool discovery and invocation across agent boundaries, defining:
- Tool listing with JSON Schema parameters
- Resource access (read-only data)
- Prompt templates
- Transport (stdio, HTTP)

**A2A (Agent-to-Agent Protocol)** standardizes inter-agent communication:
- Agent cards (capability advertisement)
- Task lifecycle (created → working → completed/failed)
- Streaming results

### 3.3 Agent Roles and Permissions

Role modeling approaches across frameworks:

| Framework | Role Mechanism | Permission Model |
|-----------|---------------|-----------------|
| **FIPA** | Roles within interaction protocols (initiator, participant, manager, contractor) | AMS-controlled platform access |
| **CrewAI** | `role` + `goal` + `backstory` per agent; `allow_delegation` flag | Implicit via tool access |
| **MAF** | Agent nodes in workflow graph; role = position in graph | Middleware interceptors |
| **OpenAI SDK** | Agent instructions define role; handoff list defines scope | Guardrails for I/O validation |
| **LangGraph** | Node function defines behavior | State-based access control |

### 3.4 Existing Agent Ontologies

#### OASIS (Ontology for Agents, Systems and Integration of Services) v2

OASIS takes a **behaviouristic approach**, representing agents through their operational capabilities and mental states:

- **Agent Templates**: Abstract definitions of agent types
- **Concrete Agents**: Instantiated agents with specific states
- **Commitments**: Obligations agents have toward each other
- **Plans**: Structured action sequences
- **Entrustments**: Delegation of responsibility between agents

OASIS 2 has been applied in blockchain-oriented e-commerce (NGI-ONTOCHAIN project).

> **Source:** "The Ontology for Agents, Systems and Integration of Services: OASIS version 2", https://arxiv.org/html/2306.10061v2

#### MAS Ontology

A comparative ontology for multi-agent system methodologies:

- **Three main classes**: Methodology, Phases, Work_Products
- **Phase attributes**: Autonomy, Reactiveness, Sociality, Proactiveness, Reasoning, Mobility
- **Covers**: Tropos, ADELFE, Gaia, Prometheus, MaSE, MESSAGE methodologies

> **Source:** "MAS Ontology: Ontology for Multiagent Systems" (ICAART 2016), https://www.scitepress.org/PublishedPapers/2016/58701/58701.pdf

#### O-MaSE (Organization-based Multiagent System Engineering)

A meta-model-driven methodology for MAS development:

- **Three structures**: Metamodel, Method Fragments, Guidelines
- **Key concepts**: Organization, Role, Goal, Capability, Protocol, Agent
- **Capability modeling**: Atomic actions OR algorithmic plans (finite state machines)
- **Process engineering**: Custom processes assembled from reusable method fragments

> **Source:** García-Ojeda et al., "O-MaSE: A Customizable Approach to Developing Multiagent Development Processes" (AOSE 2007)

#### AIF (Agent Interaction Framework)

Part of the FIPA standards ecosystem, AIF provides:
- Standard vocabulary for describing agent interactions
- Protocol templates for common coordination patterns
- Semantic annotations for message content

---

## 4. Agent Lifecycle and State

### 4.1 Canonical Agent States

Synthesizing across FIPA, modern frameworks, and production implementations:

| State | Description | Triggers Entry | Triggers Exit |
|-------|-------------|---------------|---------------|
| `CREATED` / `INITIATED` | Agent instantiated, not yet operational | Constructor/factory call | Registration with platform |
| `IDLE` | Ready, awaiting input; minimal resource usage | Initialization / task completion | New task or message received |
| `PLANNING` | Analyzing task, generating execution plan | User/system input received | Plan generated |
| `EXECUTING` | Actively performing actions (tool calls, LLM inference) | Plan ready | Actions complete or error |
| `WAITING` | Blocked on external response (API, tool, user approval) | Async operation dispatched | Response received |
| `REFLECTING` | Evaluating results, deciding next action | Execution step complete | Decision made |
| `SUSPENDED` | Paused by system/user; can resume | Administrative action | Resume command |
| `ERROR` | Handling exception; may retry or escalate | Failure / timeout / parse error | Recovery or termination |
| `COMPLETED` | Task finished successfully | All steps done | Reset or termination |
| `TERMINATED` | Agent destroyed; resources released | Explicit kill or inactivity timeout | N/A |

### 4.2 State Transition Diagram

```
                    ┌──────────────┐
                    │   CREATED    │
                    └──────┬───────┘
                           │ register
                    ┌──────▼───────┐
              ┌────►│    IDLE      │◄────────────────┐
              │     └──────┬───────┘                  │
              │            │ task received            │
              │     ┌──────▼───────┐                  │
              │     │  PLANNING    │                  │
              │     └──────┬───────┘                  │
              │            │ plan ready               │
              │     ┌──────▼───────┐                  │
              │     │  EXECUTING   │──────┐           │
              │     └──────┬───────┘      │           │
              │            │              │ error     │
              │     ┌──────▼───────┐  ┌───▼────────┐ │
              │     │   WAITING    │  │   ERROR     │ │
              │     └──────┬───────┘  └───┬────────┘ │
              │            │ response     │ recovered │
              │     ┌──────▼───────┐      │           │
              │     │ REFLECTING   │◄─────┘           │
              │     └──────┬───────┘                  │
              │       ┌────┴────┐                     │
              │  continue    done                     │
              │       │         │                     │
              │       ▼    ┌────▼───────┐             │
              └──PLANNING  │ COMPLETED  │─────────────┘
                           └────────────┘
```

### 4.3 Framework-Specific State Models

**Microsoft UFO (Windows Agent):**
- Active states: `CONTINUE`
- Waiting states: `PENDING`, `CONFIRM`, `SCREENSHOT`
- Terminal states: `FINISH`, `FAIL`, `ERROR`
- Transition types: LLM reasoning, rule-based logic, user input, external events

**Sagents (Elixir framework):**
- `:idle`, `:running`, `:interrupted`, `:cancelled`, `:error`
- Auto-shutdown after inactivity when no viewers
- Telemetry events: `[:sagents, :execution, :start|:stop|:interrupt]`

**Hermes Agent Guide (FSM-based):**
- `IDLE` → `PLANNING` → `EXECUTING` → `WAITING` → `COMPLETED`
- Guards: Preconditions for transitions (e.g., "only enter EXECUTING if plan is non-empty")
- Actions: Side effects on state entry/exit (e.g., "write to errors.log on entering ERROR")

> **Source:** Microsoft UFO State Design, https://github.com/microsoft/UFO/blob/main/documents/docs/infrastructure/agents/design/state.md  
> **Source:** Sagents Lifecycle, https://sagents.hexdocs.pm/lifecycle.html

---

## 5. Agent Communication Patterns

### 5.1 Pattern Taxonomy

| Pattern | Topology | Coupling | Best For |
|---------|----------|---------|----------|
| **Direct Message Passing** | Point-to-point | Tight | Simple request/response, handoffs |
| **Pub/Sub** | Topic-based, many-to-many | Loose | Event-driven, scalable notifications |
| **Shared Blackboard** | Centralized repository | Medium | Opportunistic problem-solving, diverse expertise |
| **Contract Net Protocol** | Manager → Contractors | Medium | Dynamic task allocation, competitive bidding |
| **Conversation Protocols** | Structured exchange | Tight | Negotiation, auctions, complex coordination |
| **State Graph Propagation** | Along graph edges | Tight | Deterministic workflows, auditable pipelines |

### 5.2 Detailed Pattern Descriptions

#### Direct Message Passing
Agents send structured messages (typically JSON) directly to each other. Requires known addresses and explicit routing. Used in FIPA-ACL, KQML, and handoff-style frameworks (OpenAI Agents SDK).

**Minimum Viable Handoff Contract:**
- Input schema (typed fields, required vs optional)
- Output schema (guaranteed structure)
- Error codes (enumerated failure states)
- Timeout contract (maximum acceptable latency)
- Retry policy (count, backoff, circuit breaker)

#### Pub/Sub (Publish-Subscribe)
Agents publish typed events to topics. Subscriber agents react when relevant events arrive. Decoupled, scalable, resilient — but requires idempotency (safe to receive the same event twice). Used in CrewAI Flows (`@listen` decorator) and event-driven architectures.

#### Shared Blackboard
A shared knowledge repository that all agents can read from and write to. Agents monitor the blackboard for relevant information, perform specialized processing, and post results. Supports opportunistic problem-solving. LangGraph's shared `State` is a modern variant of the blackboard pattern.

#### Contract Net Protocol (CNP)
Classic FIPA coordination pattern:
1. Manager announces task (CFP)
2. Contractors submit bids (PROPOSE)
3. Manager evaluates and awards (ACCEPT-PROPOSAL / REJECT-PROPOSAL)
4. Contractor executes and reports (INFORM / FAILURE)

Extensions: Iterated CNP (multiple rounds of refinement), multi-attribute auctions.

#### State Graph Propagation
Used in LangGraph and MAF. Communication is realized through deterministic state propagation along predefined edges in the execution graph, rather than through explicit message passing.

### 5.3 Modern Protocol Stack

The emerging multi-agent protocol stack separates:

| Layer | Protocol | Scope |
|-------|----------|-------|
| **Agent-to-Tool** | MCP (Model Context Protocol) | Agent discovers and invokes tools/resources |
| **Agent-to-Agent** | A2A (Agent-to-Agent Protocol) | Cross-runtime agent communication and task delegation |
| **Application** | Framework-specific (LangGraph state, CrewAI tasks, etc.) | Intra-application orchestration |
| **Transport** | HTTP, gRPC, WebSocket, stdio | Network communication |

> **Source:** "Multi-Agent Coordination across Diverse Applications: A Survey" (arXiv 2502.14743)  
> **Source:** "Understanding Multi-Agent LLM Frameworks" (arXiv 2602.03128)

---

## 6. Key Academic References

### 6.1 Top 10 Papers on Agent Architectures and Ontologies

| # | Paper | Authors | Year | Relevance |
|---|-------|---------|------|-----------|
| 1 | **"Intelligent Agents: Theory and Practice"** | Wooldridge & Jennings | 1995 | Foundational survey dividing agent research into theory, architecture, and languages. Defines the agent properties (autonomy, reactivity, proactiveness, social ability). |
| 2 | **"BDI Agents: From Theory to Practice"** | Rao & Georgeff | 1995 | Seminal BDI paper bridging formal BDI logic with practical implementation (PRS/dMARS). Introduces commitment strategies. |
| 3 | **"Modeling Rational Agents within a BDI-Architecture"** | Rao & Georgeff | 1991 | Formal BDI model using branching-time possible worlds. Proves intentions are irreducible to beliefs and desires. |
| 4 | **"AgentSpeak(L): BDI Agents Speak Out in a Logical Computable Language"** | Rao | 1996 | Introduces the AgentSpeak programming language for BDI agents. Foundation for Jason interpreter. |
| 5 | **"KQML as an Agent Communication Language"** | Finin et al. | 1994 | Defines KQML message format, performatives, and communication facilitators. Precursor to FIPA-ACL. |
| 6 | **"The Landscape of Emerging AI Agent Architectures for Reasoning, Planning, and Tool Calling: A Survey"** | Masterman et al. | 2024 | Modern survey of single- and multi-agent architectures with focus on reasoning, planning, and tool use. |
| 7 | **"Agentic AI: A Comprehensive Survey of Architectures, Applications, and Future Directions"** | (Springer AI Review) | 2025 | Dual-paradigm framework (symbolic vs. neural) covering 90 studies across healthcare, finance, robotics. |
| 8 | **"DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines"** | Khattab et al. | 2024 (ICLR) | Paradigm shift from prompting to programming LMs. Introduces signatures, modules, and optimizers. |
| 9 | **"OASIS v2: Ontology for Agents, Systems and Integration of Services"** | (WOA/CEUR) | 2023 | Behaviouristic ontology for agent representation covering templates, commitments, plans, and entrustments. |
| 10 | **"A Taxonomy of Architecture Options for Foundation Model-based Agents: Analysis and Decision Model"** | (arXiv) | 2024 | Systematic taxonomy covering functional capabilities, non-functional qualities, and design/runtime decisions. |

### 6.2 Additional Key References

| Paper | Authors | Year | URL |
|-------|---------|------|-----|
| "Agent Theories, Architectures, and Languages: A Survey" | Wooldridge & Jennings | 1994 | https://eprints.soton.ac.uk/252177/1/ECAI94-WS.pdf |
| "BDI Agent Architectures: A Survey" | Logan et al. | 2020 (IJCAI) | https://www.ijcai.org/proceedings/2020/0684.pdf |
| "On the Formal Semantics of Speech-Act Based Communication" | Bordini et al. | JAIR | https://www.jair.org/index.php/jair/article/download/10503/25163/ |
| "O-MaSE: A Customizable Approach to Developing Multiagent Development Processes" | García-Ojeda et al. | 2007 (AOSE) | https://doi.org/10.1007/978-3-540-79488-2_1 |
| "Agentic AI Frameworks: Architectures, Protocols, and Design Challenges" | Derouiche et al. | 2025 | https://arxiv.org/pdf/2508.10146 |
| "AI Agent Systems: Architectures, Applications, and Evaluation" | (arXiv) | 2025 | https://arxiv.org/html/2601.01743 |
| "The Semantic Agent: Why Ontologies Will Outlast Agent Frameworks" | Ananth | 2025 | LinkedIn article — argues domain ontologies appreciate while framework-specific orchestration depreciates |
| "Understanding Multi-Agent LLM Frameworks: A Unified Benchmark" | (arXiv) | 2026 | https://arxiv.org/pdf/2602.03128 |
| "Agentic Large Language Models, a Survey" | Plaat et al. | 2025 | https://arxiv.org/html/2503.23037v3 |
| "Multi-Agent Coordination across Diverse Applications: A Survey" | (arXiv) | 2025 | https://arxiv.org/pdf/2502.14743 |

---

## 7. Practical Relevance for Ontology Design

### 7.1 Core Ontology Entities (Synthesis)

Based on this research, a comprehensive agent ontology should model:

```
Agent
├── identity (name, addresses, platform)
├── capabilities (tools, knowledge domains, reasoning abilities)
├── mental_state (beliefs, desires, intentions) [BDI]
├── role (in organization/workflow)
├── lifecycle_state (idle, planning, executing, waiting, error, completed, terminated)
├── configuration (model, instructions, parameters)
└── permissions (what the agent is authorized to do)

Task
├── description, expected_output
├── assigned_agent
├── dependencies (prerequisite tasks)
├── status (pending, in_progress, completed, failed)
└── context (input data, constraints)

Tool
├── name, description
├── input_schema (typed parameters)
├── output_schema
├── permissions_required
├── timeout, retry_policy
└── provider (MCP server, API, local function)

Message
├── performative (inform, request, query, propose, etc.)
├── sender, receiver, reply_to
├── content, language, ontology
├── protocol, conversation_id
└── thread_control (reply_with, in_reply_to, reply_by)

Protocol
├── name (request, contract_net, subscribe, etc.)
├── roles (initiator, participant, manager, contractor)
├── message_sequence (ordered performatives)
├── state_machine (protocol states and transitions)
└── termination_conditions

Workflow
├── graph (nodes + edges)
├── state_schema (typed shared state)
├── checkpointing (persistence strategy)
└── orchestration_pattern (sequential, concurrent, hierarchical, handoff)

Memory
├── scope (agent, team, global)
├── type (short_term, long_term, episodic, semantic)
├── storage (vector, key_value, graph)
└── access_policy (read/write permissions per agent)

Organization
├── agents (members)
├── roles (defined positions)
├── goals (organizational objectives)
├── protocols (interaction rules)
└── hierarchy (authority structure)
```

### 7.2 Key Design Decisions for Ontology

1. **Hybrid heritage**: Bridge FIPA formal rigor with modern LLM framework pragmatism
2. **State as first class**: Agent lifecycle states must be explicit and standardized
3. **Tool interoperability**: Align with MCP's tool schema for cross-framework compatibility
4. **Communication flexibility**: Support multiple patterns (direct, pub/sub, blackboard, CNP)
5. **Capability modeling**: Use OASIS-style behaviouristic approach + O-MaSE capability hierarchies
6. **Ontology-grounded agents**: Per the "Semantic Agent" thesis, domain ontologies provide durable value independent of framework churn

### 7.3 Framework Convergence Trends

- **Microsoft** merged AutoGen + Semantic Kernel → Agent Framework (graph-based workflows)
- **OpenAI** graduated Swarm → Agents SDK (production handoffs + guardrails)
- **Protocol layer**: MCP (agent-to-tool) + A2A (agent-to-agent) emerging as standards
- **State management** converging on explicit, typed, checkpointable state
- **Ontology resurgence**: Growing recognition that structured domain models outlast framework-specific orchestration

---

*Report compiled from 24 web sources, 10 academic papers, and 6 framework documentation sites.*
*All URLs verified as of 2026-06-30.*
