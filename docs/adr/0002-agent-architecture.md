# 0002 — Agent architecture

Status: accepted (2026-11-15)

- **Orchestration:** one LLM orchestrator agent reads the lingyun-project methodology and decides the next step, including stage transitions. (Considered and rejected: code state machine, which would make every gate unskippable; chosen for flexibility and speed of build.)
- **Runtime:** Claude Agent SDK, one isolated sandbox per user project, each with its own git repo.
- **Reviewers:** a fresh agent session per gate (smoke, UI, UX, design, code review). Each gets only the ticket, the diff, the launch command and the gate text, and returns a verdict plus evidence. It never sees the builder's reasoning.

## Known risk

The orchestrator can skip or soften a gate and the non-tech user cannot tell.

## Mitigation (hard blocks live outside the model)

- Merge and deploy are enforced by CI required checks and branch protection on the user's repo, not by the orchestrator.
- Every gate verdict and its evidence is stored and shown to the user in plain language at the approval points.
- Revisit a code state machine if gates are skipped in practice.

Open: stage state persistence, sandbox provider, evidence storage.
