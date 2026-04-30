import { useState } from "react";
import { useApi } from "../Context/ApiContext";

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#1a7f64]" : "bg-[#1e2a38]"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e2a38] last:border-0">
      <div>
        <p className="text-sm text-[#c9d1d9]">{label}</p>
        {description && <p className="text-xs text-[#4a5568] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { BASE_URL } = useApi();
  const [urlInput, setUrlInput] = useState(BASE_URL);
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [showHidden,  setShowHidden]    = useState(false);
  const [confirmDel,  setConfirmDel]    = useState(true);
  const [fontSize,    setFontSize]      = useState(14);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#c9d1d9] tracking-tight">Settings</h1>
          <p className="text-xs text-[#4a5568] mt-0.5">Configure your VM dashboard preferences</p>
        </div>

        {/* Connection */}
        <section className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-[#4a5568] mb-4">Connection</p>
          <Row label="Backend URL" description="Flask server address">
            <input
              className="w-52 bg-[#0d1117] border border-[#1e2a38] rounded px-2 py-1 text-xs font-mono text-[#8b949e] focus:outline-none focus:border-[#2d5986]"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </Row>
        </section>

        {/* File Explorer */}
        <section className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-[#4a5568] mb-4">File Explorer</p>
          <Row label="Show hidden files" description="Files and folders starting with .">
            <Toggle checked={showHidden} onChange={setShowHidden} />
          </Row>
          <Row label="Confirm before delete" description="Show confirmation dialog">
            <Toggle checked={confirmDel} onChange={setConfirmDel} />
          </Row>
          <Row label="Editor font size" description="Monospace font size (px)">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="w-6 h-6 rounded bg-[#1e2a38] text-[#8b949e] hover:text-[#c9d1d9] text-sm"
              >−</button>
              <span className="text-sm font-mono text-[#58a6ff] w-6 text-center">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="w-6 h-6 rounded bg-[#1e2a38] text-[#8b949e] hover:text-[#c9d1d9] text-sm"
              >+</button>
            </div>
          </Row>
        </section>

        {/* Dashboard */}
        <section className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-[#4a5568] mb-4">Dashboard</p>
          <Row label="Auto-refresh stats" description="Poll system stats every 3 seconds">
            <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
          </Row>
        </section>

        <div className="flex justify-end">
          <button
            onClick={save}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-all ${
              saved
                ? "bg-[#1a7f64] text-[#3fb950]"
                : "bg-[#161f2c] border border-[#1e2a38] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#2d5986]"
            }`}
          >
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>

        <p className="text-[10px] text-[#2d3748] text-center pb-2">
          Most settings are UI-only for now. Wire them up in ApiContext as needed.
        </p>
      </div>
    </div>
  );
}