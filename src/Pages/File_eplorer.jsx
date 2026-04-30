import { useEffect, useState } from "react";
import { useApi } from "../Context/ApiContext";

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
  spinner:    "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
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

// ── inline editor ─────────────────────────────────────────────
function Editor() {
  const { openFile, closeFile, writeFile, savingFile } = useApi();
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (openFile) { setContent(openFile.content); setDirty(false); }
  }, [openFile]);

  if (!openFile) return null;

  const filename = openFile.path.split("/").pop();

  const handleSave = async () => {
    const ok = await writeFile(openFile.path, content);
    if (ok) setDirty(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* editor topbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2a38] bg-[#0a0f16]">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: extColor(filename) }}
          />
          <span className="text-base font-mono text-[#c9d1d9] truncate">{filename}</span>
          {dirty && <span className="text-sm text-amber-400 ml-1">●</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={savingFile || !dirty}
            className="flex items-center gap-2 px-4 py-1.5 text-sm rounded bg-[#1a7f64] hover:bg-[#238f72] disabled:opacity-40 text-white transition-colors"
          >
            <Icon d={ICONS.save} size={15} />
            {savingFile ? "Saving…" : "Save"}
          </button>
          <button
            onClick={closeFile}
            className="p-1.5 rounded text-[#6b7280] hover:text-[#c9d1d9] hover:bg-[#1e2a38] transition-colors"
          >
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>
      </div>
      {/* textarea */}
      <textarea
        className="flex-1 w-full bg-transparent text-[#c9d1d9] font-mono text-base p-5 resize-none focus:outline-none leading-7"
        style={{ tabSize: 2 }}
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true); }}
        spellCheck={false}
      />
    </div>
  );
}

// ── main component ────────────────────────────────────────────
export default function FileExplorer() {
  const {
    currentPath, dirContents,
    loadingFs, fsError,
    listDir, readFile, deletePath,
    openFile, loadingFile,
  } = useApi();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pathInput, setPathInput] = useState("");

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
    else readFile(newPath);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const path = currentPath ? `${currentPath}/${confirmDelete}` : confirmDelete;
    await deletePath(path);
    setConfirmDelete(null);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── left pane: directory listing ── */}
      <div
        className={`flex flex-col ${openFile ? "w-80 flex-shrink-0" : "flex-1"} border-r border-[#1e2a38] bg-[#080d13] transition-all duration-200`}
      >
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
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-[#0d1117] border border-[#1e2a38] rounded px-3 py-1.5 text-sm font-mono text-[#8b949e] focus:outline-none focus:border-[#2d5986] transition-colors"
              value={pathInput}
              placeholder="path/to/dir"
              onChange={(e) => setPathInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate(pathInput)}
            />
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
          ) : (
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
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-all"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.name); }}
                    >
                      <Icon d={ICONS.trash} size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── right pane: editor ── */}
      {openFile && (
        <div className="flex-1 overflow-hidden">
          {loadingFile ? (
            <div className="flex items-center justify-center h-full gap-3 text-[#4a5568]">
              <Icon d={ICONS.spinner} size={18} className="animate-spin" />
              <span className="text-base">Loading file…</span>
            </div>
          ) : (
            <Editor />
          )}
        </div>
      )}

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
    </div>
  );
}