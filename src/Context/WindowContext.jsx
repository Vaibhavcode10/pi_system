import { createContext, useContext, useState } from "react";

const WindowContext = createContext(null);

export function WindowProvider({ children }) {
  const [windows, setWindows] = useState([]);

  const openWindow = (type) => {
    const id = Date.now();

    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.z || 0), 0);

      return [
        ...prev,
        {
          id,
          type,
          x: 100,
          y: 100,
          width: 500,
          height: 300,
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