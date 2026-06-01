import { useEffect, useState } from "react";
import { TopBar } from "./app/TopBar.js";
import { StageSplit } from "./app/StageSplit.js";
import { TaskDock } from "./panels/TaskDock.js";
import { RightPanel } from "./panels/RightPanel.js";
import { Onboarding } from "./app/Onboarding.js";
import { connectWs } from "./net/ws.js";
import { getCapabilities } from "./net/rest.js";

type Caps = { openclaw: boolean; claudecode: boolean; defaultBrain: string | null };

export function App() {
  const [wsOk, setWsOk] = useState(false);
  const [adding, setAdding] = useState(false);
  const [caps, setCaps] = useState<Caps | null>(null);

  useEffect(() => {
    connectWs(setWsOk);
    getCapabilities().then(setCaps).catch(() => setCaps({ openclaw: false, claudecode: false, defaultBrain: null }));
  }, []);

  if (!caps) return <div style={{ color: "#fff", padding: 24, fontFamily: "monospace" }}>Loading…</div>;
  const anyBrain = caps.openclaw || caps.claudecode;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar wsOk={wsOk} onAdd={() => setAdding(true)} />
      {anyBrain ? (
        <>
          <StageSplit />
          <TaskDock />
          <RightPanel adding={adding} onCloseAdd={() => setAdding(false)} caps={caps} />
        </>
      ) : (
        <Onboarding />
      )}
    </div>
  );
}
