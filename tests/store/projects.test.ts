import { execFileSync } from "node:child_process";
import { appendFile, readFile, stat } from "node:fs/promises";
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
import { projectDir } from "../../src/lib/store/paths";
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
    const project = await createProject("Resume");
    await setSessionId(project, "sess-123");
    expect((await getProject(project.id))?.sessionId).toBe("sess-123");
  });

  it("skips a transcript line that was cut short", async () => {
    const { id } = await createProject("Torn");
    await appendMessage(id, { role: "user", text: "kept" });
    await appendFile(
      path.join(projectDir(id), "transcript.jsonl"),
      '{"role":"user","te'
    );
    expect((await readTranscript(id)).map((m) => m.text)).toEqual(["kept"]);
  });

  it("makes the workspace its own git repo with a stage file", async () => {
    const { id } = await createProject("Own repo");
    const ws = workspaceDir(id);
    expect((await stat(path.join(ws, ".git"))).isDirectory()).toBe(true);
    expect(await readFile(path.join(ws, ".builder", "stage"), "utf8")).toBe(
      "Init\n"
    );
  });

  it("starts the workspace repo on main with a first commit, and keeps the stage file out of git", async () => {
    const { id } = await createProject("First commit");
    const ws = workspaceDir(id);
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: ws, encoding: "utf8" }).trim();
    expect(git("branch", "--show-current")).toBe("main");
    expect(git("rev-list", "--count", "HEAD")).toBe("1");
    expect(git("status", "--porcelain")).toBe("");
    expect(git("ls-files")).toBe(".gitignore");
  });
});
