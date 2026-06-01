const MAX = 70;
const clip = (s: string) => (s.length > MAX ? s.slice(0, MAX - 1) + "…" : s);

/** Short human description of a tool-use the agent is asking permission for. */
export function summarize(tool: string, input: Record<string, unknown>): string {
  if (tool === "Bash" && typeof input.command === "string") return clip(`Run: ${input.command}`);
  if ((tool === "Edit" || tool === "Write" || tool === "MultiEdit") && typeof input.file_path === "string")
    return clip(`Edit: ${input.file_path}`);
  return clip(`Use: ${tool}`);
}
