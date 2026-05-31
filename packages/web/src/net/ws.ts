import { decodeEvent } from "@talesauce/shared";
import { useStore } from "../store/store.js";
import { getAgents } from "./rest.js";

export function connectWs(onStatus: (ok: boolean) => void) {
  let ws: WebSocket;
  let backoff = 500;

  const open = () => {
    ws = new WebSocket(`ws://${location.host}/ws`);
    ws.onopen = async () => {
      onStatus(true);
      backoff = 500;
      // Rehydrate from REST in case we missed events while disconnected.
      try { for (const a of await getAgents()) useStore.getState().ingest({ type: "agent-added", agent: a }); } catch { /* ignore */ }
    };
    ws.onmessage = (m) => { const e = decodeEvent(String(m.data)); if (e) useStore.getState().ingest(e); };
    ws.onclose = () => { onStatus(false); setTimeout(open, backoff); backoff = Math.min(backoff * 2, 8000); };
    ws.onerror = () => ws.close();
  };
  open();
}
