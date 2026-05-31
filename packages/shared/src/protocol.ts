import type { ServerEvent } from "./events.js";

export function encodeEvent(e: ServerEvent): string {
  return JSON.stringify(e);
}

export function decodeEvent(raw: string): ServerEvent | null {
  try {
    const v = JSON.parse(raw);
    // NOTE: only checks `type` is a string, not that it's a known variant. Tighten in Phase 2.
    if (v && typeof v === "object" && typeof v.type === "string") return v as ServerEvent;
    return null;
  } catch {
    return null;
  }
}
