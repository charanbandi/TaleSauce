import type { AgentBrain, BrainListener, BrainEvent } from "./AgentBrain.js";
import { OpenClawStreamParser } from "./sseParser.js";

export interface OpenClawConfig {
  url: string;
  key: string;
  model?: string;
  systemPrompt: string;
  history: { role: string; content: string }[];
}

export class OpenClawBrain implements AgentBrain {
  private listeners: BrainListener[] = [];
  private controller?: AbortController;
  private convo: { role: string; content: string }[];

  constructor(private cfg: OpenClawConfig, private fetchImpl: typeof fetch = fetch) {
    this.convo = [...cfg.history];
  }

  on(l: BrainListener) { this.listeners.push(l); }
  private emit(e: BrainEvent) { for (const l of this.listeners) l(e); }

  start(task: string) { this.run(task); }
  send(userReply: string) { this.run(userReply); }
  stop() { this.controller?.abort(); }

  private async run(userText: string) {
    this.convo.push({ role: "user", content: userText });
    this.emit({ type: "state", state: "working" });

    const messages = [{ role: "system", content: this.cfg.systemPrompt }, ...this.convo];
    this.controller = new AbortController();
    let res: Response;
    try {
      res = await this.fetchImpl(this.cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.cfg.key}` },
        body: JSON.stringify({ messages, model: this.cfg.model, stream: true, temperature: 0.7 }),
        signal: this.controller.signal,
      });
    } catch {
      this.emit({ type: "error", message: "OpenClaw is unreachable. Try again in a moment." });
      this.emit({ type: "state", state: "error" });
      return;
    }
    if (!res.ok || !res.body) {
      const detail = !res.ok ? `HTTP ${res.status}` : "no body";
      this.emit({ type: "error", message: `OpenClaw error (${detail}).` });
      this.emit({ type: "state", state: "error" });
      return;
    }

    const parser = new OpenClawStreamParser({
      onToken: (t) => { this.emit({ type: "token", text: t }); },
      onQuestion: (t) => {
        this.convo.push({ role: "assistant", content: `❓QUESTION: ${t}` });
        this.emit({ type: "state", state: "needs-input" });
        this.emit({ type: "question", text: t });
      },
      onResult: (t) => {
        this.convo.push({ role: "assistant", content: t });
        this.emit({ type: "state", state: "reporting" });
        this.emit({ type: "result", text: t });
        this.emit({ type: "state", state: "done" });
      },
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.push(decoder.decode(value, { stream: true }));
      }
    } catch {
      // network cut mid-stream: fall through to end() so we still resolve
    } finally {
      if (!this.controller?.signal.aborted) {
        parser.end();
      }
    }
  }
}
