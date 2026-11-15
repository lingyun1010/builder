---
id: T002
title: "Bring your own API key (encrypted)"
status: todo
blocked_by: [T001]
seam: App <-> Postgres (encryption), App <-> Anthropic (validate key)
branch: feat/T002-api-key
---

**Done when:** User saves a key; it is validated, stored encrypted, never returned to the browser; integration test with a stubbed Anthropic call.
