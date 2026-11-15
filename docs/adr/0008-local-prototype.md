# 0008 — Local prototype first

Status: accepted (2026-11-15). Narrows ADR 0001, 0003 and 0004 for the prototype only.

The user asked for one working prototype before any hosted work: no sign-in or sign-up, no Supabase, no Vercel, no deployment, their own Anthropic API key, and data saved locally in the repo folder.

## Decisions

- **Runs on the user's machine only.** `pnpm dev` binds to 127.0.0.1. There are no accounts. API routes reject requests whose Host or Origin is not local, because there is no login to stop another website from calling them.
- **Data is files under `data/`** (override with `BUILDER_DATA_DIR`). `data/` is gitignored because it holds the API key and chat transcripts.
  - `data/secrets.json` — the Anthropic API key, file mode 600. It is never sent back to the browser. `ANTHROPIC_API_KEY` in the environment is used when no key is saved.
  - `data/projects/<id>/project.json` — name, created date, Agent SDK session id.
  - `data/projects/<id>/transcript.jsonl` — one chat message per line.
  - `data/projects/<id>/workspace/` — the user project the agent works in. Project state stays in this folder as files, as ADR 0003 says (stage file, ADRs, tickets).
- **Agent runtime:** Claude Agent SDK (ADR 0002), started locally with the project workspace as its working directory. It does not load the machine's own Claude settings.
- **Isolation instead of a cloud sandbox:** the Agent SDK command sandbox is on, file edits are accepted only inside the workspace, and every other permission request is denied.

## Known gaps against earlier ADRs (accepted for the prototype)

- ADR 0004 says the API key never enters the sandbox. Here the agent process receives the key in its environment. Acceptable only because the machine and the key belong to the same person.
- No fresh-reviewer sessions per gate, no CI evidence gate, no deploy (ADR 0002, 0005). The agent follows the methodology from its instructions; nothing outside the model enforces a gate.
- One user, one run per project at a time.

## Tickets

- New: P001 (local chat tracer), P002 (methodology stages and choice cards).
- Deferred until hosted work resumes: T001–T004 and T013–T014. The magic-link sign-in work for T001 is parked on the local branch `feat/T001-skeleton`, not merged.
- T005–T012 stay as the hosted versions of what P001 and P002 prove locally.
