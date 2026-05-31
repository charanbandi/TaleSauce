export interface ParserHandlers {
  onToken: (text: string) => void;
  onQuestion: (text: string) => void;
  onResult: (text: string) => void;
}

const QUESTION = "❓QUESTION:";
const DONE = "✅DONE:";

/**
 * Parses an OpenAI-compatible SSE stream and accumulates assistant text,
 * watching for the QUESTION / DONE protocol markers. Markers may be split
 * across chunks, so we scan the running buffer. At end(), if no marker fired,
 * the accumulated text is emitted as the result (fallback so agents never hang).
 */
export class OpenClawStreamParser {
  private lineBuf = "";   // SSE line assembly
  private text = "";      // accumulated assistant content
  private resolved = false;

  constructor(private h: ParserHandlers) {}

  push(chunk: string): void {
    this.lineBuf += chunk;
    const lines = this.lineBuf.split("\n");
    this.lineBuf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]" || data === "") continue;
      let delta = "";
      try {
        delta = JSON.parse(data)?.choices?.[0]?.delta?.content ?? "";
      } catch {
        continue; // skip malformed line
      }
      if (delta) this.consume(delta);
    }
  }

  private consume(delta: string): void {
    if (this.resolved) return;
    this.text += delta;
    // Check markers against the running buffer (handles split markers).
    const qi = this.text.indexOf(QUESTION);
    if (qi !== -1) {
      this.resolved = true;
      this.h.onQuestion(this.text.slice(qi + QUESTION.length).trim());
      return;
    }
    const di = this.text.indexOf(DONE);
    if (di !== -1) {
      this.resolved = true;
      this.h.onResult(this.text.slice(di + DONE.length).trim());
      return;
    }
    this.h.onToken(delta);
  }

  end(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.h.onResult(this.text.trim());
  }
}
