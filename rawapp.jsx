import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import { ApiProvider, useApi } from "./Context/ApiContext";
import FileExplorer from "./Pages/File_explorer";
import Dashboard   from "./Pages/Dashboard";
import Terminal     from "./Pages/Terminal";
import Settings     from "./Pages/Settings";

// ─────────────────────────────────────────────────────────────
//  SVG Icons
// ─────────────────────────────────────────────────────────────
const SvgIcon = ({ d, size = "100%" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const GridIcon   = () => <SvgIcon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />;
const FolderIcon = () => <SvgIcon d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />;
const TermIcon   = () => <SvgIcon d="M8 9l3 3-3 3M13 15h3" />;
const CogIcon    = () => <SvgIcon d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />;

// ─────────────────────────────────────────────────────────────
//  App registry
// ─────────────────────────────────────────────────────────────
const APP_DEFS = {
  dashboard: { id:"dashboard", title:"System Dashboard", Icon:GridIcon,   Component:Dashboard,   defaultSize:{w:860,h:560}, defaultPos:{x:80, y:50}, minSize:{w:480,h:340} },
  files:     { id:"files",     title:"File Explorer",    Icon:FolderIcon, Component:FileExplorer,defaultSize:{w:900,h:580}, defaultPos:{x:110,y:60}, minSize:{w:420,h:300} },
  terminal:  { id:"terminal",  title:"Terminal",         Icon:TermIcon,   Component:Terminal,    defaultSize:{w:720,h:460}, defaultPos:{x:160,y:80}, minSize:{w:360,h:240} },
  settings:  { id:"settings",  title:"Settings",         Icon:CogIcon,    Component:Settings,    defaultSize:{w:640,h:500}, defaultPos:{x:200,y:90}, minSize:{w:380,h:300} },
};

// ─────────────────────────────────────────────────────────────
//  Window Manager Context
// ─────────────────────────────────────────────────────────────
const WMCtx = createContext(null);
const useWM = () => useContext(WMCtx);

let _cascade = 0;

function WMProvider({ children }) {
  const [windows, setWindows] = useState([]);
  const zRef = useRef(100);

  const nextZ = () => { zRef.current += 1; return zRef.current; };

  const bringToFront = useCallback((id) => {
    const nz = nextZ();
    setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: nz } : w));
  }, []);

  const openApp = useCallback((appId) => {
    setWindows(ws => {
      const existing = ws.find(w => w.appId === appId);
      if (existing) {
        const nz = nextZ();
        return ws.map(w => w.id === existing.id ? { ...w, minimized: false, zIndex: nz } : w);
      }
      const def = APP_DEFS[appId];
      const off = (_cascade++ % 8) * 26;
      return [...ws, {
        id:        `${appId}-${Date.now()}`,
        appId,
        pos:       { x: def.defaultPos.x + off, y: def.defaultPos.y + off },
        size:      { ...def.defaultSize },
        minimized: false,
        maximized: false,
        zIndex:    nextZ(),
      }];
    });
  }, []);

  const closeApp      = useCallback((id) => setWindows(ws => ws.filter(w => w.id !== id)), []);
  const minimizeApp   = useCallback((id) => setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: true } : w)), []);
  const restoreApp    = useCallback((id) => setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: false, zIndex: nextZ() } : w)), []);
  const toggleMaximize= useCallback((id) => setWindows(ws => ws.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w)), []);
  const updatePos     = useCallback((id, pos)  => setWindows(ws => ws.map(w => w.id === id ? { ...w, pos }  : w)), []);
  const updateSize    = useCallback((id, size) => setWindows(ws => ws.map(w => w.id === id ? { ...w, size } : w)), []);

  return (
    <WMCtx.Provider value={{ windows, openApp, closeApp, minimizeApp, restoreApp, toggleMaximize, bringToFront, updatePos, updateSize }}>
      {children}
    </WMCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
//  Draggable + Resizable Window
// ─────────────────────────────────────────────────────────────
function AppWindow({ win }) {
  const { closeApp, minimizeApp, toggleMaximize, bringToFront, updatePos, updateSize } = useWM();
  const def = APP_DEFS[win.appId];
  const { Component } = def;

  // ── drag ──
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const onTitlePointerDown = (e) => {
    if (win.maximized || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: win.pos.x, oy: win.pos.y };
    bringToFront(win.id);
  };
  const onTitlePointerMove = (e) => {
    if (!drag.current.active) return;
    updatePos(win.id, {
      x: Math.max(0, drag.current.ox + e.clientX - drag.current.sx),
      y: Math.max(32, drag.current.oy + e.clientY - drag.current.sy), // don't go above menubar
    });
  };
  const onTitlePointerUp = () => { drag.current.active = false; };

  // ── resize ──
  const res = useRef({ active: false, dir:"", sx:0, sy:0, ow:0, oh:0, ox:0, oy:0 });

  const onResizePointerDown = (e, dir) => {
    if (win.maximized) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    res.current = { active:true, dir, sx:e.clientX, sy:e.clientY, ow:win.size.w, oh:win.size.h, ox:win.pos.x, oy:win.pos.y };
    bringToFront(win.id);
    e.stopPropagation();
  };
  const onResizePointerMove = (e) => {
    if (!res.current.active) return;
    const { dir, sx, sy, ow, oh, ox, oy } = res.current;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    let nw=ow, nh=oh, nx=ox, ny=oy;
    if (dir.includes("e")) nw = Math.max(def.minSize.w, ow+dx);
    if (dir.includes("s")) nh = Math.max(def.minSize.h, oh+dy);
    if (dir.includes("w")) { nw=Math.max(def.minSize.w, ow-dx); nx=ox+(ow-nw); }
    if (dir.includes("n")) { nh=Math.max(def.minSize.h, oh-dy); ny=oy+(oh-nh); ny=Math.max(32, ny); }
    updateSize(win.id, { w:nw, h:nh });
    updatePos(win.id,  { x:nx, y:ny });
  };
  const onResizePointerUp = () => { res.current.active = false; };

  const wStyle = win.maximized
    ? { position:"fixed", left:0, right:0, top:32, bottom:48, zIndex: win.zIndex }
    : { position:"fixed", left: win.pos.x, top: win.pos.y, width: win.size.w, height: win.size.h, zIndex: win.zIndex };

  if (win.minimized) return null;

  const E = 6; // edge px

  return (
    <div
      style={wStyle}
      className="flex flex-col rounded-lg overflow-hidden border border-[#1e2a38] bg-[#080d13]"
      onPointerDown={() => bringToFront(win.id)}
      onPointerMove={(e) => { onTitlePointerMove(e); onResizePointerMove(e); }}
      onPointerUp={() => { onTitlePointerUp(); onResizePointerUp(); }}
    >
      {/* ── title bar ── */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0 h-9 bg-[#0a0f16] border-b border-[#1e2a38] cursor-default"
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => toggleMaximize(win.id)}
        style={{ userSelect: "none" }}
      >
        {/* traffic lights */}
        <button className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-125 flex-shrink-0 transition-all"
          onPointerDown={e=>e.stopPropagation()} onClick={()=>closeApp(win.id)} />
        <button className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-125 flex-shrink-0 transition-all"
          onPointerDown={e=>e.stopPropagation()} onClick={()=>minimizeApp(win.id)} />
        <button className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-125 flex-shrink-0 transition-all"
          onPointerDown={e=>e.stopPropagation()} onClick={()=>toggleMaximize(win.id)} />

        {/* centred title */}
        <div className="flex-1 flex items-center justify-center gap-1.5 pointer-events-none min-w-0">
          <span className="text-[#4a5568] w-3.5 h-3.5 flex-shrink-0"><def.Icon /></span>
          <span className="text-xs text-[#6b7280] font-medium tracking-wide truncate">{def.title}</span>
        </div>
        <div className="w-16 flex-shrink-0" />
      </div>

      {/* ── content ── */}
      <div className="flex-1 overflow-hidden">
        <Component />
      </div>

      {/* ── resize handles ── */}
      {!win.maximized && <>
        {[
          ["e",  {right:0,top:E,bottom:E,width:E,cursor:"ew-resize"}],
          ["w",  {left:0,top:E,bottom:E,width:E,cursor:"ew-resize"}],
          ["s",  {bottom:0,left:E,right:E,height:E,cursor:"ns-resize"}],
          ["n",  {top:0,left:E,right:E,height:E,cursor:"ns-resize"}],
          ["se", {right:0,bottom:0,width:E*2,height:E*2,cursor:"nwse-resize"}],
          ["sw", {left:0,bottom:0,width:E*2,height:E*2,cursor:"nesw-resize"}],
          ["ne", {right:0,top:0,width:E*2,height:E*2,cursor:"nesw-resize"}],
          ["nw", {left:0,top:0,width:E*2,height:E*2,cursor:"nwse-resize"}],
        ].map(([dir, s]) => (
          <div key={dir} style={{ position:"absolute", ...s }}
            onPointerDown={e=>onResizePointerDown(e,dir)} />
        ))}
      </>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Desktop icon
// ─────────────────────────────────────────────────────────────
function DesktopIcon({ def, onOpen }) {
  const [press, setPress] = useState(false);
  return (
    <button
      onDoubleClick={onOpen}
      onPointerDown={()=>setPress(true)}
      onPointerUp={()=>setPress(false)}
      onPointerLeave={()=>setPress(false)}
      className={`flex flex-col items-center gap-1.5 w-[68px] px-1 py-2 rounded-xl transition-all outline-none ${press?"bg-white/5":"hover:bg-white/[0.03]"}`}
      title={`Double-click: ${def.title}`}
    >
      <div className="w-11 h-11 rounded-2xl bg-[#0a0f16] border border-[#1e2a38] flex items-center justify-center text-[#58a6ff]">
        <span className="w-5 h-5"><def.Icon /></span>
      </div>
      <span className="text-[10px] text-[#6b7280] text-center leading-tight">{def.title}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  Taskbar window button
// ─────────────────────────────────────────────────────────────
function TaskbarBtn({ win }) {
  const { bringToFront, minimizeApp, restoreApp } = useWM();
  const def = APP_DEFS[win.appId];

  const handleClick = () => {
    if (win.minimized) restoreApp(win.id);
    else minimizeApp(win.id);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all max-w-[160px] ${
        win.minimized
          ? "text-[#4a5568] border border-[#1a2030]"
          : "text-[#8b949e] bg-[#0f1924] border border-[#1a2535]"
      }`}
    >
      <span className="w-3 h-3 flex-shrink-0 text-[#58a6ff]"><def.Icon /></span>
      <span className="truncate">{def.title}</span>
      {win.minimized && <span className="ml-auto text-[#2d3748]">–</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  Desktop (root canvas)
// ─────────────────────────────────────────────────────────────
function fmtTime() {
  return new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

function Desktop() {
  const { windows, openApp } = useWM();
  const { sysStats } = useApi();
  const [time, setTime] = useState(fmtTime);

  useEffect(() => {
    const t = setInterval(() => setTime(fmtTime()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="w-screen h-screen overflow-hidden relative bg-[#050a0f]"
      style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace" }}
    >
      {/* grid wallpaper */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:"linear-gradient(#0c1520 1px,transparent 1px),linear-gradient(90deg,#0c1520 1px,transparent 1px)",
        backgroundSize:"52px 52px", opacity:0.55,
      }}/>
      {/* radial vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:"radial-gradient(ellipse at 50% 50%, transparent 35%, #020508 100%)"
      }}/>

      {/* ── menubar ── */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-[#060b11]/95 backdrop-blur-md border-b border-[#1a2030] flex items-center px-4 gap-5 z-[9999] flex-shrink-0">
        <span className="text-xs font-bold text-[#58a6ff] tracking-[0.2em]">PI-DASH</span>
        <span className="w-px h-4 bg-[#1a2030]"/>
        <div className="flex-1"/>
        <span className="text-[10px] font-mono text-[#3d4f60]">
          CPU <span className="text-[#38bdf8]">{sysStats.cpu}%</span>
        </span>
        <span className="text-[10px] font-mono text-[#3d4f60]">
          MEM <span className="text-[#a78bfa]">{sysStats.mem}%</span>
        </span>
        <span className="text-[10px] font-mono text-[#3d4f60]">
          DISK <span className="text-[#34d399]">{sysStats.disk}%</span>
        </span>
        <span className="w-px h-4 bg-[#1a2030]"/>
        <span className="text-xs font-mono text-[#6b7280]">{time}</span>
      </div>

      {/* ── desktop icons (left column) ── */}
      <div className="absolute top-10 left-4 flex flex-col gap-3 z-10">
        {Object.values(APP_DEFS).map(def => (
          <DesktopIcon key={def.id} def={def} onOpen={() => openApp(def.id)} />
        ))}
      </div>

      {/* ── windows ── */}
      {windows.map(win => <AppWindow key={win.id} win={win} />)}

      {/* ── taskbar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-11 bg-[#060b11]/95 backdrop-blur-md border-t border-[#1a2030] flex items-center px-3 gap-2 z-[9999]">

        {/* app launchers */}
        {Object.values(APP_DEFS).map(def => {
          const openWins = windows.filter(w => w.appId === def.id);
          const hasOpen  = openWins.length > 0;
          const hasVisible = openWins.some(w => !w.minimized);
          return (
            <button
              key={def.id}
              onClick={() => openApp(def.id)}
              title={def.title}
              className={`relative flex flex-col items-center justify-center w-10 h-8 rounded-md transition-all ${
                hasOpen ? "text-[#58a6ff] bg-[#0f1924]" : "text-[#3d4f60] hover:text-[#6b7280] hover:bg-[#0a1018]"
              }`}
            >
              <span className="w-4 h-4"><def.Icon /></span>
              {hasOpen && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${hasVisible ? "bg-[#58a6ff]" : "bg-[#2d3748]"}`}/>
              )}
            </button>
          );
        })}

        {windows.length > 0 && <span className="w-px h-5 bg-[#1a2030] mx-1"/>}

        {/* open window pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1">
          {windows.map(win => <TaskbarBtn key={win.id} win={win} />)}
        </div>

        <div className="flex-shrink-0 text-[10px] font-mono text-[#1e2a38] ml-2">
          {windows.length}w
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Root export
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ApiProvider>
      <WMProvider>
        <Desktop />
      </WMProvider>
    </ApiProvider>
  );
}