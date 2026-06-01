import { useState } from "react";
import { useStore } from "../store/store.js";
import { ChatPanel } from "./ChatPanel.js";
import { AgentConfigPanel } from "./AgentConfigPanel.js";
import { addAgent } from "../net/rest.js";

type Caps = { openclaw: boolean; claudecode: boolean };
const DEFAULT_CAPS: Caps = { openclaw: true, claudecode: true };

export function RightPanel({ adding, onCloseAdd, caps = DEFAULT_CAPS }: { adding: boolean; onCloseAdd: () => void; caps?: Caps }) {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const [tab, setTab] = useState<"chat" | "config">("chat");

  if (adding) return <AddAgentForm onClose={onCloseAdd} caps={caps} />;
  if (!selectedId) return null;

  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 340, height: "100vh", background: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,.2)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 6, padding: 8, background: "#f3ead6" }}>
        <button onClick={() => setTab("chat")} disabled={tab === "chat"}>Chat</button>
        <button onClick={() => setTab("config")} disabled={tab === "config"}>Config</button>
        <button style={{ marginLeft: "auto" }} onClick={() => select(null)}>✕</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "chat" ? <ChatPanel agentId={selectedId} /> : <AgentConfigPanel agentId={selectedId} caps={caps} />}
      </div>
    </div>
  );
}

function AddAgentForm({ onClose, caps }: { onClose: () => void; caps: Caps }) {
  const kinds = [caps.openclaw && "openclaw", caps.claudecode && "claudecode"].filter(Boolean) as ("openclaw" | "claudecode")[];
  const [name, setName] = useState("New Agent");
  const [brainKind, setBrainKind] = useState<"openclaw" | "claudecode">(kinds[0] ?? "openclaw");
  const [environment, setEnvironment] = useState<"farm" | "office">(kinds[0] === "claudecode" ? "office" : "farm");
  const [workingDir, setWorkingDir] = useState("");
  const submit = async () => {
    await addAgent({
      name, environment, brainKind,
      ...(brainKind === "claudecode" ? { workingDir } : {}),
      personality: { skill: "general help", personality: "friendly and curious", speakingStyle: "casual", appearance: "default", idleActions: ["stroll"], workAnimation: "work-loop" },
      pos: { x: 6, y: 6 },
    });
    onClose();
  };
  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 340, height: "100vh", background: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,.2)", padding: 12, fontFamily: "monospace" }}>
      <h3>Add agent</h3>
      <div><label>Name <input value={name} onChange={(e) => setName(e.target.value)} /></label></div>
      <div><label>Brain&nbsp;
        <select value={brainKind} onChange={(e) => setBrainKind(e.target.value as any)}>
          {kinds.map((k) => <option key={k} value={k}>{k === "claudecode" ? "Claude Code" : "OpenClaw"}</option>)}
        </select></label></div>
      <div><label>Environment&nbsp;
        <select value={environment} onChange={(e) => setEnvironment(e.target.value as any)}>
          <option value="farm">farm</option><option value="office">office</option>
        </select></label></div>
      {brainKind === "claudecode" && (
        <div><label>Working dir <input value={workingDir} placeholder="/path/to/repo" onChange={(e) => setWorkingDir(e.target.value)} /></label></div>
      )}
      <div style={{ marginTop: 12 }}><button onClick={submit}>Create</button> <button onClick={onClose}>Cancel</button></div>
    </div>
  );
}
