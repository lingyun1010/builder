---
id: P001
title: "Local prototype tracer: API key, project, chat with agent, saved to files"
status: done
blocked_by: []
seam: Chat UI <-> API routes; API routes <-> file store; chat <-> agent runner (Agent SDK)
branch: feat/P001-local-chat
---

See ADR 0008.

**Done when:** With no sign-in, the user saves their Anthropic API key, creates a project, sends a message and sees the agent's reply stream in. The transcript and the Agent SDK session id are saved under `data/`; reloading the page shows the chat and the next message continues the same session. The key is never returned to the browser. Integration tests cover the file store and the chat seam with a fake agent runner.
