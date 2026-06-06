import { create } from "zustand";
import type { ServerEvent } from "@talesauce/shared";
import { applyEvent, initialState, type AppState, type ChatMessage } from "../net/reducer.js";

export type Focus = "farm" | "office" | null;

interface Store extends AppState {
  selectedId: string | null;
  focus: Focus;                 // which environment is shown solo (null = both)
  soundEnv: "farm" | "office";  // which environment's ambient plays
  ingest: (e: ServerEvent) => void;
  select: (id: string | null) => void;
  setFocus: (f: Focus) => void;
  setSoundEnv: (e: "farm" | "office") => void;
  setHistory: (id: string, msgs: ChatMessage[]) => void;
  pushMessage: (id: string, msg: ChatMessage) => void;
}

export const useStore = create<Store>((set) => ({
  ...initialState(),
  selectedId: null,
  focus: null,
  soundEnv: "office",
  ingest: (e) => set((s) => {
    const ns = applyEvent(s, e);
    // Deselect a removed agent so the chat drawer closes.
    if (e.type === "agent-removed" && s.selectedId === e.agentId) return { ...ns, selectedId: null };
    return ns;
  }),
  select: (id) => set((s) => ({
    selectedId: id,
    soundEnv: id && s.agents[id] ? s.agents[id].config.environment : s.soundEnv,
  })),
  setFocus: (f) => set(f ? { focus: f, soundEnv: f } : { focus: f }),
  setSoundEnv: (e) => set({ soundEnv: e }),
  setHistory: (id, msgs) => set((s) => ({ messages: { ...s.messages, [id]: msgs } })),
  pushMessage: (id, msg) => set((s) => ({ messages: { ...s.messages, [id]: [...(s.messages[id] ?? []), msg] } })),
}));
