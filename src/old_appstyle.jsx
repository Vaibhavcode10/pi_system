import { useState } from "react";
import { ApiProvider, useApi } from "./Context/ApiContext";
import FileExplorer from "./Pages/File_eplorer";
import Dashboard   from "./Pages/Dashboard";
import Terminal     from "./Pages/Terminal";
import Settings     from "./Pages/Settings";

// ── icon helper ───────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  },
  {
    id: "files",
    label: "Files",
    icon: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: "M8 9l3 3-3 3M13 15h3",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  },
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  files:     "File Explorer",
  terminal:  "Terminal",
  settings:  "Settings",
};

function StatusDot() {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#4a5568]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
      connected
    </span>
  );
}

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const { sysStats } = useApi();

  const renderPage = () => {
    if (page === "files")     return <FileExplorer />;
    if (page === "terminal")  return <Terminal />;
    if (page === "settings")  return <Settings />;
    return <Dashboard />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080d13] text-[#c9d1d9]" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>

      {/* ── sidebar ── */}
      <aside
        className={`flex flex-col border-r border-[#1e2a38] bg-[#080d13] transition-all duration-200 ${
          collapsed ? "w-14" : "w-52"
        } flex-shrink-0`}
      >
        {/* logo / toggle */}
        <div className="flex items-center justify-between px-3 h-12 border-b border-[#1e2a38]">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-[#1a7f64] flex items-center justify-center flex-shrink-0">
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 9l3 3-3 3M13 15h3" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[#c9d1d9] tracking-tight truncate">PI-DASH</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded text-[#4a5568] hover:text-[#8b949e] hover:bg-[#0f1924] transition-colors ml-auto"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {collapsed
                ? <path d="M9 18l6-6-6-6" />
                : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 py-2 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-all group ${
                  active
                    ? "bg-[#161f2c] text-[#58a6ff]"
                    : "text-[#4a5568] hover:bg-[#0f1924] hover:text-[#8b949e]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`flex-shrink-0 ${active ? "text-[#58a6ff]" : "text-[#4a5568] group-hover:text-[#8b949e]"}`}>
                  <Icon d={item.icon} size={16} />
                </span>
                {!collapsed && (
                  <span className="text-xs font-medium">{item.label}</span>
                )}
                {!collapsed && active && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-[#58a6ff]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* bottom stats pill */}
        {!collapsed && (
          <div className="mx-2 mb-3 p-2.5 rounded-lg bg-[#0a0f16] border border-[#1e2a38] space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#4a5568]">CPU</span>
              <span className="text-[#38bdf8]">{sysStats.cpu}%</span>
            </div>
            <div className="h-1 bg-[#1e2a38] rounded-full overflow-hidden">
              <div className="h-full bg-[#38bdf8] rounded-full transition-all duration-700" style={{ width: `${sysStats.cpu}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#4a5568]">MEM</span>
              <span className="text-[#a78bfa]">{sysStats.mem}%</span>
            </div>
            <div className="h-1 bg-[#1e2a38] rounded-full overflow-hidden">
              <div className="h-full bg-[#a78bfa] rounded-full transition-all duration-700" style={{ width: `${sysStats.mem}%` }} />
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="px-3 pb-3">
            <StatusDot />
          </div>
        )}
      </aside>

      {/* ── main ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* topbar */}
        <header className="flex items-center justify-between px-4 h-12 border-b border-[#1e2a38] bg-[#080d13] flex-shrink-0">
          <h2 className="text-sm font-semibold text-[#c9d1d9] tracking-tight">
            {PAGE_TITLES[page]}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#4a5568]">
              uptime: {sysStats.uptime}
            </span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 overflow-hidden relative">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ApiProvider>
      <AppShell />
    </ApiProvider>
  );
}