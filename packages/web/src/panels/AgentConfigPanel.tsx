import { useState } from "react";
import { useStore } from "../store/store.js";
import { updateAgent, deleteAgent } from "../net/rest.js";
import { PixelField, PixelButton, pixelInput, PIX } from "./pixelUi.js";

type Caps = { openclaw: boolean; claudecode: boolean; codex: boolean; cursor: boolean };

const BRAIN_LABELS: Record<string, string> = {
  openclaw: "OpenClaw", claudecode: "Claude Code", codex: "Codex CLI", cursor: "Cursor CLI",
};
const CODING_BRAINS = ["claudecode", "codex", "cursor"];

export function AgentConfigPanel({ agentId, caps = { openclaw: true, claudecode: true, codex: false, cursor: false } }: { agentId: string; caps?: Caps }) {
  const a = useStore((s) => s.agents[agentId]);
  const select = useStore((s) => s.select);
  const [workingDir, setWorkingDir] = useState(a?.config.workingDir ?? "");
  const [sessionId, setSessionId] = useState(a?.config.sessionId ?? "");
  const [confirmDel, setConfirmDel] = useState(false);
  if (!a) return null;

  const isCodingBrain = CODING_BRAINS.includes(a.config.brainKind);
  const brainLabel = BRAIN_LABELS[a.config.brainKind] ?? a.config.brainKind;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: PIX.parchment, padding: 14, fontFamily: "monospace" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: "bold", color: PIX.ink }}>{a.config.name}</span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: a.config.environment === "office" ? "#9aa6c4" : "#a6c48a", color: "#241a14", fontWeight: "bold" }}>
          {a.config.environment === "office" ? "🏢 office" : "🌾 farm"}
        </span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: PIX.accent, color: "#241a14", fontWeight: "bold" }}>{brainLabel}</span>
      </div>

      <PixelField label="Brain">
        <select value={a.config.brainKind} onChange={(e) => updateAgent(agentId, { brainKind: e.target.value })} style={pixelInput}>
          {caps.openclaw && <option value="openclaw">OpenClaw</option>}
          {caps.claudecode && <option value="claudecode">Claude Code</option>}
          {caps.codex && <option value="codex">Codex CLI</option>}
          {caps.cursor && <option value="cursor">Cursor CLI</option>}
        </select>
      </PixelField>

      {isCodingBrain && (
        <>
          <PixelField label="📂 Repository / working dir" hint="Absolute path to the local repo this agent works in.">
            <input value={workingDir} placeholder="/Users/you/code/my-project"
              onChange={(e) => setWorkingDir(e.target.value)}
              onBlur={() => updateAgent(agentId, { workingDir })}
              style={{ ...pixelInput, fontSize: 14, padding: "10px 12px" }} />
          </PixelField>
          <PixelField label="Session id" hint="Optional — paste a session id to resume an existing one.">
            <input value={sessionId} placeholder={a.config.sessionId ? `${a.config.sessionId} (live)` : "new session"}
              onChange={(e) => setSessionId(e.target.value)}
              onBlur={() => updateAgent(agentId, { sessionId })} style={pixelInput} />
          </PixelField>
        </>
      )}

      <div style={{ fontSize: 12, color: "#6b4a26", lineHeight: 1.5, margin: "6px 0 16px" }}>
        {a.config.personality.personality}
      </div>

      <div style={{ borderTop: `2px dashed ${PIX.wood}`, paddingTop: 12 }}>
        {!confirmDel ? (
          <PixelButton variant="danger" onClick={() => setConfirmDel(true)}>🗑 Delete agent</PixelButton>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: PIX.red, fontWeight: "bold" }}>Delete {a.config.name}?</span>
            <PixelButton variant="danger" onClick={() => { deleteAgent(agentId); select(null); }}>Yes, delete</PixelButton>
            <PixelButton onClick={() => setConfirmDel(false)}>Cancel</PixelButton>
          </div>
        )}
      </div>
    </div>
  );
}
