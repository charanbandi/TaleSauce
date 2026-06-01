export function Onboarding() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "monospace", background: "#1a1a1a" }}>
      <div style={{ maxWidth: 560, padding: 24, lineHeight: 1.6 }}>
        <h2>Welcome to TaleSauce 🍅</h2>
        <p>No agent brain is configured yet. Add at least one to your <code>.env</code>, then reload:</p>
        <pre style={{ background: "#0f0f0f", padding: 12, borderRadius: 6, whiteSpace: "pre-wrap" }}>{`# Option A — OpenClaw (hosted)
OPENCLAW_API_URL=...your endpoint...
OPENCLAW_API_KEY=...your key...

# Option B — local Claude Code
#   set this if you're logged into Claude Code locally,
#   or provide an Anthropic API key:
CLAUDE_CODE_ENABLED=true
# ANTHROPIC_API_KEY=sk-ant-...

# Optional: which to start with when both are set
# DEFAULT_BRAIN=claudecode`}</pre>
        <button onClick={() => location.reload()} style={{ fontFamily: "monospace", padding: "6px 12px" }}>Reload</button>
      </div>
    </div>
  );
}
