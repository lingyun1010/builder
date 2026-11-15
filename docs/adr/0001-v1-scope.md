# 0001 — v1 scope

Status: accepted (2026-11-15)

Builder is a hosted web app. A non-technical "vibe coder" chats with an agent; the agent runs the lingyun-project stages (Init → Think → Map → Slice → Build → Pre-PR → Review → Merge → Post-merge) on their behalf.

- **Form factor:** hosted web app (chat UI, agent runs in cloud sandboxes).
- **Output:** web apps on Next.js + Supabase + Vercel only. One opinionated stack so gates (smoke test, RLS review) are well defined.
- **Autonomy:** agent runs automatically; user approves in plain language at key gates: Think decisions, before Merge, before deploy.
- **Billing:** user brings own Anthropic API key in v1. No payments or quotas.

Open: sandbox provider, how stage state is persisted, how review subagents are isolated.
