import { query, type Options } from "@anthropic-ai/claude-agent-sdk";
import { BUILDER_PROMPT } from "./prompt";
import type { AgentEvent, AgentRunner } from "./runner";

const DEFAULT_MODEL = "claude-opus-5-5";

const FRIENDLY_ERRORS: Record<string, string> = {
  authentication_failed:
    "Your Anthropic API key was rejected. Save a working key on the home page and try again.",
  billing_error:
    "Your Anthropic account has a billing problem (for example no credit left). Fix it in the Anthropic Console and try again.",
  rate_limit:
    "Anthropic is rate-limiting your key right now. Wait a minute and try again.",
  overloaded: "Anthropic is overloaded right now. Wait a minute and try again.",
  model_not_found: "Your API key cannot use the configured model.",
};

/** Environment for the agent process: this machine's, with only the user's key for auth. */
function agentEnv(apiKey: string): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  delete env.ANTHROPIC_AUTH_TOKEN;
  delete env.CLAUDE_CODE_OAUTH_TOKEN;
  env.ANTHROPIC_API_KEY = apiKey;
  env.CLAUDE_AGENT_SDK_CLIENT_APP = "builder-prototype/0.0.0";
  return env;
}

export function agentOptions(input: {
  cwd: string;
  apiKey: string;
  sessionId: string | null;
  abortController: AbortController;
}): Options {
  return {
    cwd: input.cwd,
    model: process.env.BUILDER_MODEL?.trim() || DEFAULT_MODEL,
    resume: input.sessionId ?? undefined,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: BUILDER_PROMPT,
    },
    // Do not load this machine's own Claude settings, hooks or CLAUDE.md files.
    settingSources: [],
    tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
    // File edits are accepted inside the workspace only. Commands run in the
    // SDK sandbox. Anything else that would need approval is refused, because
    // nobody is there to approve it (ADR 0008).
    permissionMode: "acceptEdits",
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      allowUnsandboxedCommands: false,
    },
    canUseTool: async () => ({
      behavior: "deny",
      message:
        "Not allowed in this prototype: work only inside the project folder and with sandboxed commands.",
    }),
    includePartialMessages: true,
    abortController: input.abortController,
    env: agentEnv(input.apiKey),
  };
}

/** Runs one user message through the Claude Agent SDK in the project workspace. */
export const sdkRunner: AgentRunner = async function* (input) {
  const abortController = new AbortController();
  const onAbort = () => abortController.abort();
  if (input.signal?.aborted) onAbort();
  input.signal?.addEventListener("abort", onAbort, { once: true });

  let sessionId: string | null = null;
  let wroteText = false;
  let reportedError = false;

  const error = (message: string): AgentEvent => {
    reportedError = true;
    return { type: "error", message };
  };

  try {
    const messages = query({
      prompt: input.prompt,
      options: agentOptions({ ...input, abortController }),
    });

    for await (const message of messages) {
      if (
        "session_id" in message &&
        message.session_id &&
        message.session_id !== sessionId
      ) {
        sessionId = message.session_id;
        yield { type: "session", sessionId };
      }

      if (message.type === "stream_event") {
        if (message.parent_tool_use_id !== null) continue;
        const event = message.event;
        if (event.type === "content_block_start") {
          if (event.content_block.type === "tool_use") {
            yield { type: "tool", name: event.content_block.name };
          } else if (event.content_block.type === "text" && wroteText) {
            yield { type: "text", text: "\n\n" };
          }
        } else if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          wroteText = true;
          yield { type: "text", text: event.delta.text };
        }
      } else if (message.type === "assistant") {
        if (message.error && !reportedError) {
          yield error(
            FRIENDLY_ERRORS[message.error] ??
              `The model call failed (${message.error}).`
          );
        }
      } else if (message.type === "result") {
        if (message.is_error && !reportedError) {
          yield error(
            message.subtype === "success"
              ? message.result || "The agent stopped with an error."
              : `The agent stopped early (${message.subtype.replace(/^error_/, "").replaceAll("_", " ")}).`
          );
        }
      }
    }
  } catch (cause) {
    // The SDK also throws after it reports an error result. Once the user has
    // been told what went wrong, the second report adds nothing.
    if (!reportedError) throw cause;
  } finally {
    input.signal?.removeEventListener("abort", onAbort);
  }
};
