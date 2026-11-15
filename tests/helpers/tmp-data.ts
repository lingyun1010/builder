import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach } from "vitest";

/** Points the file store at a fresh temp folder for each test. */
export function useTempDataDir(): { dir: () => string } {
  let dir = "";
  const savedDir = process.env.BUILDER_DATA_DIR;
  const savedKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "builder-test-"));
    process.env.BUILDER_DATA_DIR = dir;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    if (savedDir === undefined) delete process.env.BUILDER_DATA_DIR;
    else process.env.BUILDER_DATA_DIR = savedDir;
    if (savedKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = savedKey;
  });

  return { dir: () => dir };
}

export const TEST_KEY = "sk-ant-test-0000000000000000";
