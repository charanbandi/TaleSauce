import type { CSSProperties, ReactNode } from "react";

/** Shared 8-bit / Stardew-ish styling for the config & add-agent panels. */
export const PIX = {
  parchment: "#f3ead6",
  ink: "#3a2a1a",
  wood: "#b5895a",
  woodDark: "#8a6a3f",
  accent: "#e8c87a",
  green: "#4a8c2a",
  red: "#c0392b",
  field: "#fffdf5",
};

export const pixelInput: CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "8px 10px",
  fontFamily: "monospace", fontSize: 13, color: PIX.ink,
  background: PIX.field, border: `2px solid ${PIX.wood}`, borderRadius: 6, outline: "none",
};

export function PixelField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold", color: "#6b4a26", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      {children}
      {hint && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#9a7b54", marginTop: 3 }}>{hint}</div>}
    </label>
  );
}

export function PixelButton({ children, onClick, variant = "neutral", disabled, style }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "danger" | "neutral"; disabled?: boolean; style?: CSSProperties;
}) {
  const bg = variant === "primary" ? PIX.green : variant === "danger" ? PIX.red : "#cdb892";
  const fg = variant === "neutral" ? PIX.ink : "#fff";
  const shadow = variant === "primary" ? "#356619" : variant === "danger" ? "#8e2b20" : "#a8916a";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        fontFamily: "monospace", fontSize: 12, fontWeight: "bold", color: fg, background: bg,
        border: "none", borderRadius: 6, padding: "7px 14px", cursor: disabled ? "default" : "pointer",
        boxShadow: `0 3px 0 ${shadow}`, opacity: disabled ? 0.5 : 1, transition: "transform .05s",
        ...style,
      }}>{children}</button>
  );
}

/** A bordered parchment card with a wood frame — the panel container. */
export const pixelCard: CSSProperties = {
  background: PIX.parchment, border: `3px solid ${PIX.wood}`, borderRadius: 10,
  boxShadow: `0 3px 0 ${PIX.woodDark}`, padding: 14,
};
