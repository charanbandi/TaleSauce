import { useState } from "react";
import { useStore } from "../store/store.js";
import { ChatPanel } from "./ChatPanel.js";
import { AgentConfigPanel } from "./AgentConfigPanel.js";
import { addAgent } from "../net/rest.js";
import { PixelField, PixelButton, pixelInput, PIX } from "./pixelUi.js";

const SLIDE_UP = `@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`;

type Caps = { openclaw: boolean; claudecode: boolean; codex: boolean; cursor: boolean };
const DEFAULT_CAPS: Caps = { openclaw: true, claudecode: true, codex: false, cursor: false };

const BRAIN_LABELS: Record<string, string> = {
  openclaw: "OpenClaw", claudecode: "Claude Code", codex: "Codex CLI", cursor: "Cursor CLI",
};
const CODING_BRAINS = ["claudecode", "codex", "cursor"];
type BrainKind = "openclaw" | "claudecode" | "codex" | "cursor";

const drawerStyle: React.CSSProperties = {
  height: "42vh", maxHeight: 460, minHeight: 220, flexShrink: 0,
  background: "#fff", borderTop: "2px solid #241a14", boxShadow: "0 -3px 10px rgba(0,0,0,.15)",
  display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease-out",
};

export function RightPanel({ adding, onCloseAdd, caps = DEFAULT_CAPS }: { adding: boolean; onCloseAdd: () => void; caps?: Caps }) {
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const agent = useStore((s) => (selectedId ? s.agents[selectedId] : null));
  const [tab, setTab] = useState<"chat" | "config">("chat");

  if (adding) return <AddAgentForm onClose={onCloseAdd} caps={caps} />;
  if (!selectedId) return null;

  return (
    <>
      <style>{SLIDE_UP}</style>
      <div style={drawerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#f3ead6", flexShrink: 0 }}>
          <strong style={{ fontFamily: "monospace", fontSize: 13 }}>{agent?.config.name ?? "Agent"}</strong>
          {agent && (
            <>
              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, fontWeight: "bold", color: "#241a14", background: agent.config.environment === "office" ? "#9aa6c4" : "#a6c48a" }}>
                {agent.config.environment === "office" ? "🏢 office" : "🌾 farm"}
              </span>
              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, fontWeight: "bold", color: "#241a14", background: PIX.accent }}>
                {BRAIN_LABELS[agent.config.brainKind] ?? agent.config.brainKind}
              </span>
            </>
          )}
          <button onClick={() => setTab("chat")} disabled={tab === "chat"}>Chat</button>
          <button onClick={() => setTab("config")} disabled={tab === "config"}>Config</button>
          <button style={{ marginLeft: "auto" }} onClick={() => select(null)}>✕ Close</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {tab === "chat" ? <ChatPanel agentId={selectedId} /> : <AgentConfigPanel agentId={selectedId} caps={caps} />}
        </div>
      </div>
    </>
  );
}

function AddAgentForm({ onClose, caps }: { onClose: () => void; caps: Caps }) {
  const allKinds: BrainKind[] = ["openclaw", "claudecode", "codex", "cursor"];
  const kinds = allKinds.filter((k) => caps[k]);
  const defaultKind: BrainKind = kinds[0] ?? "openclaw";
  const defaultEnv = CODING_BRAINS.includes(defaultKind) ? "office" : "farm";

  const [name, setName] = useState("New Agent");
  const [brainKind, setBrainKind] = useState<BrainKind>(defaultKind);
  const [environment, setEnvironment] = useState<"farm" | "office">(defaultEnv);
  const [workingDir, setWorkingDir] = useState("");

  const submit = async () => {
    await addAgent({
      name, environment, brainKind,
      ...(CODING_BRAINS.includes(brainKind) ? { workingDir } : {}),
      personality: { skill: "general help", personality: "friendly and curious", speakingStyle: "casual", appearance: "default", idleActions: ["stroll"], workAnimation: "work-loop" },
      pos: { x: 6, y: 6 },
    });
    onClose();
  };

  const isCoding = CODING_BRAINS.includes(brainKind);
  return (
    <>
      <style>{SLIDE_UP}</style>
      <div style={{ ...drawerStyle, background: PIX.parchment, padding: "12px 18px", fontFamily: "monospace", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, color: PIX.ink, fontSize: 18 }}>✨ New agent</h3>
          <PixelButton onClick={onClose} style={{ marginLeft: "auto" }}>✕ Close</PixelButton>
        </div>
        {/* top row: short fields side by side */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px" }}>
            <PixelField label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={pixelInput} /></PixelField>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <PixelField label="Brain">
              <select value={brainKind} onChange={(e) => setBrainKind(e.target.value as BrainKind)} style={pixelInput}>
                {kinds.map((k) => <option key={k} value={k}>{BRAIN_LABELS[k]}</option>)}
              </select>
            </PixelField>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <PixelField label="Environment">
              <select value={environment} onChange={(e) => setEnvironment(e.target.value as "farm" | "office")} style={pixelInput}>
                <option value="farm">🌾 farm</option><option value="office">🏢 office</option>
              </select>
            </PixelField>
          </div>
        </div>
        {/* wide repo field for cloud/coding agents */}
        {isCoding && (
          <PixelField label="📂 Repository / working dir" hint="Absolute path to the local repo this agent will work in.">
            <input value={workingDir} placeholder="/Users/you/code/my-project"
              onChange={(e) => setWorkingDir(e.target.value)}
              style={{ ...pixelInput, fontSize: 15, padding: "12px 14px" }} />
          </PixelField>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <PixelButton variant="primary" onClick={submit}>Create agent</PixelButton>
          <PixelButton onClick={onClose}>Cancel</PixelButton>
        </div>
      </div>
    </>
  );
}
