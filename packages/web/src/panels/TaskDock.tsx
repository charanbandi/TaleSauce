import { useStore } from "../store/store.js";
import type { BrainKind } from "@talesauce/shared";

const CHIP_COLORS: Record<string, string> = {
  idle: "#e5e7eb", working: "#bfdbfe", "going-to-workstation": "#bfdbfe",
  "walking-to-front": "#fde68a", "awaiting-user": "#fde68a",
  "awaiting-permission": "#fed7aa", reporting: "#bbf7d0", error: "#fecaca",
};

const CHIP_TEXT_COLORS: Record<string, string> = {
  idle: "#374151", working: "#1e40af", "going-to-workstation": "#1e40af",
  "walking-to-front": "#92400e", "awaiting-user": "#92400e",
  "awaiting-permission": "#9a3412", reporting: "#14532d", error: "#991b1b",
};

const BRAIN_BADGE: Record<BrainKind, string> = {
  openclaw: "OC", claudecode: "CC", codex: "CX", cursor: "CU",
};

const BRAIN_BADGE_COLOR: Record<BrainKind, string> = {
  openclaw: "#6366f1", claudecode: "#f59e0b", codex: "#ef4444", cursor: "#8b5cf6",
};

const PULSE_KEYFRAMES = `
@keyframes pulseBorder {
  0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
  50%       { box-shadow: 0 0 0 3px rgba(37,99,235,0); }
}`;

function truncate(s: string, n = 28): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function TaskDock() {
  const agents = useStore((s) => s.agents);
  const permissions = useStore((s) => s.permissions);
  const select = useStore((s) => s.select);

  return (
    <div style={{
      display: "flex", gap: 8, padding: "6px 8px",
      background: "#fff8ec", borderTop: "2px solid #241a14",
      overflowX: "auto", fontFamily: "monospace", fontSize: 12, minHeight: 72,
    }}>
      <style>{PULSE_KEYFRAMES}</style>
      {Object.values(agents).map((a) => {
        const pend = permissions[a.config.id] ?? [];
        const isWorking = a.state === "working" || a.state === "going-to-workstation";
        const bgColor = pend.length ? "#ffedd5" : (CHIP_COLORS[a.state] ?? "#e5e7eb");
        const textColor = CHIP_TEXT_COLORS[a.state] ?? "#374151";
        const badge = BRAIN_BADGE[a.config.brainKind as BrainKind] ?? "?";
        const badgeColor = BRAIN_BADGE_COLOR[a.config.brainKind as BrainKind] ?? "#6b7280";

        return (
          <button key={a.config.id} onClick={() => select(a.config.id)}
            style={{
              position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "5px 9px", border: pend.length ? "2px solid #ea580c" : `1px solid ${bgColor}`,
              borderRadius: 8, minWidth: 160, background: bgColor, cursor: "pointer",
              transition: "border-color 0.3s, background 0.3s",
              animation: isWorking ? "pulseBorder 1.5s ease-in-out infinite" : "none",
              textAlign: "left",
            }}>
            <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, fontWeight: "bold", color: badgeColor, letterSpacing: 0.5 }}>{badge}</span>
            <span style={{ fontWeight: "bold", color: "#241a14", paddingRight: 20 }}>{a.config.name}</span>
            <span style={{ opacity: 0.7, color: "#374151", fontSize: 11 }}>{truncate(a.activity)}</span>
            <span style={{ marginTop: 3, fontSize: 10, color: textColor, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {a.state.replace(/-/g, " ")}
            </span>
            {pend.length > 0 && (
              <span style={{ color: "#ea580c", fontSize: 10, marginTop: 2 }}>⚙️ {pend.length} approval{pend.length > 1 ? "s" : ""}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
