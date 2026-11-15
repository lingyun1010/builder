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
- Current stage: Init gate met. Loop: Build -> Pre-PR -> Review -> Merge -> Post-merge, per ticket. Now: P001, then P002 (prototype tickets).

## Standing rules from the user (2026-11-15)

- Turn on Auto-fix for every PR I open (set_monitor with the PR url).
- Merge automatically (squash) once the required check is green and the methodology gates are met (smoke evidence only if behaviour changed). No approval prompt needed for the merge itself.
- After a merge, start the next unblocked ticket automatically, on its own branch feat/<ticket>.
- Never ask whether to hand off. When the handoff hook fires, write the handoff and start a new session that continues from it (orchestrator mode, 2026-11-15).
- Still stop and ask before: creating paid or external resources (Supabase or Vercel projects, domains), handling secrets or keys, force operations, and anything outside the ticket.
