import { useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import "./App.css";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profiles from "./pages/Profiles/Profiles";
import AdminAccounts from "./pages/AdminAccounts/AdminAccounts";
import Devices from "./pages/Devices/Devices";

function AmbientBackdrop() {
  return (
    <div className="admin-shell__scene" aria-hidden="true">
      <div className="admin-shell__grid" />
      <svg className="admin-shell__wires" viewBox="0 0 1200 1200" preserveAspectRatio="none">
        <path d="M-40 180 H320 L380 240 H710 L780 170 H1280" />
        <path d="M1240 860 H860 L790 790 H460 L390 860 H-60" />
        <path d="M210 -80 V360 L300 450 V760 L210 860 V1280" />
        <path d="M980 1280 V860 L900 780 V320 L980 240 V-80" />
        <path d="M-80 1060 H300 L440 900 V700 H760 L920 540 H1280" />
      </svg>
      <div className="admin-shell__glow admin-shell__glow--primary" />
      <div className="admin-shell__glow admin-shell__glow--secondary" />
      <div className="admin-shell__shard admin-shell__shard--one" />
      <div className="admin-shell__shard admin-shell__shard--two" />
      <div className="admin-shell__shard admin-shell__shard--three" />
      <div className="admin-shell__node admin-shell__node--one" />
      <div className="admin-shell__node admin-shell__node--two" />
      <div className="admin-shell__node admin-shell__node--three" />
    </div>
  );
}

function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-shell">
      <AmbientBackdrop />
      <div
        className={`admin-shell__overlay ${mobileNavOpen ? "admin-shell__overlay--visible" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <div className="admin-shell__frame">
        <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <div className="admin-shell__main">
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

function ProtectedRedirect({ to }: { to: string }) {
  return (
    <ProtectedRoute>
      <Navigate to={to} replace />
    </ProtectedRoute>
  );
}

function AppBoot() {
  return (
    <div className="app-boot">
      <p className="app-boot__label">Loading session...</p>
    </div>
  );
}

function LoginRoute() {
  const { session, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <AppBoot />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}

function PostLoginLanding() {
  const { session, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <AppBoot />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<PostLoginLanding />} />
          <Route path="/dashboard" element={<ProtectedAdminPage><Dashboard /></ProtectedAdminPage>} />
          <Route path="/profiles" element={<ProtectedAdminPage><Profiles /></ProtectedAdminPage>} />
          <Route path="/devices" element={<ProtectedAdminPage><Devices /></ProtectedAdminPage>} />
          <Route path="/admin-accounts" element={<ProtectedAdminPage><AdminAccounts /></ProtectedAdminPage>} />
          <Route path="/users" element={<ProtectedRedirect to="/devices" />} />
          <Route path="/system-health" element={<ProtectedRedirect to="/devices" />} />
          <Route path="/logs" element={<ProtectedRedirect to="/dashboard" />} />
          <Route path="/settings" element={<ProtectedRedirect to="/dashboard" />} />
          <Route path="/live-feed" element={<ProtectedRedirect to="/dashboard" />} />
          <Route path="*" element={<PostLoginLanding />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
