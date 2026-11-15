import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readStage, writeStage } from "../../src/lib/workspace/stage";

describe("stage file in the workspace", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "builder-stage-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("starts at Init when there is no file", async () => {
    expect(await readStage(dir)).toBe("Init");
  });

  it("reads the stage the agent wrote, ignoring case and spaces", async () => {
    await mkdir(path.join(dir, ".builder"));
    await writeFile(path.join(dir, ".builder", "stage"), "  pre-pr \n");
    expect(await readStage(dir)).toBe("Pre-PR");
  });

  it("falls back to Init for text that is not a stage", async () => {
    await mkdir(path.join(dir, ".builder"));
    await writeFile(path.join(dir, ".builder", "stage"), "banana");
    expect(await readStage(dir)).toBe("Init");
  });

  it("writes a stage that readStage returns", async () => {
    await writeStage(dir, "Build");
    expect(await readStage(dir)).toBe("Build");
  });
});
