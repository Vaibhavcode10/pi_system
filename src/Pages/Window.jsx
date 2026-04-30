import { useState, useEffect } from "react";

export default function Window({
  win,
  updateWindow,
  closeWindow,
  bringToFront,
  children,
}) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const move = (e) => {
      const W = window.innerWidth;
      const H = window.innerHeight - 56;

      if (dragging && !win.maximized) {
        let x = e.clientX - offset.x;
        let y = e.clientY - offset.y;

        x = Math.max(0, Math.min(x, W - win.width));
        y = Math.max(0, Math.min(y, H - win.height));

        updateWindow(win.id, { x, y });
      }

      if (resizing && !win.maximized) {
        const dx = e.clientX - startMouse.x;
        const dy = e.clientY - startMouse.y;

        let width = Math.max(320, startSize.w + dx);
        let height = Math.max(200, startSize.h + dy);

        width = Math.min(width, W - win.x);
        height = Math.min(height, H - win.y);

        updateWindow(win.id, { width, height });
      }
    };

    const up = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, resizing, offset, startMouse, startSize, win]);

  const maximize = () => {
    if (!win.maximized) {
      updateWindow(win.id, {
        prev: { x: win.x, y: win.y, width: win.width, height: win.height },
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight - 56,
        maximized: true,
      });
    } else {
      updateWindow(win.id, {
        ...win.prev,
        maximized: false,
      });
    }
  };

  return (
    <div
      onMouseDown={() => bringToFront(win.id)}
      className="absolute bg-[#0a0f16] border border-[#1e2a38] rounded-xl shadow-2xl flex flex-col"
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.z + 100, // 🔥 FIX
      }}
    >
      <div
        onMouseDown={(e) => {
          setDragging(true);
          setOffset({
            x: e.clientX - win.x,
            y: e.clientY - win.y,
          });
        }}
        className="flex justify-between items-center px-3 py-2 bg-[#111827] cursor-move select-none"
      >
        <span className="text-xs">{win.type}</span>

        <div className="flex gap-2">
          <button onClick={() => updateWindow(win.id, { minimized: true })}>
            🟡
          </button>
          <button onClick={maximize}>
            {win.maximized ? "🗗" : "🟢"}
          </button>
          <button onClick={() => closeWindow(win.id)}>❌</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>

      {!win.maximized && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setResizing(true);
            setStartMouse({ x: e.clientX, y: e.clientY });
            setStartSize({ w: win.width, h: win.height });
          }}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        />
      )}
    </div>
  );
}