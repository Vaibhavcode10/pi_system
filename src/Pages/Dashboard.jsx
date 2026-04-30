import wallpaper from "./dekstop.webp";
import Window from "./Window";

import Terminal from "./Terminal";
import FileExplorer from "./File_eplorer";
import Settings from "./Settings";
import SystemWidget from "./SystemWidget";
import CodeEditor from "./Editor";

import { useWindows } from "../Context/WindowContext";

const APP_MAP = {
  terminal: Terminal,
  files: FileExplorer,
  settings: Settings,
  editor: CodeEditor,
};

export default function Dashboard() {
  const { windows, updateWindow, closeWindow, bringToFront } = useWindows();

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <SystemWidget />
      {[...windows]
  .sort((a, b) => a.z - b.z) // ✅ ensures top window renders last
  .map((win) => {
    if (win.minimized) return null;

    const Comp = APP_MAP[win.type];
    if (!Comp) return null;

    return (
      <Window
        key={win.id}
        win={win}
        updateWindow={updateWindow}
        closeWindow={closeWindow}
        bringToFront={bringToFront}
      >
        <Comp />
      </Window>
    );
  })}
    </div>
  );
}