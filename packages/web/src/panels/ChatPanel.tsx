import { useEffect, useState } from "react";
import { useStore } from "../store/store.js";
import { getHistory, postTask, postReply, postDecision } from "../net/rest.js";

function TypingDots({ name }: { name: string }) {
  const [n, setN] = useState(1);
  useEffect(() => { const t = setInterval(() => setN((v) => (v % 3) + 1), 450); return () => clearInterval(t); }, []);
  return <div style={{ opacity: 0.6 }}>💭 {name} is thinking{".".repeat(n)}</div>;
}

export function ChatPanel({ agentId }: { agentId: string }) {
  const agent = useStore((s) => s.agents[agentId]);
  const messages = useStore((s) => s.messages[agentId] ?? []);
  const live = useStore((s) => s.chat[agentId] ?? "");
  const perms = useStore((s) => s.permissions[agentId] ?? []);
  const setHistory = useStore((s) => s.setHistory);
  const pushMessage = useStore((s) => s.pushMessage);
  const [text, setText] = useState("");

  useEffect(() => { getHistory(agentId).then((rows: any[]) => setHistory(agentId, rows.map((r) => ({ role: r.role, kind: r.kind, content: r.content })))).catch(() => {}); }, [agentId]);

  const awaiting = agent?.state === "awaiting-user";
  const busy = agent?.state === "working" || agent?.state === "going-to-workstation";

  const submit = async () => {
    const value = text.trim(); if (!value) return;
    pushMessage(agentId, { role: "user", kind: awaiting ? "chat" : "task", content: value });
    setText("");
    if (awaiting) await postReply(agentId, value); else await postTask(agentId, value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace", fontSize: 13 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "6px 0", color: m.role === "user" ? "#111" : m.kind === "question" ? "#b45309" : "#065f46" }}>
            <strong>{m.role === "user" ? "You" : agent?.config.name}{m.kind === "question" ? " (asks)" : m.kind === "result" ? " (done)" : ""}:</strong> {m.content}
          </div>
        ))}
        {live ? <div style={{ opacity: 0.7 }}>{agent?.config.name}: {live}▌</div> : busy && <TypingDots name={agent?.config.name ?? "Agent"} />}
      </div>
      {perms.map((p) => (
        <div key={p.requestId} style={{ margin: 8, padding: 8, border: "2px solid #d97706", borderRadius: 6, background: "#fff7ed" }}>
          <div style={{ marginBottom: 6 }}>⚙️ <strong>{agent?.config.name}</strong> wants to: <code>{p.summary}</code></div>
          <button onClick={() => postDecision(agentId, p.requestId, "allow")}>Allow</button>{" "}
          <button onClick={() => postDecision(agentId, p.requestId, "deny")}>Deny</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, padding: 8, borderTop: "1px solid #ddd" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={awaiting ? "Answer the question…" : "Give a task…"} style={{ flex: 1 }} />
        <button onClick={submit}>{awaiting ? "Reply" : "Send"}</button>
      </div>
    </div>
  );
}
