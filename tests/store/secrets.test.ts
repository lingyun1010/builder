import { stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  apiKeyStatus,
  getApiKey,
  saveApiKey,
} from "../../src/lib/store/secrets";
import { TEST_KEY, useTempDataDir } from "../helpers/tmp-data";

describe("API key store", () => {
  const tmp = useTempDataDir();

  it("has no key at first", async () => {
    expect(await getApiKey()).toBeNull();
    expect(await apiKeyStatus()).toEqual({ saved: false, source: null });
  });

  it("saves a key in a file only the owner can read", async () => {
    await saveApiKey(`  ${TEST_KEY}\n`);

    expect(await getApiKey()).toBe(TEST_KEY);
    expect(await apiKeyStatus()).toEqual({ saved: true, source: "file" });
    const info = await stat(path.join(tmp.dir(), "secrets.json"));
    expect(info.mode & 0o777).toBe(0o600);
  });

  it("rejects values that do not look like an Anthropic key", async () => {
    await expect(saveApiKey("")).rejects.toThrow(/key/i);
    await expect(saveApiKey("hello")).rejects.toThrow(/key/i);
    await expect(saveApiKey("sk-ant-has space")).rejects.toThrow(/key/i);
    expect(await getApiKey()).toBeNull();
  });

  it("falls back to ANTHROPIC_API_KEY from the environment", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-from-env-000000";
    expect(await getApiKey()).toBe("sk-ant-from-env-000000");
    expect(await apiKeyStatus()).toEqual({ saved: true, source: "env" });

    await saveApiKey(TEST_KEY);
    expect(await getApiKey()).toBe(TEST_KEY);
  });
});
