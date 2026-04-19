import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, RefreshCw, Server, ShieldCheck, Users, Wifi } from "lucide-react";
import { apiClient, getStoredPiAddress, normalizePiAddress, setStoredPiAddress } from "../../lib/api";
import "./Setup.css";

interface BackendAdminAccount {
  id: number;
}

interface BackendAppUser {
  id: number;
}

export default function Setup() {
  const navigate = useNavigate();
  const [backendInput, setBackendInput] = useState(getStoredPiAddress() ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    void loadSummary();
  }, []);

  async function loadSummary() {
    setRefreshing(true);

    try {
      const [adminsRes, usersRes, healthRes] = await Promise.all([
        apiClient.get<BackendAdminAccount[]>("/api/auth/admin/accounts"),
        apiClient.get<BackendAppUser[]>("/api/auth/admin/app-users"),
        apiClient.get<{ status?: string }>("/health"),
      ]);

      setAdminCount(adminsRes.data.length);
      setTotalUsers(usersRes.data.length);
      setBackendOnline(healthRes.data.status === "ok");
    } catch {
      setAdminCount(null);
      setTotalUsers(null);
      setBackendOnline(false);
    } finally {
      setRefreshing(false);
    }
  }

  const handleSave = async () => {
    if (!backendInput.trim()) {
      setError("Please enter the Raspberry Pi IP.");
      return;
    }

    setSaving(true);
    setError("");

    const normalizedPi = normalizePiAddress(backendInput);
    if (!normalizedPi) {
      setError("Invalid Raspberry Pi IP address.");
      setSaving(false);
      return;
    }

    setStoredPiAddress(normalizedPi);
    setSaving(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="app-page setup-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Activation</p>
          <h1 className="app-page__title">Connect Raspberry Pi</h1>
          <p className="app-page__subtitle">
            Full monitoring stays locked until this admin session knows which Raspberry Pi node to
            talk to.
          </p>
        </div>
        <div className="app-page__actions">
          <button className="app-button app-button--secondary" onClick={() => void loadSummary()} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? "setup-spin" : ""} />
            {refreshing ? "Checking..." : "Refresh Status"}
          </button>
        </div>
      </div>

      <div className="setup-grid">
        <section className="app-card setup-card app-fade-up">
          <div className="setup-card__icon">
            <Server size={22} />
          </div>
          <h2>Limited Admin Mode</h2>
          <p>
            Sign-in is already active. Once you connect the node, the overview, devices, profiles,
            and admin tools unlock automatically.
          </p>

          <div className="setup-summary-grid">
            <SummaryCard icon={<ShieldCheck size={16} />} label="Admin Users" value={adminCount === null ? "N/A" : String(adminCount)} />
            <SummaryCard icon={<Users size={16} />} label="App Users" value={totalUsers === null ? "N/A" : String(totalUsers)} />
            <SummaryCard icon={<Activity size={16} />} label="Backend" value={backendOnline ? "Online" : "Offline"} />
            <SummaryCard icon={<Wifi size={16} />} label="Pi Address" value={getStoredPiAddress() ?? "Not set"} />
          </div>
        </section>

        <section className="app-card setup-card app-fade-up">
          <h2>Node Address</h2>
          <p>Enter the Raspberry Pi address with an optional port. Example: <code>192.168.1.120:8000</code></p>

          <div className="app-field">
            <label>Raspberry Pi IP address</label>
            <input
              type="text"
              value={backendInput}
              onChange={(event) => setBackendInput(event.target.value)}
              placeholder="e.g. 192.168.1.120:8000"
              onKeyDown={(event) => event.key === "Enter" && void handleSave()}
              className="app-input"
            />
          </div>

          {error && <p className="app-error">{error}</p>}

          <div className="setup-actions">
            <button className="app-button app-button--primary" onClick={() => void handleSave()} disabled={saving}>
              <Wifi size={16} />
              {saving ? "Connecting..." : "Connect & Continue"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="setup-summary-card">
      <div className="setup-summary-card__icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
