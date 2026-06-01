import { useStore } from "../store/store.js";

export function AgentConfigPanel({ agentId }: { agentId: string }) {
  const a = useStore((s) => s.agents[agentId]);
  if (!a) return null;
  return (
    <div style={{ padding: 8, fontFamily: "monospace", fontSize: 13 }}>
      <div><strong>{a.config.name}</strong></div>
      <div>Environment: {a.config.environment}</div>
      <label>Brain:&nbsp;
        <select defaultValue={a.config.brainKind} disabled title="Editing brains lands in Phase 2">
          <option value="openclaw">OpenClaw</option>
          <option value="claudecode">Claude Code (Phase 2)</option>
        </select>
      </label>
      <div title="Claude Code session id — Phase 2" style={{ opacity: 0.5, marginTop: 6 }}>
        Claude Code session: <input disabled placeholder="Phase 2" />
      </div>
      <p style={{ marginTop: 8, opacity: 0.7 }}>{a.config.personality.personality}</p>
    </div>
  );
}
