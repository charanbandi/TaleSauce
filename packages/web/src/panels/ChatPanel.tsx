import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/store.js";
import { getHistory, postTask, postReply, postDecision } from "../net/rest.js";
import { tintForAgent } from "../game/AgentSprite.js";

/** Convert a Phaser hex tint (0xRRGGBB) to a CSS colour string. */
function tintToCss(tint: number): string {
  return `#${tint.toString(16).padStart(6, "0")}`;
}

const keyframes = `
@keyframes typingPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1.0); opacity: 1;   }
}`;

function TypingDots() {
  return (
    <>
      <style>{keyframes}</style>
      <div style={{ display: "flex", gap: 4, padding: "6px 10px", alignItems: "center" }}>
        {[0, 0.16, 0.32].map((delay, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#9ca3af",
            display: "inline-block",
            animation: `typingPulse 1.2s ${delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </>
  );
}

export function ChatPanel({ agentId }: { agentId: string }) {
  const agent = useStore((s) => s.agents[agentId]);
  const messages = useStore((s) => s.messages[agentId] ?? []);
  const live = useStore((s) => s.chat[agentId] ?? "");
  const perms = useStore((s) => s.permissions[agentId] ?? []);
  const setHistory = useStore((s) => s.setHistory);
  const pushMessage = useStore((s) => s.pushMessage);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    getHistory(agentId).then((rows: any[]) =>
      setHistory(agentId, rows.map((r) => ({ role: r.role, kind: r.kind, content: r.content })))
    ).catch(() => {});
  }, [agentId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: 99999, behavior: isFirstLoad.current ? "auto" : "smooth" });
    isFirstLoad.current = false;
  }, [messages.length, live]);

  const awaiting = agent?.state === "awaiting-user";
  const busy = agent?.state === "working" || agent?.state === "going-to-workstation";

  const agentTint = agent ? tintToCss(tintForAgent(agent.config.name, agent.config.id)) : "#6b7280";

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    pushMessage(agentId, { role: "user", kind: awaiting ? "chat" : "task", content: value });
    setText("");
    if (awaiting) await postReply(agentId, value);
    else await postTask(agentId, value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace", fontSize: 13, background: "#fafafa" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const borderColor = m.kind === "question" ? "#f59e0b" : m.kind === "result" ? "#22c55e" : "transparent";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 8 }}>
              {!isUser && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: agentTint, flexShrink: 0, marginTop: 5, marginRight: 6, alignSelf: "flex-start" }} />
              )}
              <div style={{
                maxWidth: "78%", padding: "6px 10px",
                borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: isUser ? "#f3ead6" : "#fff",
                border: `1px solid ${borderColor !== "transparent" ? borderColor : "#e5e7eb"}`,
                borderLeft: !isUser && borderColor !== "transparent" ? `3px solid ${borderColor}` : undefined,
                lineHeight: 1.5, color: "#111", wordBreak: "break-word",
              }}>
                {!isUser && (
                  <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>
                    {agent?.config.name}{m.kind === "question" ? " asks" : m.kind === "result" ? " — done" : ""}
                  </div>
                )}
                {m.content}
              </div>
            </div>
          );
        })}

        {live && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: agentTint, flexShrink: 0, marginTop: 5, marginRight: 6 }} />
            <div style={{ maxWidth: "78%", padding: "6px 10px", background: "#fff", borderRadius: "12px 12px 12px 2px", border: "1px solid #e5e7eb", lineHeight: 1.5 }}>
              <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>{agent?.config.name}</div>
              {live}<span style={{ opacity: 0.5 }}>▌</span>
            </div>
          </div>
        )}

        {busy && !live && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: agentTint }} />
            <TypingDots />
          </div>
        )}
      </div>

      {perms.map((p) => (
        <div key={p.requestId} style={{ margin: "0 8px 8px", padding: 10, border: "2px solid #d97706", borderRadius: 8, background: "#fff7ed" }}>
          <div style={{ marginBottom: 6, fontSize: 12 }}>
            ⚙️ <strong>{agent?.config.name}</strong> wants to:
            <br />
            <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{p.summary}</code>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => postDecision(agentId, p.requestId, "allow")}
              style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>Allow</button>
            <button onClick={() => postDecision(agentId, p.requestId, "deny")}
              style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>Deny</button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, padding: 8, borderTop: "1px solid #e5e7eb", background: "#fff" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={awaiting ? "Answer the question…" : "Give a task…"}
          style={{ flex: 1, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontFamily: "monospace", fontSize: 13 }} />
        <button onClick={submit}
          style={{ padding: "6px 12px", background: "#241a14", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}>
          {awaiting ? "Reply" : "Send"}
        </button>
      </div>
    </div>
  );
}
