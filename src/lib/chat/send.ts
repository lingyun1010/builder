import type { AgentEvent, AgentRunner } from "../agent/runner";
import {
  appendMessage,
  getProject,
  setSessionId,
  type Project,
  workspaceDir,
  type ChatMessage,
} from "../store/projects";
import { getApiKey } from "../store/secrets";

export type ChatEvent = AgentEvent | { type: "done"; messages: ChatMessage[] };

export type ChatErrorCode = "not_found" | "empty" | "no_key" | "busy";

export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ChatError";
  }
}

// One agent run per project at a time (single local process).
const running = new Set<string>();

/**
 * Checks that a message can start, then returns the stream of what happens.
 * Refusals throw a ChatError here, before anything is saved.
 */
export async function startChat(
  projectId: string,
  rawText: string,
  runner: AgentRunner,
  signal?: AbortSignal
): Promise<AsyncGenerator<ChatEvent>> {
  const [project, apiKey] = await Promise.all([
    getProject(projectId),
    getApiKey(),
  ]);
  if (!project) throw new ChatError("not_found", "Project not found.");

  const text = String(rawText ?? "").trim();
  if (!text) throw new ChatError("empty", "Write a message first.");

  if (!apiKey) {
    throw new ChatError(
      "no_key",
      "Add your Anthropic API key on the home page first."
    );
  }

  if (running.has(projectId)) {
    throw new ChatError(
      "busy",
      "The agent is still working on your last message."
    );
  }
  running.add(projectId);

  // The lock is released when the returned generator finishes, so the caller
  // must iterate it to the end or call .return() on it.
  return run(project, text, runner, { apiKey, signal });
}

async function* run(
  initial: Project,
  text: string,
  runner: AgentRunner,
  opts: { apiKey: string; signal?: AbortSignal }
): AsyncGenerator<ChatEvent> {
  const projectId = initial.id;
  const saved: ChatMessage[] = [];
  let project = initial;
  let reply = "";
  // The first failure wins: whether the agent reported it or the run threw.
  let failure: string | null = null;

  try {
    saved.push(await appendMessage(projectId, { role: "user", text }));

    try {
      const events = runner({
        prompt: text,
        cwd: workspaceDir(projectId),
        apiKey: opts.apiKey,
        sessionId: project.sessionId,
        signal: opts.signal,
      });
      for await (const event of events) {
        if (event.type === "session") {
          if (event.sessionId !== project.sessionId) {
            project = await setSessionId(project, event.sessionId);
          }
        } else if (event.type === "text") {
          reply += event.text;
        } else if (event.type === "error") {
          failure ??= event.message;
        }
        yield event;
      }
    } catch (error) {
      if (!failure) {
        failure = opts.signal?.aborted
          ? "Stopped."
          : `The agent stopped unexpectedly: ${error instanceof Error ? error.message : String(error)}`;
        yield { type: "error", message: failure };
      }
    }

    if (reply.trim()) {
      saved.push(
        await appendMessage(projectId, {
          role: "assistant",
          text: reply.trim(),
        })
      );
    }
    if (failure || !reply.trim()) {
      saved.push(
        await appendMessage(projectId, {
          role: "error",
          text: failure ?? "The agent finished without a reply.",
        })
      );
    }
    yield { type: "done", messages: saved };
  } finally {
    running.delete(projectId);
  }
}
