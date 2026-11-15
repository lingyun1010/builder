# Builder

Hosted web app that lets non-technical users build apps by chatting with an agent that runs the lingyun-project methodology (stages and gates in ~/.claude/skills/lingyun-project). See docs/adr/0001-v1-scope.md.

## Rules

- Follow lingyun-project: never advance past a red gate; one ticket = one branch = one PR.
- Stack for Builder itself: Next.js + Supabase + Vercel (same as the stack it generates). Package manager: pnpm.
- Architecture: see docs/adr/0002-agent-architecture.md (LLM orchestrator, Agent SDK sandbox per project, fresh reviewer per gate).
- State: see docs/adr/0003-state-persistence.md (project state in git, tickets as markdown, Builder ops state in Supabase).
- Sandbox: see docs/adr/0004-sandbox.md (Vercel Sandbox, ephemeral from snapshot, API key outside, egress allowlist).
- Evidence: see docs/adr/0005-evidence-storage.md (evidence/pr-N branch, CI calls Builder API, 90-day retention).
- Current stage: Init gate met except a green PR (this PR). Next: Build T001 on feat/T001-skeleton.
- Guardrail (.claude/hooks/block-dangerous-git.sh): the agent may only push a feat/<branch> to origin, with an optional -u. Force pushes, main and any other branch are blocked.
- Automation hooks from lingyun-project (stage nudges, pre-PR, pre-merge): not chosen yet; offer once.
