import type { AgentVisualState } from "@talesauce/shared";

export type MoveTarget = "wander" | "workstation" | "front";
export type BubbleKind = "none" | "thinking" | "question" | "result" | "alert" | "permission";

export interface SpriteIntent {
  move: MoveTarget;
  anim: string;
  bubble: BubbleKind;
}

/** Pure mapping from server-authoritative state → what the sprite should do. */
export function nextSpriteIntent(state: AgentVisualState): SpriteIntent {
  switch (state) {
    case "going-to-workstation":
    case "working":
      return { move: "workstation", anim: "work-loop", bubble: "thinking" };
    case "walking-to-front":
      return { move: "front", anim: "walk", bubble: "thinking" };
    case "awaiting-permission":
      return { move: "front", anim: "wave", bubble: "permission" };
    case "awaiting-user":
      return { move: "front", anim: "wave", bubble: "question" };
    case "reporting":
      return { move: "front", anim: "talk", bubble: "result" };
    case "error":
      return { move: "wander", anim: "idle", bubble: "alert" };
    case "idle":
    default:
      return { move: "wander", anim: "idle", bubble: "none" };
  }
}
