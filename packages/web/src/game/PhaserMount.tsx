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
      scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
      scene: scene === "farm" ? [FarmScene] : [OfficeScene],
    });
    gameRef.current = game;

    // Phaser's RESIZE mode only reacts to *window* resizes, not parent/flex changes
    // (e.g. the pane starting at 0px, or opening the bottom chat drawer). Track the pane.
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0) game.scale.resize(w, h);
    });
    ro.observe(el);

    return () => { ro.disconnect(); game.destroy(true); gameRef.current = null; };
  }, [scene]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
