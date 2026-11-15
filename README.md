# Builder (local prototype)

Describe the app you want and chat with an agent that builds it. This prototype runs only on your computer: no sign-in, no cloud database, no deployment. See [docs/adr/0008-local-prototype.md](docs/adr/0008-local-prototype.md).

## Run it

```bash
pnpm install
pnpm dev
```

Open the address it prints (usually http://localhost:3000), then:

1. Paste your Anthropic API key and save it. It is stored in `data/secrets.json` on this computer and never shown again. (Or set `ANTHROPIC_API_KEY` in `.env.local`.)
2. Name a project and start it.
3. Chat. The agent works in `data/projects/<id>/workspace/`.

Everything the app saves is under `data/`, which git ignores. Delete that folder to start over.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Settings

- `BUILDER_MODEL` — model the agent uses (default `claude-opus-5-5`).
- `BUILDER_DATA_DIR` — where data is saved (default `./data`).
