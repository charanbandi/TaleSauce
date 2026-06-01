# TaleSauce 🍅

An 8-bit, **Stardew-Valley-inspired simulator for AI agents**. Each agent is a
pixel-art character that lives in an environment, does ambient "life" actions
when idle, and real work when you give it a task — walking to its workstation to
work, to the front of the stage to **report**, or to **ask you a clarifying
question**. Agents are backed by interchangeable brains: a hosted **OpenClaw**
endpoint today, with a local **Claude Code** session bridge planned for Phase 2.

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
- **Per-agent config.** Brain, model, and (Phase 2) Claude Code session id are
  configurable per agent; up to 6 agents across the two environments.

## Testing

```bash
npm test        # shared + server + web unit tests (Vitest)
```

The bug-prone seams are covered test-first: the OpenClaw SSE/protocol parser,
the agent state machine, the orchestrator's event mapping, the WS event codec,
the SQLite layer, and the client event reducer.

## Roadmap

- **Phase 2:** real local **Claude Code** bridge (Claude Agent SDK, session
  resume, streaming, native clarifying-question/permission surfacing); richer
  office; per-agent brain switching in the UI.
- **Phase 3:** more named characters, richer actions/animations, sound, polish.

## Assets

Farm + character art by **Cup Nooble (Sprout Lands)**; office tiles by
**Kenney** (CC0). See [LICENSES.md](LICENSES.md). Non-commercial project.
