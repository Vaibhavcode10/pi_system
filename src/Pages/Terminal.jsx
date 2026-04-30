import { useState, useRef, useEffect } from "react";
import { useApi } from "../Context/ApiContext";

export default function Terminal() {
  const { runTerminalCommand } = useApi();

  const [lines, setLines] = useState([
    { type: "sys", text: "VM Terminal" },
    { type: "sys", text: 'Type "help" to begin' },
    { type: "blank" },
  ]);

  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const prompt = "user@vm:~$";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const push = (type, text) => {
    setLines((prev) => [...prev, { type, text }]);
  };

  // cleaner
  const cleanOutput = (output) => {
    if (!output) return [];

    return output
      .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.length < 200);
  };

  const handleCmd = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    push("prompt", `${prompt} ${trimmed}`);
    setHistory((h) => [trimmed, ...h].slice(0, 100));
    setHistIdx(-1);

    if (trimmed === "clear") {
      setLines([]);
      return;
    }

    setBusy(true);

    try {
      const res = await runTerminalCommand(trimmed);
      const cleaned = cleanOutput(res);

      cleaned.forEach((line) => push("out", line));
    } catch (e) {
      push("err", `Error: ${e.message}`);
    } finally {
      setBusy(false);
      push("blank", "");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCmd(input);
      setInput("");
    }

    if (e.key === "ArrowUp") {
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
      e.preventDefault();
    }

    if (e.key === "ArrowDown") {
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx]);
      e.preventDefault();
    }
  };

  const color = (t) => {
    if (t === "prompt") return "text-green-400";
    if (t === "err") return "text-red-400";
    if (t === "sys") return "text-blue-400";
    return "text-gray-200";
  };

  return (
    <div
      className="flex flex-col h-full w-full bg-[#0b0f14] font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* OUTPUT AREA */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {lines.map((l, i) =>
          l.type === "blank" ? (
            <div key={i} className="h-2" />
          ) : (
            <div
              key={i}
              className={`${color(l.type)} whitespace-pre-wrap break-words`}
            >
              {l.text}
            </div>
          )
        )}

        {busy && (
          <div className="text-gray-500 animate-pulse">processing…</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#1e2a38] bg-[#0a0f16]">
        <span className="text-green-400">{prompt}</span>

        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none text-gray-200 caret-blue-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          spellCheck={false}
        />
      </div>
    </div>
  );
}