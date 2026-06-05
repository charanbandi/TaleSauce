import { useEffect, useState } from "react";
import { useStore } from "../store/store.js";
import { muteStore } from "../game/muteStore.js";

export function TopBar({ wsOk, onAdd }: { wsOk: boolean; onAdd: () => void }) {
  const count = Object.keys(useStore((s) => s.agents)).length;
  const [muted, setMuted] = useState(muteStore.muted);

  useEffect(() => muteStore.subscribe(setMuted), []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 12px", background: "#241a14", color: "#fff", fontFamily: "monospace",
    }}>
      <strong style={{ fontSize: 15, letterSpacing: 1 }}>TaleSauce</strong>
      <button onClick={onAdd} disabled={count >= 6}>+ Add agent ({count}/6)</button>
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
          }} />
          <span style={{ fontSize: 11, opacity: 0.7 }}>{wsOk ? "live" : "reconnecting…"}</span>
        </span>
      </div>
    </div>
  );
}
