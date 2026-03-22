import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import Topbar from "./components/layout/Topbar/Topbar";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Logs from "./pages/Logs/Logs";
import Profiles from "./pages/Profiles/Profiles";
import Settings from "./pages/Settings/Settings";
import AdminAccounts from "./pages/AdminAccounts/AdminAccounts";
import UserManagement from "./pages/UserManagement/UserManagement";
import SystemHealth from "./pages/SystemHealth/SystemHealth";
import Setup from "./pages/Setup/Setup";

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <AdminLayout><Logs /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/profiles" element={
            <ProtectedRoute>
              <AdminLayout><Profiles /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AdminLayout><Settings /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin-accounts" element={
            <ProtectedRoute>
              <AdminLayout><AdminAccounts /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <AdminLayout><UserManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/system-health" element={
            <ProtectedRoute>
              <AdminLayout><SystemHealth /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}