import { describe, expect, it } from "vitest";
import { agentEnv } from "../../src/lib/agent/sdk-runner";

describe("agent environment", () => {
  it("passes the user's key and drops secrets from this app's environment", () => {
    const env = agentEnv("sk-ant-user-key-123456", {
      PATH: "/usr/bin",
      HOME: "/Users/x",
      SUPABASE_DB_PASSWORD: "pw",
      GITHUB_TOKEN: "t",
      ANTHROPIC_AUTH_TOKEN: "login",
      ANTHROPIC_API_KEY: "other",
      DATABASE_URL: "postgres://x",
    });
    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-user-key-123456");
    expect(env.PATH).toBe("/usr/bin");
    expect(env.HOME).toBe("/Users/x");
    expect(Object.keys(env).sort()).toEqual([
      "ANTHROPIC_API_KEY",
      "CLAUDE_AGENT_SDK_CLIENT_APP",
      "HOME",
      "PATH",
    ]);
  });
});
