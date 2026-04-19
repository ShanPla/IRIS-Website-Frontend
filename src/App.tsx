import { useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PiConfiguredRoute from "./components/auth/PiConfiguredRoute";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import Topbar from "./components/layout/Topbar/Topbar";
import "./App.css";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profiles from "./pages/Profiles/Profiles";
import AdminAccounts from "./pages/AdminAccounts/AdminAccounts";
import Devices from "./pages/Devices/Devices";
import Setup from "./pages/Setup/Setup";
import { hasPiBackendConfigured } from "./lib/api";

function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-shell">
      <div
        className={`admin-shell__overlay ${mobileNavOpen ? "admin-shell__overlay--visible" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <div className="admin-shell__frame">
        <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <div className="admin-shell__main">
          <Topbar onToggleSidebar={() => setMobileNavOpen((current) => !current)} />
          <main className="admin-shell__content">{children}</main>
        </div>
      </div>
    </div>
  );
}

function ProtectedAdminPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

function ConfiguredAdminPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PiConfiguredRoute>
        <AdminLayout>{children}</AdminLayout>
      </PiConfiguredRoute>
    </ProtectedRoute>
  );
}

function ConfiguredRedirect({ to }: { to: string }) {
  return (
    <ProtectedRoute>
      <PiConfiguredRoute>
        <Navigate to={to} replace />
      </PiConfiguredRoute>
    </ProtectedRoute>
  );
}

function PostLoginLanding() {
  const { session, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div className="app-boot">
        <p className="app-boot__label">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={hasPiBackendConfigured() ? "/dashboard" : "/setup"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PostLoginLanding />} />
          <Route path="/setup" element={<ProtectedAdminPage><Setup /></ProtectedAdminPage>} />
          <Route path="/dashboard" element={<ConfiguredAdminPage><Dashboard /></ConfiguredAdminPage>} />
          <Route path="/profiles" element={<ConfiguredAdminPage><Profiles /></ConfiguredAdminPage>} />
          <Route path="/devices" element={<ConfiguredAdminPage><Devices /></ConfiguredAdminPage>} />
          <Route path="/admin-accounts" element={<ConfiguredAdminPage><AdminAccounts /></ConfiguredAdminPage>} />
          <Route path="/users" element={<ConfiguredRedirect to="/devices" />} />
          <Route path="/system-health" element={<ConfiguredRedirect to="/devices" />} />
          <Route path="/logs" element={<ConfiguredRedirect to="/dashboard" />} />
          <Route path="/settings" element={<ConfiguredRedirect to="/dashboard" />} />
          <Route path="/live-feed" element={<ConfiguredRedirect to="/dashboard" />} />
          <Route path="*" element={<PostLoginLanding />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
