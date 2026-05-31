# TaleSauce — Phase 1 Design Spec

**Date:** 2026-05-31
**Status:** Approved for planning
**Scope:** Phase 1 of 3 — Foundation + Farm environment + OpenClaw brain, end to end.

---

## 1. Overview

TaleSauce is a locally-run web app that presents a **gamified, 8-bit (Stardew Valley–inspired) simulator for AI agents**. Each agent is an animated pixel-art character living in an environment, performing ambient "life" actions when idle and doing real work when given a task. Agents are backed by interchangeable "brains": a hosted **OpenClaw** chat endpoint, or (Phase 2) a local **Claude Code** session. When an agent finishes a task it walks to the front of the stage and reports; when it needs input it walks up and asks a clarifying question.

This spec covers **Phase 1** only — a complete, polished vertical slice: the **farm** environment, the **OpenClaw** brain wired live, the full agent lifecycle (idle → work → clarify → report), the split/focus stage UI, per-agent config, and local persistence. The **office** environment exists as a minimal second stage, and the Claude Code brain exists as an interface with a disabled UI, both completed in Phase 2.

### Goals
- One environment (farm) and one brain (OpenClaw) that feel **bang-on**: real tilemap art, smooth sprite animations, lively ambient behavior.
- The complete task lifecycle working over a live OpenClaw connection, including mid-task clarifying questions and final reports surfaced through character animation.
- A clean, public-portfolio-quality repo: licensed CC0 assets with attribution, `.env`-based secrets, README, and a tested core.
- Architecture that lets Phase 2 drop in the Claude Code brain and a rich office with no rework.

### Non-goals (Phase 1)
- Real Claude Code bridge (interface + disabled UI only) — Phase 2.
- Rich office environment, agents roaming between environments, sound — Phase 2/3.
- Auth, multi-user, cloud deploy, Eazo platform integration. TaleSauce is local-first and single-user.

---

## 2. Decisions (resolved during brainstorming)

| Decision | Choice |
|---|---|
| Art source | Curated **CC0 asset packs** (e.g. Sprout Lands–style farm, modern office interior, CC0 character bases). Attributed in `LICENSES.md`. |
| Agent brains | **OpenClaw live in Phase 1**; Claude Code interface present but UI disabled until Phase 2. |
| Brain ↔ environment | **Independent & configurable** per agent. Sensible defaults (farm→OpenClaw lifestyle, office→Claude Code) but nothing hard-locked. |
| Layout | **Split stage** with a **draggable divider**; **click an environment to focus** (expand to full), **unfocus** to return to split with both running. **Task dock below** shows per-agent activity summaries. |
| Stack | **Vite + React + Phaser 3** (frontend) · **Fastify + WebSocket** (backend) · **TypeScript** throughout · monorepo with a **shared types** package. |
| Persistence | **SQLite** via `better-sqlite3` (file-based, zero-setup). |
| State authority | **Server-authoritative.** Orchestrator decides each agent's visible state; the client renders it. |
| Movement | **easystar.js** grid pathfinding over the tilemap collision layer, behind a small movement interface. |
| Clarify/complete protocol (OpenClaw) | System-prompt protocol: agent emits `❓QUESTION: …` to ask and `✅DONE: <summary>` to finish; brain parses these to drive states. End-of-stream fallback prevents hangs. |
| Max agents | 6 total (across both environments). |

---

## 3. Architecture

```
┌─────────────────────────── Browser ───────────────────────────┐
│  React app shell (UI chrome)                                   │
│   • draggable split / focus-unfocus stage                      │
│   • per-agent config panel, chat, task dock (live summaries)   │
│  Phaser 3 game canvas (one Scene per environment)              │
│   • tilemaps from CC0 packs, animated sprites, camera, depth   │
│   • agent state machine drives walk → action → work → report   │
└───────────────▲───────────────────────────────▲───────────────┘
                │  WebSocket (stream tokens, state, questions)
                │  REST (config, agents, history)
┌───────────────┴───────────────── Node backend (Fastify) ──────┐
│  AgentBrain interface  ── pick per agent ──┐                   │
│    • OpenClawBrain  → proxies the endpoint (key stays server)  │
│    • ClaudeCodeBrain → interface only in P1 (real in P2)       │
│  Task orchestrator + SQLite (agents, config, conversation log) │
└────────────────────────────────────────────────────────────────┘
```

**Principles**
- **`shared` is the contract.** Both frontend and backend import the same event/state types, so every `ServerEvent` is type-checked on both ends.
- **Phaser never touches the network.** The game reads a plain agent-state store updated by the `net` layer from WS events. The renderer is isolated and the network logic is Phaser-free.
- **The `AgentBrain` interface is the seam.** Swapping OpenClaw ↔ Claude Code is constructing a different implementation; the orchestrator is provider-agnostic.

---

## 4. Repo structure

```
TaleSauce/
├─ package.json            # workspaces + root scripts (dev runs web + server)
├─ .env.example            # OpenClaw key, default models, ports
├─ .gitignore              # node_modules, .env, *.sqlite, .superpowers/, dist
├─ README.md               # overview, setup, screenshots
├─ LICENSES.md             # CC0 asset attributions + source links
├─ packages/
│  ├─ shared/
│  │  └─ src/index.ts       # AgentState, ServerEvent, ClientCommand, BrainKind, types
│  ├─ server/
│  │  └─ src/
│  │     ├─ index.ts            # bootstrap, REST + WS upgrade
│  │     ├─ brains/
│  │     │   ├─ AgentBrain.ts        # interface
│  │     │   ├─ OpenClawBrain.ts     # live (Phase 1)
│  │     │   └─ ClaudeCodeBrain.ts   # interface stub (Phase 1), real (Phase 2)
│  │     ├─ orchestrator.ts     # agents↔brains, task lifecycle, activity summaries
│  │     ├─ db/                 # better-sqlite3: schema, queries, seed
│  │     └─ routes/             # REST: /agents, /config, /history
│  └─ web/
│     └─ src/
│        ├─ main.tsx
│        ├─ app/                # StageSplit, FocusController, DraggableDivider, TopBar
│        ├─ panels/             # ChatPanel, AgentConfigPanel, TaskDock
│        ├─ game/
│        │   ├─ PhaserMount.tsx
│        │   ├─ scenes/FarmScene.ts, OfficeScene.ts
│        │   ├─ AgentSprite.ts        # animation + state-machine driver
│        │   ├─ stateMachine.ts       # pure reducer (testable, Phaser-free)
│        │   ├─ ActionSystem.ts       # ActionSpots + interactions
│        │   ├─ movement.ts           # MovementProvider interface + easystar impl
│        │   └─ assets/manifest.ts    # tileset/spritesheet keys + sources
│        ├─ net/                # WS client, REST client, event reducer → store
│        └─ store/             # agent-state store (zustand or similar)
└─ assets/                     # processed CC0 tilesets/spritesheets (committed, attributed)
```

---

## 5. Game: rendering, state machine & actions

### 5.1 Rendering (Phaser 3)
- Each environment is a **Phaser tilemap** from CC0 packs. Layer order: ground → terrain/water → objects-below → **agents (depth-sorted by Y)** → objects-above (e.g. tree canopy) → overlay FX.
- The React stage hosts **two Phaser scenes** (FarmScene, OfficeScene) in resizable containers. The slider resizes containers; Phaser `Scale.RESIZE` reflows. Focus animates one container to full and the other to 0; unfocus reverses. A scene whose width ≈ 0 is **paused** to save CPU.
- Agents are **sprite-sheets** with named animations: `idle`, `walk-{down,up,left,right}`, and action anims (`water`, `dig`, `sit`, `type`, `shower`, `swim`, `sleep`, `watch`, `wave`). A speech/emote bubble sprite sits above the agent for thinking/typing/question states.

### 5.2 Agent state machine (server-authoritative; rendered client-side)

States: `IDLE`, `GO_TO_WORKSTATION`, `WORKING`, `WALK_TO_FRONT`, `AWAIT_USER`, `REPORT`, `ERROR`.

```
        ┌──────── IDLE/WANDER ◄───────────────────────┐
        │   (pick random idle ActionSpot or stroll)    │
 task   ▼                                              │ report delivered
arrives ├──► GO_TO_WORKSTATION ──► WORKING ────────────┤
        │   (pathfind to desk/    (work anim + brain   │
        │    plot/etc.)            streaming)          │
        │                              │               │
        │                  needs input ▼               │
        │                        WALK_TO_FRONT ──► AWAIT_USER
        │                        (raise hand,           (question bubble,
        │                         wave at camera)        chat opens)
        │              task complete   ▲   │ user replies│
        │                              │   └─────────────┘
        └──── WALK_TO_FRONT ──► REPORT (deliver result at front) ──► IDLE
        ERROR: any state → return to IDLE with "!" bubble
```

- The **orchestrator emits `state` events**; the client sprite plays the matching animation/movement. Brain **content tokens stream in parallel** into chat/bubble. The visual always reflects what the agent is actually doing.
- `stateMachine.ts` is a **pure reducer** (`(state, event) → state`) with no Phaser dependency, so transitions are unit-testable. `AgentSprite` consumes its output to drive animation and movement.

### 5.3 Movement
- `MovementProvider` interface with an **easystar.js** grid-A* implementation over the tilemap collision layer. Targets: workstation tile, front-of-stage marker, or a random wander tile. Interface lets us swap to tween-to-point later if needed.

### 5.4 Action system
- An environment defines **`ActionSpots`**: `{ tile, animation, propFx?, label }`. When `IDLE`, an agent picks a valid `idleAction` from its character data, walks to the matching spot, and performs it (ambient life). For a real task it walks to its **primary workstation** for its role and loops the `working` animation while the brain runs.
- **Farm ActionSpots:** garden plot (`water`/`dig` + sparkle), shower (`shower` + steam), pond (`swim`), path (stroll/wander), **couch (`watch` TV + screen glow)**, **bed (`sleep` + Zzz bubble)**.
- **Office ActionSpots:** desk+computer (`type` + screen glow = primary work), whiteboard, coffee machine, **couch (chill)**, **desk/couch (`watch` YouTube + video glow)**, **wander the office**.
- **Character data** (per agent, like the demo): `name`, `role/skill`, `personality`, `speakingStyle`, `appearance`, `idleActions[]`, `workAnimation`. Phase 1 ships **one named farm agent** (does chores) and **one office agent** (works at a desk), with capacity for 6.

---

## 6. Brains & orchestration

### 6.1 `AgentBrain` interface
```ts
interface AgentBrain {
  start(task: string): void;     // begin working a task
  send(userReply: string): void; // answer a clarifying question
  stop(): void;
  // Emits events consumed by the orchestrator:
  //  'token'    → streamed text chunk
  //  'state'    → working | needs-input | reporting | done | error
  //  'question' → clarifying-question text (drives WALK_TO_FRONT → AWAIT_USER)
  //  'result'   → final summary (drives REPORT)
}
```

### 6.2 OpenClawBrain (live, Phase 1)
- Wraps the OpenClaw endpoint (OpenAI-compatible **streaming `chat/completions`**). The bearer key is read from `.env` **server-side only** and never sent to the browser.
- Builds the messages array from the agent's **system prompt (personality + protocol instructions)** plus conversation history loaded from SQLite.
- **Model selection:** a higher-reasoning model/params for explicit user tasks; a lighter model for idle ambient chatter. Configurable per agent (`model` field), with `.env` defaults.
- **Clarify/complete protocol:** the system prompt instructs the model to emit `❓QUESTION: <text>` when it needs input and `✅DONE: <summary>` when finished. The brain parses the stream for these markers to emit `question` / `result` (and thus the WALK_TO_FRONT / REPORT animations). **Fallback:** if the stream ends without `✅DONE:`, the accumulated text is treated as an implicit `result`, so the agent never hangs in `WORKING`. Malformed SSE lines are skipped.

### 6.3 ClaudeCodeBrain (interface only, Phase 1)
- Implements `AgentBrain` but throws/returns a "Phase 2" notice if invoked. Present so the orchestrator and config UI are already wired for it. Real implementation (Claude Agent SDK, `resume(sessionId)`, streaming, native permission/clarification surfacing) lands in Phase 2.

### 6.4 Orchestrator
- Owns the in-memory registry of agents; constructs the correct brain per agent config; maps **brain events → server-authoritative `ServerEvent`s** broadcast over WS.
- Persists every message to SQLite.
- Maintains a short **rolling activity summary** per agent (`"Watering the tomatoes"`, `"Working: drafting release notes…"`, `"Waiting on your answer"`) pushed over WS for the task dock.

### 6.5 Task data flow
```
User types task in ChatPanel
  → REST POST /agents/:id/task
    → orchestrator.start(): brain.start(task); emit state=working
      → WS {state:'working'} ............ client: agent walks to workstation, work anim
      → WS {token:'…'} (stream) ......... client: chat panel + dock summary update live
      → brain 'question' ................ WS {state:'needs-input', question}
                                          client: WALK_TO_FRONT, raise hand, bubble
      → user replies → POST /agents/:id/reply → brain.send()
      → brain 'result' .................. WS {state:'reporting', result}
                                          client: agent delivers summary at front → IDLE
```

---

## 7. Persistence (SQLite via better-sqlite3)

Tables:
- **`agents`** — `id, name, environment, brain_kind, model, session_id, personality (json), pos_x, pos_y, created_at`
- **`messages`** — `id, agent_id, role, content, kind (chat|task|question|result), created_at`
- **`settings`** — singleton row: defaults, last layout/slider position, last focus state

On startup the server **seeds two default agents** (one farm, one office) if `agents` is empty. The client hydrates from `GET /agents` and `GET /agents/:id/history`.

---

## 8. UI shell (React)

```
┌───────────────────────────────────────────────────────────┐
│  Top bar: TaleSauce · [+ Add agent] · settings · status dot │
├──────────────────────────────┬────────────────────────────┤
│   FARM  (Phaser canvas)      ║│   OFFICE (Phaser canvas)    │  ← draggable
│   click → focus / unfocus    ║│   click → focus / unfocus   │     divider
├──────────────────────────────┴────────────────────────────┤
│  TASK DOCK: per-agent rows — avatar · name · "current       │
│  activity…" · state chip (idle/working/waiting/reporting)   │
└─────────────────────────────────────────────────────────────┘
   ChatPanel + AgentConfigPanel slide in from the right when an
   agent is selected.
```

- **Draggable divider** rebalances farm/office width; persisted to `settings`.
- **Focus:** click a scene → animates to full; other collapses (and pauses). An **unfocus** affordance returns to the split with both running.
- **Selecting an agent** (sprite click or dock row) opens the right panel: **Chat tab** (history + task input) and **Config tab** (name, environment, brain kind, model, Claude Code session id — CC fields visible but **disabled with a "Phase 2" tooltip** in v1, personality).
- **Add agent** up to **6 total**: choose environment + brain + character template.
- **Status dot** reflects WS connection health.

---

## 9. Error handling

- **OpenClaw unreachable / 5xx / timeout:** brain emits `state:'error'`; agent returns to `IDLE` with a small "!" bubble; chat shows a friendly retry message. No crash, no stuck sprite.
- **WebSocket drops:** client auto-reconnects with backoff and re-hydrates state from REST; status dot reflects health.
- **Malformed stream lines:** skipped.
- **Missing protocol marker:** end-of-stream fallback treats accumulated text as the result, so the agent never hangs in `WORKING`.
- **Asset load failure:** Phaser shows a placeholder tile and logs the failed asset key; a missing sprite never blanks the scene.

---

## 10. Testing strategy

- **shared:** unit tests for event encoders/decoders (the WS contract) and type-level checks.
- **server:** unit-test `OpenClawBrain` against a **mocked SSE stream** — including `❓QUESTION:` / `✅DONE:` parsing and the missing-marker fallback; unit-test orchestrator brain-event → `ServerEvent` mapping; DB query tests against in-memory SQLite.
- **web/game:** unit-test the **agent state machine** as a pure reducer (events → transitions) and the **net-event reducer** that updates the store, both independent of Phaser. Phaser rendering is verified by running the app, not unit-tested.
- **TDD where it pays:** the OpenClaw protocol parser, the state machine, and the WS event contract are the bug-prone seams — written test-first.

---

## 11. Configuration & secrets

`.env` (gitignored) / `.env.example` (committed):
- `OPENCLAW_API_URL` — endpoint base
- `OPENCLAW_API_KEY` — bearer token (server-side only)
- `OPENCLAW_TASK_MODEL` / `OPENCLAW_IDLE_MODEL` — default high-reasoning vs light models
- `SERVER_PORT`, `WEB_PORT`
- `DB_PATH` — SQLite file location (default `./talesauce.sqlite`)

The browser never receives the key; all OpenClaw calls are proxied through the server.

---

## 12. Deliverables (Phase 1 done = all of these)

1. Monorepo scaffold (`shared`, `server`, `web`) with root `dev` script running both; `.gitignore`, `.env.example`.
2. CC0 farm tileset + character spritesheets sourced, processed, committed, and attributed in `LICENSES.md`.
3. Farm Phaser scene rendering with tilemap, depth sorting, and ActionSpots (incl. couch/TV and bed/sleep).
4. Minimal office Phaser scene (so split/focus is real) with at least the desk workstation.
5. Split stage with draggable divider, focus/unfocus, persisted layout; task dock with live activity summaries.
6. Agent state machine (pure reducer) + `AgentSprite` driving animation & easystar movement.
7. `AgentBrain` interface; live `OpenClawBrain` with streaming + protocol parsing + fallback; `ClaudeCodeBrain` interface stub.
8. Orchestrator with full task lifecycle over WS; SQLite persistence + seed; REST routes.
9. React shell: top bar, chat panel, agent config panel (CC fields disabled), add-agent up to 6.
10. Error handling per §9; WS reconnect.
11. Tests per §10 passing.
12. README with setup steps + screenshot placeholders.

---

## 13. Phase 2 / 3 preview (not built now)

- **Phase 2:** Real `ClaudeCodeBrain` via Claude Agent SDK (session resume, streaming, native clarifying-question/permission surfacing); rich office environment + desk/terminal actions; enable the CC config fields.
- **Phase 3:** More named characters; richer actions/animations; sound; tuning for up to 6 concurrent agents; screenshot/README polish pass.
