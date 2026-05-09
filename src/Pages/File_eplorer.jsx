import { useEffect, useState } from "react";
import { useApi } from "../Context/ApiContext";
import { useWindows } from "../Context/WindowContext";
import CodeEditor from "./Editor";

// ── tiny icon helpers (SVG, no external dep) ──────────────────
const Icon = ({ d, size = 20, className = "" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  folder:     "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  file:       "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6",
  back:       "M19 12H5M12 5l-7 7 7 7",
  refresh:    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0020.49 15",
  trash:      "M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2",
  save:       "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8 M7 3v5h8",
  close:      "M18 6L6 18M6 6l12 12",
  home:       "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10",
  newfile:    "M12 5v14M5 12h14",
  rename:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  spinner:    "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  list:       "M4 6h16M4 10h16M4 14h16M4 18h16",
  grid:       "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  box:        "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
};

// ── file extension → colour accent ───────────────────────────
function extColor(name) {
  const ext = name.split(".").pop().toLowerCase();
  const map = {
    py: "#3b82f6", js: "#f59e0b", jsx: "#38bdf8", ts: "#3b82f6",
    tsx: "#38bdf8", json: "#a3e635", md: "#c084fc", sh: "#4ade80",
    txt: "#94a3b8", html: "#fb923c", css: "#f472b6", yml: "#fbbf24",
    yaml: "#fbbf24", env: "#86efac", log: "#94a3b8",
  };
  return map[ext] || "#64748b";
}

// ── main component ────────────────────────────────────────────
export default function FileExplorer() {
  const {
    currentPath, dirContents,
    loadingFs, fsError,
    listDir, readFile, deletePath,
    openFile, loadingFile,
  } = useApi();
  const { openWindow } = useWindows();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [renameItem, setRenameItem] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [pathInput, setPathInput] = useState("");  const [viewMode, setViewMode] = useState("list"); // 'list', 'grid', 'box'
  useEffect(() => { listDir(""); }, []);

  const pathParts = currentPath ? currentPath.split("/").filter(Boolean) : [];

  const navigate = (path) => { listDir(path); setPathInput(path); };

  const goBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    navigate(parts.join("/"));
  };

  const handleItemClick = (item) => {
    const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    if (item.type === "folder") navigate(newPath);
    else {
      readFile(newPath);
      openWindow("editor");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const path = currentPath ? `${currentPath}/${confirmDelete}` : confirmDelete;
    await deletePath(path);
    setConfirmDelete(null);
  };

  const handleCreate = async () => {
    if (!newFileName.trim()) return;
    const path = currentPath ? `${currentPath}/${newFileName}` : newFileName;
    await createFile(path);
    setNewFileName("");
  };

  const handleRename = async () => {
    if (!renameItem || !renameName.trim()) return;
    const oldPath = currentPath ? `${currentPath}/${renameItem}` : renameItem;
    const newPath = currentPath ? `${currentPath}/${renameName}` : renameName;
    await renamePath(oldPath, newPath);
    setRenameItem(null);
    setRenameName("");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── directory listing ── */}
      <div className="flex flex-col flex-1 border-r border-[#1e2a38] bg-[#080d13] transition-all duration-200">
        {/* toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e2a38] bg-[#0a0f16]">
          <button
            onClick={() => navigate("")}
            className="p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] transition-colors"
            title="Home"
          >
            <Icon d={ICONS.home} size={16} />
          </button>
          <button
            onClick={goBack}
            disabled={!currentPath}
            className="p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] disabled:opacity-30 transition-colors"
            title="Up"
          >
            <Icon d={ICONS.back} size={16} />
          </button>
          <button
            onClick={() => listDir(currentPath)}
            className="p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] transition-colors"
            title="Refresh"
          >
            <Icon d={ICONS.refresh} size={16} />
          </button>
          <button
            onClick={() => setNewFileName("newfile.txt")}
            className="p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] transition-colors"
            title="New File"
          >
            <Icon d={ICONS.newfile} size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-[#0d1117] border border-[#1e2a38] rounded px-3 py-1.5 text-sm font-mono text-[#8b949e] focus:outline-none focus:border-[#2d5986] transition-colors"
              value={pathInput}
              placeholder="path/to/dir"
              onChange={(e) => setPathInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate(pathInput)}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] transition-colors ${viewMode === "list" ? "bg-[#161f2c] text-[#58a6ff]" : ""}`}
              title="List View"
            >
              <Icon d={ICONS.list} size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] transition-colors ${viewMode === "grid" ? "bg-[#161f2c] text-[#58a6ff]" : ""}`}
              title="Grid View"
            >
              <Icon d={ICONS.grid} size={16} />
            </button>
            <button
              onClick={() => setViewMode("box")}
              className={`p-2 rounded text-[#4a5568] hover:text-[#58a6ff] hover:bg-[#161f2c] transition-colors ${viewMode === "box" ? "bg-[#161f2c] text-[#58a6ff]" : ""}`}
              title="Box View"
            >
              <Icon d={ICONS.box} size={16} />
            </button>
          </div>
        </div>

        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 px-4 py-2 text-sm font-mono text-[#4a5568] border-b border-[#1e2a38] overflow-x-auto whitespace-nowrap">
          <span
            className="hover:text-[#58a6ff] cursor-pointer transition-colors"
            onClick={() => navigate("")}
          >
            ~
          </span>
          {pathParts.map((part, i) => {
            const path = pathParts.slice(0, i + 1).join("/");
            return (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-[#2d3748]">/</span>
                <span
                  className="hover:text-[#58a6ff] cursor-pointer transition-colors"
                  onClick={() => navigate(path)}
                >
                  {part}
                </span>
              </span>
            );
          })}
        </div>

        {/* file list */}
        <div className="flex-1 overflow-y-auto">
          {loadingFs ? (
            <div className="flex items-center justify-center h-32 gap-3 text-[#4a5568] text-base">
              <Icon d={ICONS.spinner} size={16} className="animate-spin" />
              Loading…
            </div>
          ) : fsError ? (
            <div className="m-4 p-4 rounded bg-red-950/40 border border-red-900/40 text-red-400 text-sm font-mono">
              {fsError}
            </div>
          ) : dirContents.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[#2d3748] text-base">
              Empty directory
            </div>
          ) : viewMode === "list" ? (
            <ul className="py-2">
              {dirContents.map((item) => {
                const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                const isOpen = openFile?.path === itemPath;
                return (
                  <li
                    key={item.name}
                    className={`group flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      isOpen
                        ? "bg-[#1a2535] text-[#c9d1d9]"
                        : "text-[#8b949e] hover:bg-[#0f1924] hover:text-[#c9d1d9]"
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.type === "folder" ? (
                      <Icon d={ICONS.folder} size={16} className="text-[#e3b341] flex-shrink-0" />
                    ) : (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" style={{ color: extColor(item.name) }}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    )}
                    <span className="flex-1 text-base font-mono truncate">{item.name}</span>
                    <div className="flex gap-1">
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-blue-400 transition-all"
                        onClick={(e) => { e.stopPropagation(); setRenameItem(item.name); setRenameName(item.name); }}
                      >
                        <Icon d={ICONS.rename} size={14} />
                      </button>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-all"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.name); }}
                      >
                        <Icon d={ICONS.trash} size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-4 gap-4 p-4">
              {dirContents.map((item) => {
                const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                const isOpen = openFile?.path === itemPath;
                return (
                  <div
                    key={item.name}
                    className={`group flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      isOpen
                        ? "bg-[#1a2535] text-[#c9d1d9]"
                        : "text-[#8b949e] hover:bg-[#0f1924] hover:text-[#c9d1d9]"
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.type === "folder" ? (
                      <Icon d={ICONS.folder} size={32} className="text-[#e3b341]" />
                    ) : (
                      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: extColor(item.name) }}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    )}
                    <span className="text-sm font-mono text-center truncate w-full">{item.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:text-blue-400"
                        onClick={(e) => { e.stopPropagation(); setRenameItem(item.name); setRenameName(item.name); }}
                      >
                        <Icon d={ICONS.rename} size={12} />
                      </button>
                      <button
                        className="p-1 rounded hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.name); }}
                      >
                        <Icon d={ICONS.trash} size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === "box" ? (
            <div className="grid grid-cols-2 gap-4 p-4">
              {dirContents.map((item) => {
                const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                const isOpen = openFile?.path === itemPath;
                return (
                  <div
                    key={item.name}
                    className={`group flex flex-col gap-3 p-4 rounded-lg border border-[#1e2a38] cursor-pointer transition-colors ${
                      isOpen
                        ? "bg-[#1a2535] text-[#c9d1d9] border-[#2d5986]"
                        : "text-[#8b949e] hover:bg-[#0f1924] hover:text-[#c9d1d9] hover:border-[#161f2c]"
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center gap-3">
                      {item.type === "folder" ? (
                        <Icon d={ICONS.folder} size={24} className="text-[#e3b341]" />
                      ) : (
                        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: extColor(item.name) }}>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      )}
                      <span className="text-base font-mono truncate">{item.name}</span>
                    </div>
                    <div className="text-xs text-[#4a5568]">
                      {item.type === "folder" ? "Folder" : `File - ${item.name.split(".").pop()?.toUpperCase() || "Unknown"}`}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:text-blue-400"
                        onClick={(e) => { e.stopPropagation(); setRenameItem(item.name); setRenameName(item.name); }}
                      >
                        <Icon d={ICONS.rename} size={14} />
                      </button>
                      <button
                        className="p-1 rounded hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.name); }}
                      >
                        <Icon d={ICONS.trash} size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── delete confirm modal ── */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-[#1e2a38] rounded-lg p-6 w-96 shadow-2xl">
            <p className="text-base text-[#c9d1d9] mb-2">Delete this item?</p>
            <p className="text-sm font-mono text-[#58a6ff] mb-5 truncate">{confirmDelete}</p>
            <p className="text-sm text-[#6b7280] mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded border border-[#1e2a38] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1e2a38] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm rounded bg-red-900 hover:bg-red-800 text-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── create file modal ── */}
      {newFileName && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-[#1e2a38] rounded-lg p-6 w-96 shadow-2xl">
            <p className="text-base text-[#c9d1d9] mb-4">Create new file</p>
            <input
              className="w-full bg-[#0d1117] border border-[#1e2a38] rounded px-3 py-2 text-sm font-mono text-[#c9d1d9] focus:outline-none focus:border-[#2d5986]"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => setNewFileName("")}
                className="px-4 py-2 text-sm rounded border border-[#1e2a38] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1e2a38] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm rounded bg-[#1a7f64] hover:bg-[#238f72] text-white transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── rename modal ── */}
      {renameItem && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-[#1e2a38] rounded-lg p-6 w-96 shadow-2xl">
            <p className="text-base text-[#c9d1d9] mb-2">Rename item</p>
            <p className="text-sm font-mono text-[#58a6ff] mb-4 truncate">{renameItem}</p>
            <input
              className="w-full bg-[#0d1117] border border-[#1e2a38] rounded px-3 py-2 text-sm font-mono text-[#c9d1d9] focus:outline-none focus:border-[#2d5986]"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => { setRenameItem(null); setRenameName(""); }}
                className="px-4 py-2 text-sm rounded border border-[#1e2a38] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1e2a38] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-4 py-2 text-sm rounded bg-[#1a7f64] hover:bg-[#238f72] text-white transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}