import { useState } from "react";
import { useStore } from "../store/store.js";
import { ChatPanel } from "./ChatPanel.js";
import { AgentConfigPanel } from "./AgentConfigPanel.js";
import { addAgent } from "../net/rest.js";

export function RightPanel({ adding, onCloseAdd }: { adding: boolean; onCloseAdd: () => void }) {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const [tab, setTab] = useState<"chat" | "config">("chat");

  if (adding) return <AddAgentForm onClose={onCloseAdd} />;
  if (!selectedId) return null;

  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 340, height: "100vh", background: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,.2)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 6, padding: 8, background: "#f3ead6" }}>
        <button onClick={() => setTab("chat")} disabled={tab === "chat"}>Chat</button>
        <button onClick={() => setTab("config")} disabled={tab === "config"}>Config</button>
        <button style={{ marginLeft: "auto" }} onClick={() => select(null)}>✕</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "chat" ? <ChatPanel agentId={selectedId} /> : <AgentConfigPanel agentId={selectedId} />}
      </div>
    </div>
  );
}

function AddAgentForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("New Agent");
  const [environment, setEnvironment] = useState<"farm" | "office">("farm");
  const submit = async () => {
    await addAgent({
      name, environment, brainKind: "openclaw",
      personality: { skill: "general help", personality: "friendly and curious", speakingStyle: "casual", appearance: "default", idleActions: ["stroll"], workAnimation: "work-loop" },
      pos: { x: 6, y: 6 },
    });
    onClose();
  };
  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 340, height: "100vh", background: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,.2)", padding: 12, fontFamily: "monospace" }}>
      <h3>Add agent</h3>
      <div><label>Name <input value={name} onChange={(e) => setName(e.target.value)} /></label></div>
      <div><label>Environment&nbsp;
        <select value={environment} onChange={(e) => setEnvironment(e.target.value as any)}>
          <option value="farm">farm</option><option value="office">office</option>
        </select></label></div>
      <div style={{ marginTop: 12 }}><button onClick={submit}>Create</button> <button onClick={onClose}>Cancel</button></div>
    </div>
  );
}
