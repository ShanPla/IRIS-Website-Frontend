import { Shield, Camera, ShieldAlert } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-stats">
        <StatCard icon={<Shield className="icon-cyan" />} label="Mode" value="HOME" />
        <StatCard icon={<Camera className="icon-cyan" />} label="Camera" value="Active" />
        <StatCard icon={<ShieldAlert className="icon-yellow" />} label="Last Alert" value="None" />
      </div>

      <div className="dashboard-feed">
        <p className="feed-label">Live Feed</p>
        <div className="feed-placeholder">
          <Camera size={48} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}