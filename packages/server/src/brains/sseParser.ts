export interface ParserHandlers {
  onToken: (text: string) => void;
  onQuestion: (text: string) => void;
  onResult: (text: string) => void;
}

const QUESTION = "❓QUESTION:";
const DONE = "✅DONE:";
const maxMarkerLen = Math.max(QUESTION.length, DONE.length);

/**
 * Parses an OpenAI-compatible SSE stream and accumulates assistant text,
 * watching for the QUESTION / DONE protocol markers. Markers may be split
 * across chunks, so we scan the running buffer. At end(), if no marker fired,
 * the accumulated text is emitted as the result (fallback so agents never hang).
 */
export class OpenClawStreamParser {
  private lineBuf = "";   // SSE line assembly
  private text = "";      // accumulated assistant content
  private emitted = 0;    // how many chars of this.text have been emitted as tokens
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

  /** Returns the length of the longest suffix of this.text that is a prefix of either marker. */
  private holdbackLen(): number {
    const t = this.text;
    const max = Math.min(maxMarkerLen, t.length);
    for (let L = max; L >= 1; L--) {
      const suf = t.slice(t.length - L);
      if (QUESTION.startsWith(suf) || DONE.startsWith(suf)) return L;
    }
    return 0;
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
    // Emit only the portion of text that cannot be the start of a marker.
    const safeEnd = this.text.length - this.holdbackLen();
    if (safeEnd > this.emitted) {
      const out = this.text.slice(this.emitted, safeEnd);
      this.emitted = safeEnd;
      if (out) this.h.onToken(out);
    }
  }

  end(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.h.onResult(this.text.trim());
  }
}
