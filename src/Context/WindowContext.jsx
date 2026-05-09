import { createContext, useContext, useState } from "react";

const WindowContext = createContext(null);

export function WindowProvider({ children }) {
  const [windows, setWindows] = useState([]);

  const openWindow = (type) => {
    const id = Date.now();

    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.z || 0), 0);

      if (type === "editor") {
        const existing = prev.find((w) => w.type === "editor" && !w.minimized);
        if (existing) {
          // Bring existing editor to front
          return prev.map((w) =>
            w.id === existing.id ? { ...w, z: maxZ + 1 } : w
          );
        }
      }

      const screenW = window.innerWidth;
      const screenH = window.innerHeight - 56;
      const existingTypeCount = prev.filter((w) => w.type === type).length;
      const offset = Math.min(existingTypeCount * 24, 120);

      const sizeMap = {
        files: {
          width: Math.min(screenW * 0.38, 760),
          height: Math.min(screenH * 0.58, 720),
          x: 60,
          y: 80,
        },
        editor: {
          width: Math.min(screenW * 0.52, 1080),
          height: Math.min(screenH * 0.65, 760),
          x: Math.max(80, screenW - Math.min(screenW * 0.52, 1080) - 80),
          y: 100,
        },
        terminal: {
          width: Math.min(screenW * 0.42, 820),
          height: Math.min(screenH * 0.45, 520),
          x: Math.max(80, screenW - Math.min(screenW * 0.42, 820) - 80),
          y: Math.max(80, screenH - Math.min(screenH * 0.45, 520) - 80),
        },
        settings: {
          width: Math.min(screenW * 0.32, 620),
          height: Math.min(screenH * 0.58, 700),
          x: 80,
          y: 120,
        },
      };

      const defaultSize = {
        width: Math.min(screenW - 80, 1000),
        height: Math.min(screenH - 80, 680),
        x: 80,
        y: 80,
      };

      const { width, height, x: baseX, y: baseY } = sizeMap[type] || defaultSize;
      const x = Math.min(screenW - width, baseX + offset);
      const y = Math.min(screenH - height, baseY + offset);

      // Create new window with a type-specific initial size and position.
      return [
        ...prev,
        {
          id,
          type,
          x,
          y,
          width,
          height,
          minimized: false,
          maximized: false,
          prev: null,
          z: maxZ + 1,
        },
      ];
    });
  };

  const closeWindow = (id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWindow = (id, props) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...props } : w))
    );
  };

 const bringToFront = (id) => {
  setWindows((prev) => {
    const maxZ = Math.max(...prev.map((w) => w.z || 0), 0);

    return prev.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          minimized: false,
          z: maxZ + 1,
        };
      }
      return w;
    });
  });
};
  return (
    <WindowContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        updateWindow,
        bringToFront,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
}

export const useWindows = () => useContext(WindowContext);