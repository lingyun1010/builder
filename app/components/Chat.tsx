"use client";

import Link from "next/link";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { StageList } from "./StageList";
import { UNREACHABLE } from "./post-json";
import { hideTrailingChoices, parseChoices } from "../../src/lib/chat/choices";
import type { Stage } from "../../src/stages";
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

const MessageList = memo(function MessageList({
  messages,
}: {
  messages: ChatMessage[];
}) {
  return messages.map((message, index) => (
    <div key={index} className={`msg ${message.role}`}>
      <span className="who">{WHO[message.role]}</span>
      {message.role === "assistant"
        ? parseChoices(message.text).text
        : message.text}
    </div>
  ));
});

type Props = {
  projectId: string;
  initialMessages: ChatMessage[];
  hasKey: boolean;
  initialStage: Stage;
};

export function Chat({
  projectId,
  initialMessages,
  hasKey,
  initialStage,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [stage, setStage] = useState(initialStage);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = streaming !== null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // While a reply streams, scroll at most once per frame.
  useEffect(() => {
    if (streaming === null) return;
    const frame = requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ block: "end" })
    );
    return () => cancelAnimationFrame(frame);
  }, [streaming]);

  // `fromDraft`: the text came from the box, so the box is cleared (and refilled on failure).
  async function send(raw: string, fromDraft = false) {
    const text = raw.trim();
    if (!text || busy) return;

    const before = messages;
    setNotice(null);
    if (fromDraft) setDraft("");
    setMessages([
      ...before,
      { role: "user", text, at: new Date().toISOString() },
    ]);
    setStreaming("");
    setActivity("Thinking");

    try {
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
        setNotice(data?.error ?? UNREACHABLE);
        // Nothing was saved: put the message back so it is not lost.
        setMessages(before);
        if (fromDraft) setDraft(text);
        return;
      }

      let reply = "";
      let saved: ChatMessage[] | null = null;
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
          saved = chatEvent.messages;
          setStage(chatEvent.stage);
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

      if (saved) {
        setMessages([...before, ...(saved as ChatMessage[])]);
      } else {
        // The stream dropped: show whatever was saved.
        try {
          const data = await fetch(`/api/projects/${projectId}`).then((r) =>
            r.json()
          );
          if (Array.isArray(data.messages)) setMessages(data.messages);
          if (data.stage) setStage(data.stage);
        } catch {
          // Keep what is on screen.
        }
        setNotice(
          "The connection dropped before the agent finished. Reload to see what was saved."
        );
      }
    } finally {
      setStreaming(null);
      setActivity(null);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void send(draft, true);
    }
  }

  const last = messages.at(-1);
  const choices =
    !busy && last?.role === "assistant" ? parseChoices(last.text).choices : [];

  return (
    <>
      <StageList current={stage} />
      <div className="chat" aria-live="polite">
        {messages.length === 0 && !busy && (
          <p className="muted">
            Tell Builder what app you want. For example: “A simple page where I
            can save recipes and search them.”
          </p>
        )}
        <MessageList messages={messages} />
        {busy && (
          <div className="msg assistant">
            <span className="who">{WHO.assistant}</span>
            {hideTrailingChoices(streaming)}
            {activity && <div className="activity">{activity}…</div>}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {choices.length > 0 && (
        <div className="choices" role="group" aria-label="Quick answers">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => void send(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

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

      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void send(draft, true);
        }}
        className="panel"
      >
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
        <p className="muted hint">
          Enter sends. Shift + Enter starts a new line.
        </p>
      </form>
    </>
  );
}
