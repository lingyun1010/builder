# 0003 — State persistence

Status: accepted (2026-11-15)

State is split by owner.

## User project state: files in the user's git repo

- `CLAUDE.md` (current stage, rules), `GLOSSARY.md`, `docs/adr/*`, spec, and `.stage` or a stage section in CLAUDE.md.
- **Tickets are markdown files** in `tickets/NNN-slug.md` with frontmatter: `status`, `blocked_by`, `seam`, `branch`. (Chosen over GitHub Issues: no GitHub dependency for planning.)
- Any agent session, including a fresh reviewer, can resume from the repo alone.
- Builder renders a read-only board from the ticket files for the user.

## Builder operational state: Supabase Postgres

- Accounts, encrypted user API key, chat transcript, Agent SDK session id, current run status, gate verdict index (verdict + pointer to evidence).
- Resume: sandbox is rebuilt from the git repo and the SDK session continues from the stored transcript. Idle sandboxes are not kept alive.

## Consequences

- Blocking edges and status are maintained by the agent, not a tracker. A ticket lint in the user's CI fails on a dangling `blocked_by` or invalid `status`.
- No sync problem: git is the single source of truth for project state; the DB holds only run and account data.

Open: sandbox provider, evidence storage.
