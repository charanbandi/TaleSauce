import { useStore } from "../store/store.js";

const chip: Record<string, string> = {
  idle: "#6b7280", working: "#2563eb", "going-to-workstation": "#2563eb",
  "walking-to-front": "#d97706", "awaiting-user": "#d97706", "awaiting-permission": "#ea580c",
  reporting: "#16a34a", error: "#dc2626",
};

export function TaskDock() {
  const agents = useStore((s) => s.agents);
  const permissions = useStore((s) => s.permissions);
  const select = useStore((s) => s.select);
  return (
    <div style={{ display: "flex", gap: 8, padding: 8, background: "#fff8ec", borderTop: "2px solid #241a14", overflowX: "auto", fontFamily: "monospace", fontSize: 12 }}>
      {Object.values(agents).map((a) => {
        const pend = permissions[a.config.id] ?? [];
        return (
          <button key={a.config.id} onClick={() => select(a.config.id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "4px 8px", border: pend.length ? "2px solid #ea580c" : "1px solid #241a14", borderRadius: 6, minWidth: 160, background: "#fff" }}>
            <span><strong>{a.config.name}</strong> · {a.config.environment}</span>
            <span style={{ opacity: 0.8 }}>{a.activity}</span>
            {pend.length > 0 && <span style={{ color: "#ea580c" }}>⚙️ needs approval ({pend.length})</span>}
            <span style={{ marginTop: 2, color: "#fff", background: chip[a.state] ?? "#6b7280", borderRadius: 4, padding: "0 6px" }}>{a.state}</span>
          </button>
        );
      })}
    </div>
  );
}
