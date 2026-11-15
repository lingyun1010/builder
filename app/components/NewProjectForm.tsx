"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create the project.");
        setCreating(false);
        return;
      }
      router.push(`/projects/${data.project.id}`);
    } catch {
      setError("Could not reach the app. Is it still running?");
      setCreating(false);
    }
  }

  return (
    <form onSubmit={create}>
      <label htmlFor="project-name">Name your app</label>
      <div className="row">
        <input
          id="project-name"
          placeholder="For example: Recipe box"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
        <button type="submit" disabled={creating}>
          {creating ? "Creating…" : "Start project"}
        </button>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
