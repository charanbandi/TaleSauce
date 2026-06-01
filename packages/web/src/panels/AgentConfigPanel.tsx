import { useState } from "react";
import { useStore } from "../store/store.js";
import { updateAgent } from "../net/rest.js";

type Caps = { openclaw: boolean; claudecode: boolean };

export function AgentConfigPanel({ agentId, caps = { openclaw: true, claudecode: true } }: { agentId: string; caps?: Caps }) {
  const a = useStore((s) => s.agents[agentId]);
  const [workingDir, setWorkingDir] = useState(a?.config.workingDir ?? "");
  const [sessionId, setSessionId] = useState(a?.config.sessionId ?? "");
  if (!a) return null;
  const isCC = a.config.brainKind === "claudecode";
  return (
    <div style={{ padding: 8, fontFamily: "monospace", fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
      <div><strong>{a.config.name}</strong> · {a.config.environment}</div>
      <label>Brain:&nbsp;
        <select value={a.config.brainKind} onChange={(e) => updateAgent(agentId, { brainKind: e.target.value })}>
          {caps.openclaw && <option value="openclaw">OpenClaw</option>}
          {caps.claudecode && <option value="claudecode">Claude Code</option>}
        </select>
      </label>
      {isCC && (
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
          <span style={{ opacity: 0.6 }}>🤖 Claude Code agent</span>
        </>
      )}
      <p style={{ marginTop: 8, opacity: 0.7 }}>{a.config.personality.personality}</p>
    </div>
  );
}
