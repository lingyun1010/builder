---
id: T011
title: "Required CI check backed by Builder verdict API"
status: todo
blocked_by: [T010]
seam: User CI <-> Builder API; branch protection
branch: feat/T011-ci-evidence-gate
---

**Done when:** Required check passes only if all applicable gates passed for the PR head commit; fails closed when Builder is unreachable; branch protection set on repo.
