import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Logs from "./pages/Logs/Logs";
import Profiles from "./pages/Profiles/Profiles";
import Settings from "./pages/Settings/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}