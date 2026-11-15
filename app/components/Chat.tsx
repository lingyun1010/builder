"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ChatEvent } from "../../src/lib/chat/send";
import type { ChatMessage } from "../../src/lib/store/projects";

const WHO: Record<ChatMessage["role"], string> = {
  user: "You",
  assistant: "Builder",
  error: "Problem",
};

const TOOL_LABEL: Record<string, string> = {
  Read: "Reading files",
  Glob: "Looking through the project",
  Grep: "Searching the project",
  Write: "Writing a file",
  Edit: "Changing a file",
  Bash: "Running a command",
};

type Props = {
  projectId: string;
  initialMessages: ChatMessage[];
  hasKey: boolean;
};

export function Chat({ projectId, initialMessages, hasKey }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = streaming !== null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    const before = messages;
    setNotice(null);
    setDraft("");
    setMessages([
      ...before,
      { role: "user", text, at: new Date().toISOString() },
    ]);
    setStreaming("");
    setActivity("Thinking");

    let res: Response;
    try {
      res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch {
      res = new Response(null, { status: 503 });
    }
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null);
      setNotice(data?.error ?? "Could not reach the app. Is it still running?");
      // Nothing was saved: put the message back so it is not lost.
      setMessages(before);
      setDraft(text);
      setStreaming(null);
      setActivity(null);
      return;
    }

    let reply = "";
    let finished = false;
    const handle = (line: string) => {
      if (!line.trim()) return;
      const chatEvent = JSON.parse(line) as ChatEvent;
      if (chatEvent.type === "text") {
        reply += chatEvent.text;
        setStreaming(reply);
        setActivity(null);
      } else if (chatEvent.type === "tool") {
        setActivity(TOOL_LABEL[chatEvent.name] ?? "Working");
      } else if (chatEvent.type === "done") {
        finished = true;
      }
    };

    try {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(handle);
      }
      handle(buffer);
    } catch {
      // Fall through: the saved transcript below is the source of truth.
    }

    // Show exactly what was saved, so a reload looks the same.
    try {
      const saved = await fetch(`/api/projects/${projectId}`).then((r) =>
        r.json()
      );
      if (Array.isArray(saved.messages)) setMessages(saved.messages);
    } catch {
      finished = false;
    }
    if (!finished) {
      setNotice(
        "The connection dropped before the agent finished. Reload to see what was saved."
      );
    }
    setStreaming(null);
    setActivity(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <>
      <div className="chat" aria-live="polite">
        {messages.length === 0 && !busy && (
          <p className="muted">
            Tell Builder what app you want. For example: “A simple page where I
            can save recipes and search them.”
          </p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`msg ${message.role}`}>
            <span className="who">{WHO[message.role]}</span>
            {message.text}
          </div>
        ))}
        {busy && (
          <div className="msg assistant">
            <span className="who">Builder</span>
            {streaming}
            {activity && <div className="activity">{activity}…</div>}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!hasKey && (
        <p className="notice" role="alert">
          Add your Anthropic API key on the <Link href="/">home page</Link>{" "}
          before you send a message.
        </p>
      )}
      {notice && (
        <p className="notice" role="alert">
          {notice}
        </p>
      )}

      <form onSubmit={send} className="panel">
        <label htmlFor="message">Your message</label>
        <div className="row">
          <textarea
            id="message"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe what you want, or answer Builder's question"
          />
          <button type="submit" disabled={busy || !draft.trim()}>
            {busy ? "Working…" : "Send"}
          </button>
        </div>
        <p
          className="muted"
          style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}
        >
          Enter sends. Shift + Enter starts a new line.
        </p>
      </form>
    </>
  );
}
