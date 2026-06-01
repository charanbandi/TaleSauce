import { useStore } from "../store/store.js";

export function TopBar({ wsOk, onAdd }: { wsOk: boolean; onAdd: () => void }) {
  const count = Object.keys(useStore((s) => s.agents)).length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#241a14", color: "#fff", fontFamily: "monospace" }}>
      <strong>TaleSauce</strong>
      <button onClick={onAdd} disabled={count >= 6}>+ Add agent ({count}/6)</button>
      <span style={{ marginLeft: "auto" }}>{wsOk ? "🟢 connected" : "🔴 reconnecting…"}</span>
    </div>
  );
}
