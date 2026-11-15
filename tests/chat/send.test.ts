import { describe, expect, it } from "vitest";
import type { AgentEvent, AgentRunner } from "../../src/lib/agent/runner";
import { ChatError, startChat, type ChatEvent } from "../../src/lib/chat/send";
import {
  createProject,
  getProject,
  readTranscript,
} from "../../src/lib/store/projects";
import { writeStage } from "../../src/lib/workspace/stage";
import { saveApiKey } from "../../src/lib/store/secrets";
import { TEST_KEY, useTempDataDir } from "../helpers/tmp-data";

function fakeRunner(events: AgentEvent[], calls: unknown[] = []): AgentRunner {
  return async function* (input) {
    calls.push(input);
    for (const event of events) yield event;
  };
}

async function collect(stream: AsyncIterable<ChatEvent>) {
  const out: ChatEvent[] = [];
  for await (const event of stream) out.push(event);
  return out;
}

describe("chat seam (file store + agent runner)", () => {
  useTempDataDir();

  it("streams the reply, then saves both messages and the session id", async () => {
    await saveApiKey(TEST_KEY);
    const { id } = await createProject("Demo");
    const calls: Array<Record<string, unknown>> = [];
    const runner = fakeRunner(
      [
        { type: "session", sessionId: "sess-1" },
        { type: "text", text: "Hello " },
        { type: "tool", name: "Write" },
        { type: "text", text: "there." },
      ],
      calls
    );

    const events = await collect(
      await startChat(id, " Build me a todo app ", runner)
    );

    expect(events.slice(0, -1).map((e) => e.type)).toEqual([
      "session",
      "text",
      "tool",
      "text",
    ]);
    const done = events.at(-1);
    expect(done).toMatchObject({
      type: "done",
      messages: [
        { role: "user", text: "Build me a todo app" },
        { role: "assistant", text: "Hello there." },
      ],
    });

    expect((await readTranscript(id)).map((m) => [m.role, m.text])).toEqual([
      ["user", "Build me a todo app"],
      ["assistant", "Hello there."],
    ]);
    expect((await getProject(id))?.sessionId).toBe("sess-1");
    expect(calls[0]).toMatchObject({
      prompt: "Build me a todo app",
      apiKey: TEST_KEY,
      sessionId: null,
    });
    expect(String(calls[0].cwd)).toContain(id);
  });

  it("continues the saved session on the next message", async () => {
    await saveApiKey(TEST_KEY);
    const { id } = await createProject("Demo");
    const calls: Array<Record<string, unknown>> = [];
    const runner = fakeRunner(
      [
        { type: "session", sessionId: "sess-1" },
        { type: "text", text: "ok" },
      ],
      calls
    );

    await collect(await startChat(id, "one", runner));
    await collect(await startChat(id, "two", runner));

    expect(calls[1]).toMatchObject({ prompt: "two", sessionId: "sess-1" });
    expect(await readTranscript(id)).toHaveLength(4);
  });

  it("saves an agent error in the transcript and still finishes", async () => {
    await saveApiKey(TEST_KEY);
    const { id } = await createProject("Demo");
    const runner = fakeRunner([
      { type: "text", text: "Starting" },
      { type: "error", message: "Your API key was rejected." },
    ]);

    const events = await collect(await startChat(id, "hi", runner));

    expect(events.at(-1)).toMatchObject({
      type: "done",
      messages: [
        { role: "user" },
        { role: "assistant" },
        { role: "error", text: "Your API key was rejected." },
      ],
    });
    expect((await readTranscript(id)).map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "error",
    ]);
  });

  it("turns a runner crash into a saved error, and frees the project", async () => {
    await saveApiKey(TEST_KEY);
    const { id } = await createProject("Demo");
    const crashing: AgentRunner = async function* () {
      yield { type: "text", text: "a" };
      throw new Error("boom");
    };

    const events = await collect(await startChat(id, "hi", crashing));
    expect(events.at(-1)).toMatchObject({
      type: "done",
      messages: [{ role: "user" }, { role: "assistant" }, { role: "error" }],
    });

    await expect(startChat(id, "again", fakeRunner([]))).resolves.toBeDefined();
  });

  it("refuses up front: unknown project, empty text, no key, already running", async () => {
    const { id } = await createProject("Demo");
    const runner = fakeRunner([]);

    await expect(startChat("nope-000000", "hi", runner)).rejects.toMatchObject({
      code: "not_found",
    });
    await expect(startChat(id, "   ", runner)).rejects.toMatchObject({
      code: "empty",
    });
    await expect(startChat(id, "hi", runner)).rejects.toMatchObject({
      code: "no_key",
    });
    expect(await readTranscript(id)).toEqual([]);

    await saveApiKey(TEST_KEY);
    const first = await startChat(id, "hi", runner);
    await expect(startChat(id, "hi again", runner)).rejects.toBeInstanceOf(
      ChatError
    );
    await expect(startChat(id, "hi again", runner)).rejects.toMatchObject({
      code: "busy",
    });
    await collect(first);
  });

  it("frees the project when the stream is closed before it starts", async () => {
    await saveApiKey(TEST_KEY);
    const { id } = await createProject("Demo");
    const stream = await startChat(id, "hi", fakeRunner([]));
    await stream.return(undefined);
    await expect(startChat(id, "again", fakeRunner([]))).resolves.toBeDefined();
  });

  it("reports the stage the agent recorded in the workspace", async () => {
    await saveApiKey(TEST_KEY);
    const { id } = await createProject("Demo");
    const runner: AgentRunner = async function* (input) {
      await writeStage(input.cwd, "Think");
      yield { type: "text", text: "Let's think." };
    };
    const events = await collect(await startChat(id, "hi", runner));
    expect(events.at(-1)).toMatchObject({ type: "done", stage: "Think" });
  });
});
