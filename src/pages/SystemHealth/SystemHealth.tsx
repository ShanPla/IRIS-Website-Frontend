import { useState } from "react";
import { Cpu, Camera, HardDrive, Wifi, Clock, Bell, RefreshCw } from "lucide-react";
import type { SystemHealth } from "../../types/iris";
import "./SystemHealth.css";

const mockHealth: SystemHealth = {
  cpuUsage: 38,
  memoryUsage: 61,
  storageUsed: 3.2,
  storageTotal: 16,
  cameraStatus: "online",
  internetStatus: "connected",
  alarmStatus: "armed",
  lastDetection: "2026-03-18 11:30:55",
};

export default function SystemHealth() {
  const [health] = useState<SystemHealth>(mockHealth);
  const [lastRefreshed, setLastRefreshed] = useState("Just now");

  const handleRefresh = () => {
    // TODO: fetch from backend
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const storagePercent = Math.round((health.storageUsed / health.storageTotal) * 100);

  return (
    <div className="system-health">
      <div className="system-health-header">
        <h1 className="system-health-title">System Health</h1>
        <div className="system-health-refresh">
          <span className="refresh-label">Last refreshed: {lastRefreshed}</span>
          <button className="refresh-btn" onClick={handleRefresh}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Row */}
      <div className="health-status-row">
        <StatusCard
          icon={<Camera size={18} />}
          label="Camera"
          value={health.cameraStatus}
          type={health.cameraStatus === "online" ? "good" : "bad"}
        />
        <StatusCard
          icon={<Wifi size={18} />}
          label="Internet"
          value={health.internetStatus}
          type={health.internetStatus === "connected" ? "good" : "bad"}
        />
        <StatusCard
          icon={<Bell size={18} />}
          label="Alarm"
          value={health.alarmStatus}
          type={health.alarmStatus === "triggered" ? "bad" : health.alarmStatus === "armed" ? "good" : "warn"}
        />
        <StatusCard
          icon={<Clock size={18} />}
          label="Last Detection"
          value={health.lastDetection ?? "None"}
          type="neutral"
        />
      </div>

      {/* Metrics */}
      <div className="health-metrics">
        <div className="health-card">
          <div className="health-card-header">
            <Cpu size={16} />
            <span>CPU Usage</span>
          </div>
          <div className="health-bar-row">
            <div className="health-bar">
              <div
                className={`health-bar-fill ${health.cpuUsage > 80 ? "health-bar-fill--danger" : health.cpuUsage > 60 ? "health-bar-fill--warn" : "health-bar-fill--good"}`}
                style={{ width: `${health.cpuUsage}%` }}
              />
            </div>
            <span className="health-bar-value">{health.cpuUsage}%</span>
          </div>
        </div>

        <div className="health-card">
          <div className="health-card-header">
            <Cpu size={16} />
            <span>Memory Usage</span>
          </div>
          <div className="health-bar-row">
            <div className="health-bar">
              <div
                className={`health-bar-fill ${health.memoryUsage > 80 ? "health-bar-fill--danger" : health.memoryUsage > 60 ? "health-bar-fill--warn" : "health-bar-fill--good"}`}
                style={{ width: `${health.memoryUsage}%` }}
              />
            </div>
            <span className="health-bar-value">{health.memoryUsage}%</span>
          </div>
        </div>

        <div className="health-card">
          <div className="health-card-header">
            <HardDrive size={16} />
            <span>Storage</span>
          </div>
          <div className="health-bar-row">
            <div className="health-bar">
              <div
                className={`health-bar-fill ${storagePercent > 80 ? "health-bar-fill--danger" : storagePercent > 60 ? "health-bar-fill--warn" : "health-bar-fill--good"}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <span className="health-bar-value">{health.storageUsed}GB / {health.storageTotal}GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, type }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  type: "good" | "bad" | "warn" | "neutral";
}) {
  return (
    <div className="status-card">
      <div className={`status-card-icon status-card-icon--${type}`}>{icon}</div>
      <div>
        <p className="status-card-label">{label}</p>
        <p className={`status-card-value status-card-value--${type}`}>{value}</p>
      </div>
    </div>
  );
}