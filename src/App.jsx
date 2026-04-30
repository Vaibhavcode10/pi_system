import { ApiProvider } from "./Context/ApiContext";
import { WindowProvider } from "./Context/WindowContext";

import Dashboard from "./Pages/Dashboard";
import Sidebar from "./Sidebar";

export default function App() {
  return (
    <ApiProvider>
      <WindowProvider>
        <div className="w-screen h-screen relative overflow-hidden bg-black">
          <Dashboard />
          <Sidebar />
        </div>
      </WindowProvider>
    </ApiProvider>
  );
}