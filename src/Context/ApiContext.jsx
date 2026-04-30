 import { createContext, useContext, useState, useCallback } from "react";

const ApiContext = createContext(null);

const BASE_URL = "http://136.115.159.104:5005";

export function ApiProvider({ children }) {
  const [currentPath, setCurrentPath] = useState("");
  const [dirContents, setDirContents] = useState([]);
  const [loadingFs, setLoadingFs] = useState(false);
  const [fsError, setFsError] = useState(null);

  const [openFile, setOpenFile] = useState(null); // { path, content }
  const [loadingFile, setLoadingFile] = useState(false);
  const [savingFile, setSavingFile] = useState(false);

  //stats
  const [processList, setProcessList] = useState([]);
const [loadingProcess, setLoadingProcess] = useState(false);

  // System stats (polled externally)
  const [sysStats, setSysStats] = useState({
    cpu: 0,
    mem: 0,
    disk: 0,
    uptime: "—",
  });

  //terminal commnds
  const runTerminalCommand = useCallback(async (command) => {
  try {
    const res = await fetch(`${BASE_URL}/terminal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    return data.output || "";
  } catch (e) {
    console.error("Terminal error:", e.message);
    return `\r\nError: ${e.message}\r\n`;
  }
}, []);

  // ── FS: list directory ──────────────────────────────────────
  const listDir = useCallback(async (path = "") => {
    setLoadingFs(true);
    setFsError(null);
    try {
      const res = await fetch(`${BASE_URL}/fs?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCurrentPath(data.path);
      setDirContents(
        [...data.items].sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
      );
    } catch (e) {
      setFsError(e.message);
    } finally {
      setLoadingFs(false);
    }
  }, []);

  // ── FS: read file ───────────────────────────────────────────
  const readFile = useCallback(async (path) => {
    setLoadingFile(true);
    try {
      const res = await fetch(`${BASE_URL}/fs/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOpenFile({ path, content: data.content });
    } catch (e) {
      setFsError(e.message);
    } finally {
      setLoadingFile(false);
    }
  }, []);

  // ── FS: write file ──────────────────────────────────────────
  const writeFile = useCallback(async (path, content) => {
    setSavingFile(true);
    try {
      const res = await fetch(`${BASE_URL}/fs/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOpenFile((prev) => (prev?.path === path ? { ...prev, content } : prev));
      return true;
    } catch (e) {
      setFsError(e.message);
      return false;
    } finally {
      setSavingFile(false);
    }
  }, []);

  // ── FS: delete ──────────────────────────────────────────────
  const deletePath = useCallback(async (path) => {
    try {
      const res = await fetch(`${BASE_URL}/fs?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await listDir(currentPath);
      return true;
    } catch (e) {
      setFsError(e.message);
      return false;
    }
  }, [currentPath, listDir]);

  const closeFile = () => setOpenFile(null);

  //stats
const fetchSysStats = useCallback(async () => {
  try {
    const res = await fetch(`${BASE_URL}/sys`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    setSysStats({
      cpu: data.cpu,
      mem: data.mem?.percent ?? 0,
      disk: data.disk?.percent ?? 0,
      uptime: data.uptime,
    });

  } catch (e) {
    console.error("Sys fetch error:", e.message);
  }
}, []);

const fetchProcesses = useCallback(async () => {
  setLoadingProcess(true);
  try {
    const res = await fetch(`${BASE_URL}/process`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    setProcessList(data.processes || []);
  } catch (e) {
    console.error("Process fetch error:", e.message);
  } finally {
    setLoadingProcess(false);
  }
}, []);
  return (
    <ApiContext.Provider
    value={{
  BASE_URL,

  // FS
  currentPath, setCurrentPath,
  dirContents,
  loadingFs, fsError,
  listDir, readFile, writeFile, deletePath,

  // Editor
  openFile, setOpenFile, closeFile,
  loadingFile, savingFile,

  // System
  sysStats, setSysStats,
  fetchSysStats,

  // Process
  processList,
  loadingProcess,
  fetchProcesses,

  // Terminal
  runTerminalCommand,
}}
    >
      {children}
    </ApiContext.Provider>
  );
}

export const useApi = () => useContext(ApiContext);