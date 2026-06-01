import { useEffect, useState } from "react";
import { TopBar } from "./app/TopBar.js";
import { StageSplit } from "./app/StageSplit.js";
import { TaskDock } from "./panels/TaskDock.js";
import { RightPanel } from "./panels/RightPanel.js";
import { connectWs } from "./net/ws.js";

export function App() {
  const [wsOk, setWsOk] = useState(false);
  const [adding, setAdding] = useState(false);
  useEffect(() => { connectWs(setWsOk); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar wsOk={wsOk} onAdd={() => setAdding(true)} />
      <StageSplit />
      <TaskDock />
      <RightPanel adding={adding} onCloseAdd={() => setAdding(false)} />
    </div>
  );
}
