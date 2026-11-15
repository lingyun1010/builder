import { describe, expect, it, vi } from "vitest";
import type { AgentRunner } from "../../src/lib/agent/runner";
import { TEST_KEY, useTempDataDir } from "../helpers/tmp-data";

vi.mock("../../src/lib/agent/sdk-runner", () => {
  const sdkRunner: AgentRunner = async function* () {
    yield { type: "session", sessionId: "sess-api" };
    yield { type: "text", text: "Hi from the agent" };
  };
  return { sdkRunner };
});

import * as keyRoute from "../../app/api/key/route";
import * as projectsRoute from "../../app/api/projects/route";
import * as projectRoute from "../../app/api/projects/[id]/route";
import * as messagesRoute from "../../app/api/projects/[id]/messages/route";

const BASE = "http://localhost:3000";
const post = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
) =>
  new Request(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("API routes over the file store", () => {
  useTempDataDir();

  it("saves the key and never returns it", async () => {
    const before = await keyRoute.GET(new Request(BASE + "/api/key"));
    expect(await before.json()).toEqual({ saved: false, source: null });

    const bad = await keyRoute.POST(post("/api/key", { key: "nope" }));
    expect(bad.status).toBe(400);

    const saved = await keyRoute.POST(post("/api/key", { key: TEST_KEY }));
    expect(saved.status).toBe(200);
    const body = JSON.stringify(await saved.json());
    expect(body).not.toContain(TEST_KEY);

    const after = await keyRoute.GET(new Request(BASE + "/api/key"));
    const afterText = await after.text();
    expect(JSON.parse(afterText)).toEqual({ saved: true, source: "file" });
    expect(afterText).not.toContain(TEST_KEY);
  });

  it("blocks calls from another site", async () => {
    const res = await keyRoute.POST(
      post("/api/key", { key: TEST_KEY }, { origin: "https://evil.example" })
    );
    expect(res.status).toBe(403);
    const list = await projectsRoute.GET(
      new Request(BASE + "/api/projects", {
        headers: { origin: "https://evil.example" },
      })
    );
    expect(list.status).toBe(403);
  });

  it("creates a project, chats, and shows the saved chat on reload", async () => {
    await keyRoute.POST(post("/api/key", { key: TEST_KEY }));

    const created = await projectsRoute.POST(
      post("/api/projects", { name: "Todo" })
    );
    expect(created.status).toBe(201);
    const { project } = await created.json();

    const noName = await projectsRoute.POST(
      post("/api/projects", { name: " " })
    );
    expect(noName.status).toBe(400);

    const reply = await messagesRoute.POST(
      post(`/api/projects/${project.id}/messages`, { text: "hello" }),
      ctx(project.id)
    );
    expect(reply.status).toBe(200);
    const lines = (await reply.text())
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(lines.map((l) => l.type)).toEqual(["session", "text", "done"]);

    const reload = await projectRoute.GET(
      new Request(`${BASE}/api/projects/${project.id}`),
      ctx(project.id)
    );
    const data = await reload.json();
    expect(data.project.sessionId).toBe("sess-api");
    expect(data.messages.map((m: { text: string }) => m.text)).toEqual([
      "hello",
      "Hi from the agent",
    ]);

    const list = await projectsRoute.GET(new Request(BASE + "/api/projects"));
    expect((await list.json()).projects).toHaveLength(1);
  });

  it("answers with clear statuses when a message cannot start", async () => {
    const missing = await messagesRoute.POST(
      post("/api/projects/nope-000000/messages", { text: "hi" }),
      ctx("nope-000000")
    );
    expect(missing.status).toBe(404);

    const created = await projectsRoute.POST(
      post("/api/projects", { name: "Todo" })
    );
    const { project } = await created.json();
    const noKey = await messagesRoute.POST(
      post(`/api/projects/${project.id}/messages`, { text: "hi" }),
      ctx(project.id)
    );
    expect(noKey.status).toBe(400);
    expect((await noKey.json()).error).toMatch(/key/i);

    const gone = await projectRoute.GET(
      new Request(`${BASE}/api/projects/nope-000000`),
      ctx("nope-000000")
    );
    expect(gone.status).toBe(404);
  });
});
