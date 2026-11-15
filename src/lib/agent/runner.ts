/** What the agent reports while it works on one user message. */
export type AgentEvent =
  | { type: "session"; sessionId: string }
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "error"; message: string };

export type AgentRunInput = {
  prompt: string;
  /** The project workspace: the only folder the agent may change. */
  cwd: string;
  apiKey: string;
  /** Session to continue, or null for the first message. */
  sessionId: string | null;
  signal?: AbortSignal;
};

/** The seam between chat and the agent runtime. Tests pass a fake. */
export type AgentRunner = (input: AgentRunInput) => AsyncIterable<AgentEvent>;
