import { useState } from "react";
import { useStore } from "../store/store.js";
import { updateAgent } from "../net/rest.js";

type Caps = { openclaw: boolean; claudecode: boolean; codex: boolean; cursor: boolean };

const BRAIN_LABELS: Record<string, string> = {
  openclaw: "OpenClaw", claudecode: "Claude Code", codex: "Codex CLI", cursor: "Cursor CLI",
};

const CODING_BRAINS = ["claudecode", "codex", "cursor"];

export function AgentConfigPanel({ agentId, caps = { openclaw: true, claudecode: true, codex: false, cursor: false } }: { agentId: string; caps?: Caps }) {
  const a = useStore((s) => s.agents[agentId]);
  const [workingDir, setWorkingDir] = useState(a?.config.workingDir ?? "");
  const [sessionId, setSessionId] = useState(a?.config.sessionId ?? "");
  if (!a) return null;

  const isCodingBrain = CODING_BRAINS.includes(a.config.brainKind);
  const brainLabel = BRAIN_LABELS[a.config.brainKind] ?? a.config.brainKind;

  return (
    <div style={{ padding: 8, fontFamily: "monospace", fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <strong>{a.config.name}</strong> · {a.config.environment}
        {" "}<span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 11, background: "#e0e7ef", color: "#374151" }}>{brainLabel}</span>
      </div>
      <label>Brain:&nbsp;
        <select value={a.config.brainKind} onChange={(e) => updateAgent(agentId, { brainKind: e.target.value })}>
          {caps.openclaw && <option value="openclaw">OpenClaw</option>}
          {caps.claudecode && <option value="claudecode">Claude Code</option>}
          {caps.codex && <option value="codex">Codex CLI</option>}
          {caps.cursor && <option value="cursor">Cursor CLI</option>}
        </select>
      </label>
      {isCodingBrain && (
        <>
          <label>Working dir:&nbsp;
            <input value={workingDir} placeholder="/path/to/repo"
              onChange={(e) => setWorkingDir(e.target.value)}
              onBlur={() => updateAgent(agentId, { workingDir })} style={{ width: "100%" }} />
          </label>
          <label>Session id (optional, to resume):&nbsp;
            <input value={sessionId} placeholder={a.config.sessionId ? `${a.config.sessionId} (live)` : "new session"}
              onChange={(e) => setSessionId(e.target.value)}
              onBlur={() => updateAgent(agentId, { sessionId })} style={{ width: "100%" }} />
          </label>
          <span style={{ opacity: 0.6 }}>🤖 {brainLabel} agent</span>
        </>
      )}
      <p style={{ marginTop: 8, opacity: 0.7 }}>{a.config.personality.personality}</p>
    </div>
  );
}
