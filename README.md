# TaleSauce 🍅

An 8-bit, **Stardew-Valley-inspired simulator for AI agents**. Each agent is a
pixel-art character that lives in an environment, does ambient "life" actions
when idle, and real work when you give it a task — walking to its workstation to
work, to the front of the stage to **report**, or to **ask you a clarifying
question**. Agents are backed by interchangeable brains: a hosted **OpenClaw**
endpoint and a local **Claude Code** session bridge (Phase 2).

![TaleSauce](docs/screenshot-placeholder.png)

> Two environments run side-by-side in a draggable split stage — a **farm**
> (Stardew-style) and an **office**. Drag the divider to rebalance them, click an
> environment to focus it full-screen, click again to unfocus. The dock below
> shows what every agent is doing right now.

## Stack

- **Web:** Vite + React 18 + **Phaser 3** (tilemaps, animated sprites, camera).
- **Server:** Fastify + WebSocket, the `AgentBrain` orchestration, **SQLite** persistence.
- **Shared:** a TypeScript types package that is the WS/REST contract.
- npm-workspaces monorepo, TypeScript throughout, tested with Vitest.

## Run locally

```bash
npm install
cp .env.example .env          # set OPENCLAW_API_KEY (and URL if different)
npm run dev                   # server :8787 + web :5173
```

Open http://localhost:5173.

## How it works

- **Server-authoritative state.** The orchestrator decides each agent's visible
  state (`idle`, `working`, `walking-to-front`, `awaiting-user`, `reporting`, …)
  and streams `ServerEvent`s over WebSocket; the Phaser client just renders them.
- **Pluggable brains.** Every brain implements one `AgentBrain` interface. The
  OpenClaw brain calls an OpenAI-compatible streaming `chat/completions` endpoint
  (key stays server-side) and uses a small system-prompt protocol — the agent
  emits `❓QUESTION: …` to ask you something and `✅DONE: …` to finish — which the
  server turns into the walk-to-front / report character actions.
- **Per-agent config.** Brain, model, and Claude Code session id are
  configurable per agent; up to 6 agents across the two environments.
- **CodingAgentBridge seam.** Coding-agent CLIs sit behind a `CodingAgentBridge`
  interface; Claude Code is wired today (Agent SDK), with Codex/Cursor as future
  drop-ins.

## Brains & onboarding

The app adapts to whichever brains you configure. No agents are seeded until at
least one brain is available; if none are configured, the app shows an onboarding
screen listing the env vars to add.

- **OpenClaw:** set `OPENCLAW_API_URL` + `OPENCLAW_API_KEY` in `.env`.
- **Claude Code:** set `CLAUDE_CODE_ENABLED=true` (uses your local Claude Code
  login) or set `ANTHROPIC_API_KEY`. A Claude Code agent needs a **working
  directory** (the repo it operates on) — set it in the agent's Config panel when
  adding the agent. Risky tools (Bash/Write/Edit) are gated as in-game
  **Allow/Deny** asks: the agent walks to the front of the stage and raises a card
  before executing; read-only tools (Read/Grep/Glob/LS) are auto-approved. You can
  paste a **session id** to resume an existing conversation, or leave it blank to
  start a fresh session (the new id is shown once it starts).

Up to 6 agents total; each agent's brain is configured independently.

## Testing

```bash
npm test        # shared + server + web unit tests (Vitest)
```

The bug-prone seams are covered test-first: the OpenClaw SSE/protocol parser,
the agent state machine, the orchestrator's event mapping, the WS event codec,
the SQLite layer, and the client event reducer.

## Roadmap

- **Phase 2 (done):** local **Claude Code** brain via the Claude Agent SDK —
  per-agent working directory, optional session resume, and **in-game
  tool-permission asks** (the agent walks to the front with an Allow/Deny card
  before running Bash/Write/Edit). Capability-driven onboarding and a furnished
  office.
- **Phase 3:** Codex CLI + Cursor CLI adapters (drop-ins behind the
  `CodingAgentBridge` seam), sound, more characters, richer farm.

## Assets

Farm + character art by **Cup Nooble (Sprout Lands)**; office tiles by
**Kenney** (CC0). See [LICENSES.md](LICENSES.md). Non-commercial project.
