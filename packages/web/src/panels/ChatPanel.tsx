import { useEffect, useState } from "react";
import { useStore } from "../store/store.js";
import { getHistory, postTask, postReply } from "../net/rest.js";

export function ChatPanel({ agentId }: { agentId: string }) {
  const agent = useStore((s) => s.agents[agentId]);
  const messages = useStore((s) => s.messages[agentId] ?? []);
  const live = useStore((s) => s.chat[agentId] ?? "");
  const setHistory = useStore((s) => s.setHistory);
  const [text, setText] = useState("");

  useEffect(() => { getHistory(agentId).then((rows: any[]) => setHistory(agentId, rows.map((r) => ({ role: r.role, kind: r.kind, content: r.content })))).catch(() => {}); }, [agentId]);

  const awaiting = agent?.state === "awaiting-user";
  const submit = async () => {
    if (!text.trim()) return;
    if (awaiting) await postReply(agentId, text); else await postTask(agentId, text);
    setText("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace", fontSize: 13 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "6px 0", color: m.role === "user" ? "#111" : m.kind === "question" ? "#b45309" : "#065f46" }}>
            <strong>{m.role === "user" ? "You" : agent?.config.name}{m.kind === "question" ? " (asks)" : m.kind === "result" ? " (done)" : ""}:</strong> {m.content}
          </div>
        ))}
        {live && <div style={{ opacity: 0.7 }}>{agent?.config.name}: {live}▌</div>}
      </div>
      <div style={{ display: "flex", gap: 6, padding: 8, borderTop: "1px solid #ddd" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={awaiting ? "Answer the question…" : "Give a task…"} style={{ flex: 1 }} />
        <button onClick={submit}>{awaiting ? "Reply" : "Send"}</button>
      </div>
    </div>
  );
}
