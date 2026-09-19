import { useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  // Release any active webcam streams when the page unloads / reloads
  useEffect(() => {
    const releaseAll = () => {
      document.querySelectorAll("video").forEach((v) => {
        if (v.srcObject) {
          v.srcObject.getTracks().forEach((t) => t.stop());
          v.srcObject = null;
        }
      });
    };

    window.addEventListener("beforeunload", releaseAll);
    window.addEventListener("pagehide", releaseAll);

    return () => {
      window.removeEventListener("beforeunload", releaseAll);
      window.removeEventListener("pagehide", releaseAll);
      releaseAll();
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}