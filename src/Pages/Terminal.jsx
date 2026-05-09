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

  useEffect(() => {
    if (!busy) {
      inputRef.current?.focus();
    }
  }, [busy]);

  const push = (type, text) => {
    setLines((prev) => [...prev, { type, text }]);
  };

  // cleaner
  const cleanOutput = (output, command) => {
    if (!output) return [];

    return output
      .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\].*?(?:\x1B\\|\a))/g, "")
      .replace(/0;.*?/g, "")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.length < 200 && l !== command && !l.includes('user@vm') && !l.includes('@instance'));
  };

  const handleCmd = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    push("cmd", `${prompt} ${trimmed}`);
    setHistory((h) => [trimmed, ...h].slice(0, 100));
    setHistIdx(-1);

    if (trimmed === "clear") {
      setLines([]);
      return;
    }

    setBusy(true);

    try {
      const res = await runTerminalCommand(trimmed);
      const cleaned = cleanOutput(res, trimmed);

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
    if (t === "cmd") return "text-green-400";
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
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 select-text">
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

        {busy ? (
          <div className="text-gray-500 animate-pulse">processing…</div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-green-400">{prompt}</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none text-gray-200 caret-blue-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}