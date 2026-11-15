import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendMessage,
  createProject,
  getProject,
  listProjects,
  readTranscript,
  setSessionId,
  workspaceDir,
} from "../../src/lib/store/projects";
import { useTempDataDir } from "../helpers/tmp-data";

describe("project file store", () => {
  const tmp = useTempDataDir();

  it("creates a project folder with a workspace and reads it back", async () => {
    const project = await createProject("  My Recipe App ");

    expect(project.name).toBe("My Recipe App");
    expect(project.id).toMatch(/^my-recipe-app-[a-f0-9]{6}$/);
    expect(project.sessionId).toBeNull();
    expect(await getProject(project.id)).toEqual(project);

    const ws = await stat(workspaceDir(project.id));
    expect(ws.isDirectory()).toBe(true);
    expect(workspaceDir(project.id).startsWith(tmp.dir())).toBe(true);
  });

  it("rejects an empty name", async () => {
    await expect(createProject("   ")).rejects.toThrow(/name/i);
  });

  it("lists projects newest first, and an empty store as no projects", async () => {
    expect(await listProjects()).toEqual([]);
    const a = await createProject("First");
    await new Promise((r) => setTimeout(r, 5));
    const b = await createProject("Second");
    expect((await listProjects()).map((p) => p.id)).toEqual([b.id, a.id]);
  });

  it("returns null for an unknown project and for an unsafe id", async () => {
    expect(await getProject("nope-000000")).toBeNull();
    expect(await getProject("../secrets")).toBeNull();
    expect(() => workspaceDir("../..")).toThrow(/project id/i);
  });

  it("appends messages to a transcript file, one JSON line each", async () => {
    const { id } = await createProject("Chat");
    expect(await readTranscript(id)).toEqual([]);

    await appendMessage(id, { role: "user", text: "hello\nthere" });
    await appendMessage(id, { role: "assistant", text: "hi" });

    const messages = await readTranscript(id);
    expect(messages.map((m) => [m.role, m.text])).toEqual([
      ["user", "hello\nthere"],
      ["assistant", "hi"],
    ]);
    const raw = await readFile(
      path.join(tmp.dir(), "projects", id, "transcript.jsonl"),
      "utf8"
    );
    expect(raw.trim().split("\n")).toHaveLength(2);
  });

  it("saves the agent session id on the project", async () => {
    const { id } = await createProject("Resume");
    await setSessionId(id, "sess-123");
    expect((await getProject(id))?.sessionId).toBe("sess-123");
  });
});
