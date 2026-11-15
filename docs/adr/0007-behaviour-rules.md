# 0007 — Behaviour rules: ask once, remember

Status: proposed (2026-11-15). Extends ADR 0006 (autonomy levels).

The agent must not ask the user the same behaviour question twice. When the user answers a question about how the agent should behave (for example "merge automatically", "never add packages without asking", "start the next ticket yourself"), the answer becomes a stored rule, and the agent follows it without asking again.

## What counts as a behaviour rule

A decision about how the agent works, which repeats across tickets: approvals, merge, next ticket, which optional gates to run, package policy. It is not a product decision about the app being built (those stay in the spec and tickets).

## Where rules live

- In the user's repo as `.builder/rules.json`, next to `.builder/policy.json` (ADR 0003, ADR 0006). Versioned, visible, editable by the user in chat.
- Each rule has: `id`, plain-language `text`, `scope` (project), `created` date, and the `question` it answers.
- The agent writes a rule only after the user answers in chat. It confirms the wording once ("I'll remember: ...").

## Rules never override the floor

Rules can only move the project within what the autonomy level allows (ADR 0006). A rule cannot remove the floor (no key in sandbox, no force push, CI-enforced merge, evidence for every verdict). The CI verdict check reads `rules.json` together with `policy.json`; a rule that would exceed the level is ignored and reported.

## Changing and removing

- The user can list, edit or delete rules in chat at any time.
- Lowering strictness (a rule that widens autonomy) follows the same confirmation as lowering the level in ADR 0006: explicit confirmation, recorded as a commit, effective from the next ticket.

## Open questions

- Per-ticket rules vs project-wide only.
- Do rules carry over between a user's projects (account-level defaults)?
- How to show active rules to non-tech users without a wall of text.
