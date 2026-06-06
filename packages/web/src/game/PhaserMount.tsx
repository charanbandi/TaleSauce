import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { FarmScene } from "./scenes/FarmScene.js";
import { OfficeScene } from "./scenes/OfficeScene.js";

export function PhaserMount({ scene }: { scene: "farm" | "office" }) {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: el,
      backgroundColor: "#000",
      pixelArt: true,
      // NONE = we control the size explicitly via the ResizeObserver below. This is
      // deterministic; RESIZE mode only reacts to window (not parent/flex) changes and
      // can leave the canvas stuck at 0×0 when a pane starts collapsed.
      scale: { mode: Phaser.Scale.NONE, width: Math.max(1, el.clientWidth), height: Math.max(1, el.clientHeight) },
      scene: scene === "farm" ? [FarmScene] : [OfficeScene],
    });
    gameRef.current = game;

    // Keep the game sized to its pane (initial layout + divider drag + bottom drawer).
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0 && (w !== game.scale.width || h !== game.scale.height)) game.scale.resize(w, h);
    });
    ro.observe(el);

    return () => { ro.disconnect(); game.destroy(true); gameRef.current = null; };
  }, [scene]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
