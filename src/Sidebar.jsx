import { useState, useRef } from "react";
import { Terminal, Folder, Settings, Search, Calendar, Code } from "lucide-react";
import { useWindows } from "./Context/WindowContext";

const MAX_INSTANCES = 5;

export default function Sidebar() {
  const { windows, openWindow, bringToFront } = useWindows();

  const [hoveredApp, setHoveredApp] = useState(null);
  const hoverTimeout = useRef(null);

  const groupedApps = windows.reduce((acc, win) => {
    if (!acc[win.type]) acc[win.type] = [];
    acc[win.type].push(win);
    return acc;
  }, {});

  const handleMouseEnter = (type) => {
    clearTimeout(hoverTimeout.current);
    setHoveredApp(type);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredApp(null);
    }, 700);
  };

  const AppIcon = ({ type, Icon }) => {
    const instances = groupedApps[type] || [];

    const handleClick = () => {
      if (instances.length < MAX_INSTANCES) {
        openWindow(type);
      } else {
        bringToFront(instances[instances.length - 1].id);
      }
    };

    return (
      <div
        className="relative"
        onMouseEnter={() => handleMouseEnter(type)}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={handleClick}
          className="relative p-2 rounded-lg hover:bg-white/10 transition"
        >
          <Icon className="w-5 h-5 text-white" />

          {instances.length > 0 && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
          )}

          {instances.length > 1 && (
            <span className="absolute -top-1 -right-1 text-[10px] bg-blue-500 px-1 rounded">
              {instances.length}
            </span>
          )}
        </button>

        {hoveredApp === type && instances.length > 0 && (
          <div
            className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#111827] border border-white/10 rounded-lg shadow-xl p-2 flex flex-col gap-1 min-w-[120px] z-[9999]"
            onMouseEnter={() => clearTimeout(hoverTimeout.current)}
            onMouseLeave={handleMouseLeave}
          >
            {instances.map((win, index) => (
              <div
                key={win.id}
                onClick={() => bringToFront(win.id)}
                className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded cursor-pointer"
              >
                {type} {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString('default', { month: 'short' });
  const year = currentDate.getFullYear();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/70 backdrop-blur-md flex items-center px-4 gap-4 border-t border-white/10">
      <div className="flex items-center bg-white/10 rounded-md px-2 py-1 w-48">
        <Search className="w-4 h-4 text-gray-300" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm text-white px-2 w-full placeholder-gray-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <AppIcon type="terminal" Icon={Terminal} />
        <AppIcon type="files" Icon={Folder} />
        <AppIcon type="settings" Icon={Settings} />
        <AppIcon type="editor" Icon={Code} />
      </div>

      <div className="absolute right-4 flex items-center gap-2 px-3 py-2 rounded-lg transition cursor-pointer">
        <Calendar className="w-4 h-4 text-white" />
        <div className="text-xs text-white">
          <div className="font-semibold">{day}</div>
          <div className="text-gray-400">{month} {year}</div>
        </div>
      </div>
    </div>
  );
}