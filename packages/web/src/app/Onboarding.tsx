/** Minimal inline syntax highlighter for .env-style content (no runtime dep). */
function EnvBlock({ children }: { children: string }) {
  const lines = children.split("\n");
  return (
    <pre style={{
      background: "#0d1117", padding: "14px 16px", borderRadius: 8,
      overflowX: "auto", whiteSpace: "pre", fontSize: 12, lineHeight: 1.7,
      border: "1px solid #30363d", margin: "12px 0",
    }}>
      {lines.map((line, i) => {
        if (line.startsWith("#")) {
          return <div key={i}><span style={{ color: "#6e7681" }}>{line}</span></div>;
        }
        const eq = line.indexOf("=");
        if (eq > 0) {
          const key = line.slice(0, eq);
          const val = line.slice(eq + 1);
          return (
            <div key={i}>
              <span style={{ color: "#79c0ff" }}>{key}</span>
              <span style={{ color: "#e6edf3" }}>=</span>
              <span style={{ color: "#a5d6ff" }}>{val}</span>
            </div>
          );
        }
        return <div key={i}><span style={{ color: "#e6edf3" }}>{line}</span></div>;
      })}
    </pre>
  );
}

const ENV_CONTENT = `# Option A: OpenClaw (hosted, OpenAI-compatible)
OPENCLAW_API_URL=https://your-openclaw-host/v1/chat/completions
OPENCLAW_API_KEY=...your key...

# Option B: Claude Code (local, needs login or API key)
CLAUDE_CODE_ENABLED=true
# ANTHROPIC_API_KEY=sk-ant-...

# Option C: Codex CLI (needs codex on PATH + codex login)
CODEX_ENABLED=true

# Option D: Cursor CLI (needs cursor-agent on PATH + login)
CURSOR_ENABLED=true

# Optional: which brain to auto-start when more than one is set
# DEFAULT_BRAIN=claudecode`;

export function Onboarding() {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: "monospace", background: "#1a1a2e",
    }}>
      <div style={{
        maxWidth: 520, padding: 28, lineHeight: 1.7,
        background: "#0f0f1a", borderRadius: 12, border: "1px solid #30363d",
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Welcome to TaleSauce 🍅</h2>
        <p style={{ opacity: 0.75, margin: "0 0 4px" }}>
          No agent brain is configured yet. Add at least one to your <code style={{ background: "#21262d", padding: "1px 5px", borderRadius: 4 }}>.env</code>, then reload:
        </p>
        <EnvBlock>{ENV_CONTENT}</EnvBlock>
        <button
          onClick={() => location.reload()}
          style={{
            width: "100%", padding: "10px 0",
            background: "#241a14", color: "#fff",
            border: "none", borderRadius: 6,
            fontFamily: "monospace", fontSize: 14,
            cursor: "pointer", marginTop: 4, transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#3d2c20")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#241a14")}
        >
          Reload ↩
        </button>
      </div>
    </div>
  );
}
