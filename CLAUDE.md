# Builder

Hosted web app that lets non-technical users build apps by chatting with an agent that runs the lingyun-project methodology (stages and gates in ~/.claude/skills/lingyun-project). See docs/adr/0001-v1-scope.md.

## Rules

- Follow lingyun-project: never advance past a red gate; one ticket = one branch = one PR.
- Stack for Builder itself: Next.js + Supabase + Vercel (same as the stack it generates). Package manager: pnpm.
- Prototype first: see docs/adr/0008-local-prototype.md (local only, no sign-in, no Supabase or Vercel, data in files under data/, user's own API key). Hosted tickets T001-T004, T013, T014 are deferred.
- Architecture: see docs/adr/0002-agent-architecture.md (LLM orchestrator, Agent SDK sandbox per project, fresh reviewer per gate).
- State: see docs/adr/0003-state-persistence.md (project state in git, tickets as markdown, Builder ops state in Supabase).
- Sandbox: see docs/adr/0004-sandbox.md (Vercel Sandbox, ephemeral from snapshot, API key outside, egress allowlist).
- Evidence: see docs/adr/0005-evidence-storage.md (evidence/pr-N branch, CI calls Builder API, 90-day retention).
- Guardrail (.claude/hooks/block-dangerous-git.sh): the agent may only push a feat/<branch> to origin, with an optional -u. Force pushes, main and any other branch are blocked.
- Automation hooks from lingyun-project (stage nudges, pre-PR, pre-merge): not chosen yet; offer once.
- Current stage: Post-merge for the local prototype. P001 (chat tracer) is merged and P002 (methodology stages, choice cards) is merged (PR #5); both tickets are done. Next: the user pastes their API key and tries it (the happy path with a real key has not been run). Hosted tickets T001-T004, T013, T014 stay deferred.

## Standing rules from the user (2026-11-15)

- Turn on Auto-fix for every PR I open (set_monitor with the PR url).
- Merge automatically (squash) once the required check is green and the methodology gates are met (smoke evidence only if behaviour changed). No approval prompt needed for the merge itself.
- After a merge, start the next unblocked ticket automatically, on its own branch feat/<ticket>.
- Never ask whether to hand off. When the handoff hook fires, write the handoff and start a new session that continues from it (orchestrator mode, 2026-11-15).
  - Fallback: the app refuses `start_session` on automated turns (turns started by another session or an event). If it refuses, do not stop and do not wait: keep working in the same session until the task is done, and say so in the final report.
  - When the work a handoff describes is finished (or was finished in the same session), delete `.claude/handoff.md` (it is gitignored) so the next session does not load a stale goal. Before acting on any handoff, check git and PR state first.
- Still stop and ask before: creating paid or external resources (Supabase or Vercel projects, domains), handling secrets or keys, force operations, and anything outside the ticket.
