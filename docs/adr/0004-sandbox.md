# 0004 — Sandbox provider and lifecycle

Status: accepted (2026-11-15)

- **Provider:** Vercel Sandbox. Same vendor as the deploy target; snapshots and network policy available.
- **Lifecycle:** ephemeral per run, restored from a snapshot with dependencies installed. Steps: restore snapshot → pull repo → work → push → destroy. No idle cost; git stays the source of truth (ADR 0003).
- **Secrets and network:** the user's Anthropic API key never enters the sandbox. Model calls go through the Builder backend (proxy). Egress is an allowlist: git remote, package registry, model proxy.

## Unverified assumptions (check in first Build ticket)

- Max session length vs. a long Build run.
- Per-run cost and concurrency limits.
- Snapshot restore time (affects chat latency).
- Fallback if limits fail: E2B behind the same sandbox interface.

Open: evidence storage.
