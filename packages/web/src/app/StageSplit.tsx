import { useEffect, useState } from "react";
import { PhaserMount } from "../game/PhaserMount.js";
import { DraggableDivider } from "./DraggableDivider.js";
import { getSettings, saveSettings } from "../net/rest.js";

type Focus = "farm" | "office" | null;

export function StageSplit() {
  const [pct, setPct] = useState(50);
  const [focus, setFocus] = useState<Focus>(null);

  useEffect(() => { getSettings().then((s) => { setPct(s.sliderPct ?? 50); setFocus(s.focus ?? null); }).catch(() => {}); }, []);
  useEffect(() => { saveSettings({ sliderPct: pct, focus }).catch(() => {}); }, [pct, focus]);

  const farmFlex = focus === "farm" ? 1 : focus === "office" ? 0 : pct / 100;
  const officeFlex = focus === "office" ? 1 : focus === "farm" ? 0 : 1 - pct / 100;

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <Pane label="FARM" flex={farmFlex} onClick={() => setFocus(focus === "farm" ? null : "farm")}>
        <PhaserMount scene="farm" />
      </Pane>
      {focus === null && <DraggableDivider onDrag={(x) => setPct(Math.min(85, Math.max(15, (x / window.innerWidth) * 100)))} />}
      <Pane label="OFFICE" flex={officeFlex} onClick={() => setFocus(focus === "office" ? null : "office")}>
        <PhaserMount scene="office" />
      </Pane>
    </div>
  );
}

function Pane({ flex, label, onClick, children }: { flex: number; label: string; onClick: () => void; children: React.ReactNode }) {
  if (flex <= 0) return null;
  return (
    <div style={{ flex, minWidth: 0, position: "relative", overflow: "hidden" }}>
      <button onClick={onClick} style={{ position: "absolute", top: 6, left: 6, zIndex: 2, fontFamily: "monospace", fontSize: 11 }}>
        {label} ⤢
      </button>
      {children}
    </div>
  );
}
