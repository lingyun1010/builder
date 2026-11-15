"use client";

import { useState, type FormEvent } from "react";
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
    try {
      const res = await fetch("/api/key", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not save the key.");
      else {
        setStatus(data);
        setKey("");
      }
    } catch {
      setError("Could not reach the app. Is it still running?");
    } finally {
      setSaving(false);
    }
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
