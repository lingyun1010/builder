import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataDir, isMissing } from "./paths";

export type ApiKeyStatus = { saved: boolean; source: "file" | "env" | null };

const secretsFile = () => path.join(dataDir(), "secrets.json");

// Format check only. A wrong key shows up as a clear error on the first message.
const KEY_SHAPE = /^sk-ant-[A-Za-z0-9_-]{10,300}$/;

async function readSavedKey(): Promise<string | null> {
  try {
    const parsed = JSON.parse(await readFile(secretsFile(), "utf8"));
    return typeof parsed.anthropicApiKey === "string"
      ? parsed.anthropicApiKey
      : null;
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

export async function saveApiKey(rawKey: unknown): Promise<void> {
  const key = (typeof rawKey === "string" ? rawKey : "").trim();
  if (!KEY_SHAPE.test(key)) {
    throw new Error(
      "That does not look like an Anthropic API key (it starts with sk-ant-)."
    );
  }
  await mkdir(dataDir(), { recursive: true });
  await writeFile(
    secretsFile(),
    JSON.stringify({ anthropicApiKey: key }) + "\n",
    {
      mode: 0o600,
    }
  );
  // writeFile keeps the old mode when the file already exists.
  await chmod(secretsFile(), 0o600);
}

/** The saved key wins; ANTHROPIC_API_KEY from the environment is the fallback. */
async function resolveKey(): Promise<{
  key: string;
  source: "file" | "env";
} | null> {
  const saved = await readSavedKey();
  if (saved) return { key: saved, source: "file" };
  const env = process.env.ANTHROPIC_API_KEY?.trim();
  return env ? { key: env, source: "env" } : null;
}

export async function getApiKey(): Promise<string | null> {
  return (await resolveKey())?.key ?? null;
}

export async function apiKeyStatus(): Promise<ApiKeyStatus> {
  const found = await resolveKey();
  return found
    ? { saved: true, source: found.source }
    : { saved: false, source: null };
}
