"use client";

import { useState, type FormEvent } from "react";
import { postJson } from "./post-json";
import type { ApiKeyStatus } from "../../src/lib/store/secrets";

export function KeyForm({ initial }: { initial: ApiKeyStatus }) {
  const [status, setStatus] = useState(initial);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const { ok, data } = await postJson<ApiKeyStatus & { error?: string }>(
      "/api/key",
      { key }
    );
    if (ok && data) {
      setStatus(data);
      setKey("");
    } else {
      setError(data?.error ?? "Could not save the key.");
    }
    setSaving(false);
  }

  return (
    <section className="panel" aria-labelledby="key-heading">
      <h2 id="key-heading">1. Your Anthropic API key</h2>
      {status.saved ? (
        <p className="status-ok" role="status">
          ✓ Key saved{" "}
          {status.source === "env"
            ? "(from ANTHROPIC_API_KEY on this computer)"
            : "on this computer"}
          .
        </p>
      ) : (
        <p className="muted">
          No key yet. The agent needs one to work. It is stored only on this
          computer.
        </p>
      )}
      <form onSubmit={save}>
        <label htmlFor="api-key">
          {status.saved ? "Replace the key" : "Paste your key"}
        </label>
        <div className="row">
          <input
            id="api-key"
            type="password"
            autoComplete="off"
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save key"}
          </button>
        </div>
      </form>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
