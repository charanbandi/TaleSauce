import { useEffect, useState } from "react";
import { useStore } from "../store/store.js";
import { muteStore } from "../game/muteStore.js";
import { resetAgents } from "../net/rest.js";

const PULSE_KEYFRAMES = `@keyframes pulseGreen { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`;

export function TopBar({ wsOk, onAdd }: { wsOk: boolean; onAdd: () => void }) {
  const count = Object.keys(useStore((s) => s.agents)).length;
  const select = useStore((s) => s.select);
  const [muted, setMuted] = useState(muteStore.muted);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => muteStore.subscribe(setMuted), []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 12px", background: "#241a14", color: "#fff", fontFamily: "monospace",
    }}>
      <style>{PULSE_KEYFRAMES}</style>
      <strong style={{ fontSize: 15, letterSpacing: 1 }}>TaleSauce</strong>
      <button onClick={onAdd} disabled={count >= 6}>+ Add agent ({count}/6)</button>
      {!confirmReset ? (
        <button onClick={() => setConfirmReset(true)} disabled={count === 0}
          title="Delete all agents and start from scratch">↺ Reset</button>
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <span style={{ color: "#fca5a5" }}>Delete all {count} agents?</span>
          <button onClick={async () => { await resetAgents(); select(null); setConfirmReset(false); }}
            style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>Yes, reset</button>
          <button onClick={() => setConfirmReset(false)}>Cancel</button>
        </span>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => muteStore.toggle()}
          title={muted ? "Unmute" : "Mute"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#fff", padding: "0 4px" }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: wsOk ? "#4ade80" : "#6b7280",
            display: "inline-block",
            animation: wsOk ? "pulseGreen 2s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 11, opacity: 0.7 }}>{wsOk ? "live" : "reconnecting…"}</span>
        </span>
      </div>
    </div>
  );
}
