import { create } from "zustand";
import type { ServerEvent } from "@talesauce/shared";
import { applyEvent, initialState, type AppState, type ChatMessage } from "../net/reducer.js";

interface Store extends AppState {
  selectedId: string | null;
  ingest: (e: ServerEvent) => void;
  select: (id: string | null) => void;
  setHistory: (id: string, msgs: ChatMessage[]) => void;
  pushMessage: (id: string, msg: ChatMessage) => void;
}

export const useStore = create<Store>((set) => ({
  ...initialState(),
  selectedId: null,
  ingest: (e) => set((s) => applyEvent(s, e)),
  select: (id) => set({ selectedId: id }),
  setHistory: (id, msgs) => set((s) => ({ messages: { ...s.messages, [id]: msgs } })),
  pushMessage: (id, msg) => set((s) => ({ messages: { ...s.messages, [id]: [...(s.messages[id] ?? []), msg] } })),
}));
