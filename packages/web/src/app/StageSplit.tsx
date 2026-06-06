import { useEffect, useState } from "react";
import { PhaserMount } from "../game/PhaserMount.js";
import { DraggableDivider } from "./DraggableDivider.js";
import { getSettings, saveSettings } from "../net/rest.js";
import { useStore, type Focus } from "../store/store.js";

export function StageSplit() {
  const [pct, setPct] = useState(50);
  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);

  useEffect(() => { getSettings().then((s) => { setPct(s.sliderPct ?? 50); setFocus(s.focus ?? null); }).catch(() => {}); }, []);
  useEffect(() => { saveSettings({ sliderPct: pct, focus }).catch(() => {}); }, [pct, focus]);

  const farmFlex = focus === "farm" ? 1 : focus === "office" ? 0 : pct / 100;
  const officeFlex = focus === "office" ? 1 : focus === "farm" ? 0 : 1 - pct / 100;

  return (
    <div style={{ position: "relative", display: "flex", flex: 1, minHeight: 0 }}>
      <EnvToggle focus={focus} onChange={setFocus} />
      <Pane flex={farmFlex}><PhaserMount scene="farm" /></Pane>
      {focus === null && <DraggableDivider onDrag={(x) => setPct(Math.min(85, Math.max(15, (x / window.innerWidth) * 100)))} />}
      <Pane flex={officeFlex}><PhaserMount scene="office" /></Pane>
    </div>
  );
}

function EnvToggle({ focus, onChange }: { focus: Focus; onChange: (f: Focus) => void }) {
  const opts: { label: string; value: Focus }[] = [
    { label: "🌾 Farm", value: "farm" },
    { label: "⛶ Both", value: null },
    { label: "🏢 Office", value: "office" },
  ];
  return (
    <div style={{
      position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 5,
      display: "flex", background: "#241a14", border: "3px solid #b5895a", borderRadius: 10,
      boxShadow: "0 2px 0 #1a120c, 0 4px 8px rgba(0,0,0,.4)", overflow: "hidden", fontFamily: "monospace",
    }}>
      {opts.map((o) => {
        const active = focus === o.value;
        return (
          <button key={String(o.value)} onClick={() => onChange(o.value)}
            style={{
              padding: "6px 14px", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: 12,
              fontWeight: active ? "bold" : "normal",
              background: active ? "#e8c87a" : "transparent", color: active ? "#241a14" : "#e8c87a",
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Pane({ flex, children }: { flex: number; children: React.ReactNode }) {
  if (flex <= 0) return null;
  return <div style={{ flex, minWidth: 0, position: "relative", overflow: "hidden" }}>{children}</div>;
}
