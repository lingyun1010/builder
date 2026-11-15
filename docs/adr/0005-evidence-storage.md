# 0005 — Evidence storage

Status: accepted (2026-11-15)

- **Storage:** evidence files (screenshots, command output, verdict JSON) are committed to the user's repo, on a dedicated branch `evidence/pr-<N>` that is never merged into `main`. This keeps them with the user but out of `main` history.
- **Retention:** until the PR is merged plus 90 days. Builder then deletes the `evidence/pr-<N>` branch. (Resolves the conflict between "commit to repo" and a bounded retention: committing to `main` would be permanent.)
- **CI check:** a required CI job calls the Builder API to confirm every applicable gate has a passing verdict for the PR head commit. Fail-closed: if Builder is unreachable, the check fails and the merge waits.
- The PR body carries a short human-readable summary of each verdict with links to the evidence files.

## Consequences

- Builder is an availability dependency of every merge. Revisit (e.g. CI reads the evidence branch directly) if outages bite.
- Screenshots may contain user data; the 90-day deletion bounds exposure but they are readable by anyone with repo access.

Think questions: all answered.
