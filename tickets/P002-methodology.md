---
id: P002
title: "Local prototype: methodology stages and choice cards"
status: done
blocked_by: [P001]
seam: Agent <-> workspace state (stage file); chat UI <-> choice cards
branch: feat/P002-methodology
---

See ADR 0008. Local version of T006 and T007.

**Done when:** Each project workspace is its own git repo. The agent follows the lingyun-project stages in plain language and records the current stage in a file in the workspace. The chat page shows the stage list with the current one marked. When the agent needs a decision it offers choices the user can click instead of typing. Integration tests cover reading the stage file and parsing choices.
