import { NavLink } from "react-router-dom";
import { LayoutDashboard, ScrollText, Users, Settings } from "lucide-react";
import "./Sidebar.css";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/logs", label: "Event Logs", icon: ScrollText },
  { to: "/profiles", label: "Profiles", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">IRIS</div>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}