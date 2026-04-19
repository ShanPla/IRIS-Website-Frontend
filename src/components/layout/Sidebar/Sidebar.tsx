import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  HardDrive,
  LogOut,
  ScanFace,
  Server,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getStoredPiAddress, hasPiBackendConfigured } from "../../../lib/api";
import "./Sidebar.css";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const fullLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/devices", label: "Devices", icon: HardDrive },
  { to: "/profiles", label: "Face Profiles", icon: ScanFace },
  { to: "/admin-accounts", label: "Admin Accounts", icon: ShieldCheck },
];

const setupLinks = [
  { to: "/setup", label: "Connect Device", icon: Server },
];

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const piAddress = getStoredPiAddress();
  const piConfigured = hasPiBackendConfigured();
  const links = piConfigured ? fullLinks : setupLinks;

  const handleLogout = () => {
    onCloseMobile();
    logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">
          <Shield size={18} />
        </div>
        <div>
          <p className="sidebar__brand-title">IRIS</p>
          <p className="sidebar__brand-subtitle">Admin Portal</p>
        </div>
        <button className="sidebar__mobile-close" onClick={onCloseMobile} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>

      {piAddress && (
        <div className="sidebar__pi">
          <Server size={13} />
          <span>{piAddress}</span>
        </div>
      )}

      {!piConfigured && (
        <p className="sidebar__warning">
          Connect the Raspberry Pi node to unlock live monitoring, profiles, and admin controls.
        </p>
      )}

      <nav className="sidebar__nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__user-icon"><ShieldCheck size={15} /></div>
          <div>
            <p className="sidebar__user-name">{session?.user.name}</p>
            <p className="sidebar__user-role">{session?.user.role.replace(/_/g, " ")}</p>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
