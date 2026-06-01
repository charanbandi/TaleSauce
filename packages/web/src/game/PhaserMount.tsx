import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { FarmScene } from "./scenes/FarmScene.js";
import { OfficeScene } from "./scenes/OfficeScene.js";

export function PhaserMount({ scene }: { scene: "farm" | "office" }) {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ref.current,
      backgroundColor: "#000",
      pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
      scene: scene === "farm" ? [FarmScene] : [OfficeScene],
    });
    gameRef.current = game;
    return () => { game.destroy(true); gameRef.current = null; };
  }, [scene]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
