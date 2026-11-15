# 0006 — Autonomy levels (Automatic vs Secure)

Status: proposed (2026-11-15). Refines the autonomy line in ADR 0001.

Users choose how much control they keep. Each level changes where the agent asks for approval and how strict the gates are. It does not change the floor.

## Floor (every level, not configurable)

- The user's API key never enters the sandbox (ADR 0004).
- Merge and deploy are enforced by the required CI check and branch protection, not by the model (ADR 0002).
- No force pushes, no history rewrites, no direct pushes to `main`.
- Every gate verdict needs evidence (ADR 0005).
- The user can always see and stop a run.

## Levels

|                     | Automatic                                   | Balanced (default)                                   | Secure                                                                                 |
| ------------------- | ------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Approvals           | Deploy only                                 | Think decisions, merge, deploy                       | Every stage change, every new dependency, every external action                        |
| Merge               | Auto when CI and gates are green            | User approves                                        | User approves, after a second look at the diff summary                                 |
| Reviewer gates      | Smoke, code review; UI, UX, design optional | Smoke, code review; UI, UX, design asked per feature | All gates mandatory, including security review and UI, UX, design                      |
| New packages        | Allowed                                     | Allowed, listed in the PR                            | Blocked until approved                                                                 |
| Deploy              | Straight to production                      | Production after approval                            | Preview first, then production after approval                                          |
| Database migrations | Applied by the agent                        | Applied after approval                               | Applied after approval, destructive ones need a second explicit confirmation           |
| Egress allowlist    | Default                                     | Default                                              | Narrowed to git remote and model proxy; registry access only through approved packages |

## Where the level lives and who enforces it

- The level is stored in the user's repo as `.builder/policy.json`, so it is versioned and visible (ADR 0003).
- The orchestrator is an LLM, so it cannot enforce its own level. The CI verdict check (ADR 0005) reads the policy and decides which gates are applicable and whether a user approval is recorded. Weaker enforcement than this would let the model skip the policy.
- Lowering the level (for example Secure to Automatic) needs explicit confirmation in chat, is recorded as a commit, and takes effect from the next ticket, never mid-ticket.

## Open questions

- Is a per-ticket override useful (e.g. Secure only for tickets that touch auth or payments), or too confusing for non-tech users?
- Should the agent recommend a level from the project's content (for example Secure when it detects payments or personal data)?
- Naming and wording for non-tech users: "Automatic" and "Secure" may need plainer words.
