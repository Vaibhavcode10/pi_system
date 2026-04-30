import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useApi } from "../Context/ApiContext";

// Helper to detect language from file extension
function getLanguageFromPath(path) {
  const ext = path.split(".").pop().toLowerCase();
  const langMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    html: "html",
    css: "css",
    py: "python",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sql: "sql",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
  };
  return langMap[ext] || "plaintext";
}

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

// Icon helper (reuse from FileExplorer)
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
  save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8 M7 3v5h8",
  close: "M18 6L6 18M6 6l12 12",
  open: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6",
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6",
  spinner: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
};

export default function CodeEditor() {
  const { openFile, closeFile, writeFile, savingFile, readFile, BASE_URL } = useApi();
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [pickerPath, setPickerPath] = useState("");
  const [pickerContents, setPickerContents] = useState([]);

  useEffect(() => {
    if (openFile) {
      setContent(openFile.content || "");
      setDirty(false);
      setLoading(false);
    } else {
      setContent("");
      setDirty(false);
    }
  }, [openFile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = async () => {
    if (!openFile) return;
    setLoading(true);
    const ok = await writeFile(openFile.path, content);
    if (ok) setDirty(false);
    setLoading(false);
  };

  const handleEditorChange = (value) => {
    setContent(value);
    setDirty(true);
  };

  const handleOpenFile = async () => {
    setShowFilePicker(true);
    setPickerPath("");
    await loadPickerContents("");
  };

  const loadPickerContents = async (path) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/fs?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPickerContents(data.items || []);
      setPickerPath(data.path || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickerItemClick = async (item) => {
    const newPath = pickerPath ? `${pickerPath}/${item.name}` : item.name;
    if (item.type === "folder") {
      await loadPickerContents(newPath);
    } else {
      await readFile(newPath);
      setShowFilePicker(false);
    }
  };

  const filename = openFile ? openFile.path.split("/").pop() : "Untitled";

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2a38] bg-[#0a0f16]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base font-mono text-[#c9d1d9] truncate">
            {filename}
          </span>
          {dirty && <span className="text-sm text-amber-400 ml-1">●</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenFile}
            className="flex items-center gap-2 px-4 py-1.5 text-sm rounded bg-[#1a7f64] hover:bg-[#238f72] text-white transition-colors"
          >
            <Icon d={ICONS.open} size={15} />
            Open File
          </button>
          <button
            onClick={handleSave}
            disabled={savingFile || loading || !dirty}
            className="flex items-center gap-2 px-4 py-1.5 text-sm rounded bg-[#1a7f64] hover:bg-[#238f72] disabled:opacity-40 text-white transition-colors"
          >
            <Icon d={ICONS.save} size={15} />
            {savingFile || loading ? "Saving…" : "Save"}
          </button>
          <button
            onClick={closeFile}
            className="p-1.5 rounded text-[#6b7280] hover:text-[#c9d1d9] hover:bg-[#1e2a38] transition-colors"
          >
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>
      </div>
      {/* Monaco Editor */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#4a5568]">
            Loading…
          </div>
        ) : (
          <Editor
            height="100%"
            language={openFile ? getLanguageFromPath(openFile.path) : "plaintext"}
            value={content}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        )}
      </div>

      <FilePicker
        isOpen={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSelect={handlePickerItemClick}
        contents={pickerContents}
        path={pickerPath}
        loading={loading}
        onNavigate={loadPickerContents}
      />
    </div>
  );
}

// ── File Picker Modal ──
function FilePicker({ isOpen, onClose, onSelect, contents, path, loading, onNavigate }) {
  if (!isOpen) return null;

  const pathParts = path ? path.split("/").filter(Boolean) : [];

  const goBack = () => {
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    onNavigate(parts.join("/"));
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#1e2a38] rounded-lg w-96 h-96 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a38]">
          <div className="flex items-center gap-2">
            <button onClick={goBack} disabled={!path} className="p-1 rounded text-[#4a5568] hover:text-[#58a6ff] disabled:opacity-30">
              <Icon d={ICONS.back} size={16} />
            </button>
            <span className="text-[#c9d1d9] font-mono text-sm">Open File</span>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#c9d1d9]">
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>
        <div className="px-4 py-2 text-xs font-mono text-[#4a5568] border-b border-[#1e2a38]">
          <span className="hover:text-[#58a6ff] cursor-pointer" onClick={() => onNavigate("")}>~</span>
          {pathParts.map((part, i) => {
            const p = pathParts.slice(0, i + 1).join("/");
            return (
              <span key={i} className="flex items-center">
                <span className="text-[#2d3748]">/</span>
                <span className="hover:text-[#58a6ff] cursor-pointer" onClick={() => onNavigate(p)}>{part}</span>
              </span>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Icon d={ICONS.spinner} size={16} className="animate-spin" />
            </div>
          ) : (
            <ul>
              {contents.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#1e2a38] rounded"
                  onClick={() => onSelect(item)}
                >
                  {item.type === "folder" ? (
                    <Icon d={ICONS.folder} size={16} className="text-[#e3b341]" />
                  ) : (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: extColor(item.name) }}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  )}
                  <span className="text-[#c9d1d9] font-mono">{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}