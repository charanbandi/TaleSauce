export function DraggableDivider({ onDrag }: { onDrag: (clientX: number) => void }) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        const move = (ev: MouseEvent) => onDrag(ev.clientX);
        const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      }}
      style={{ width: 6, cursor: "col-resize", background: "#241a14", flex: "0 0 6px" }}
    />
  );
}
