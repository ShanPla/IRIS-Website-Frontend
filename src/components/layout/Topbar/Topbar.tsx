import { useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getStoredPiAddress } from "../../../lib/api";
import { Menu, Shield, Wifi, WifiOff } from "lucide-react";
import "./Topbar.css";

const pageTitles: Record<string, { eyebrow: string; title: string }> = {
  "/setup": { eyebrow: "Device Setup", title: "Connect Raspberry Pi" },
  "/dashboard": { eyebrow: "IRIS Admin", title: "Overview" },
  "/profiles": { eyebrow: "Security Dataset", title: "Face Profiles" },
  "/devices": { eyebrow: "Operations", title: "Devices" },
  "/admin-accounts": { eyebrow: "Access Control", title: "Admin Accounts" },
};

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { session } = useAuth();
  const location = useLocation();
  const piAddress = getStoredPiAddress();
  const currentPage = pageTitles[location.pathname] ?? { eyebrow: "IRIS Admin", title: "Workspace" };
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__menu" onClick={onToggleSidebar} aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div>
          <p className="topbar__eyebrow">{currentPage.eyebrow}</p>
          <h2 className="topbar__title">{currentPage.title}</h2>
        </div>
      </div>
      <div className="topbar__right">
        <span className="topbar__date">{dateLabel}</span>
        <div className={`topbar__status ${piAddress ? "topbar__status--connected" : "topbar__status--disconnected"}`}>
          {piAddress ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{piAddress ?? "No Pi connected"}</span>
        </div>
        <div className="topbar__user">
          <div className="topbar__avatar">
            <Shield size={16} />
          </div>
          <div>
            <span className="topbar__username">{session?.user.username}</span>
            <span className="topbar__role">{session?.user.role.replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

