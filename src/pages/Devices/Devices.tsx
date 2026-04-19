import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BellOff,
  Camera,
  Cpu,
  HardDrive,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { apiClient, getStoredPiAddress } from "../../lib/api";
import "./Devices.css";

interface SystemStatusResponse {
  mode: "home" | "away";
  alarm_active: boolean;
  updated_at: string;
}

interface EventsResponse {
  items: Array<{ timestamp: string; event_type: string }>;
}

interface CameraHealth {
  cv2_available: boolean;
  engine_running: boolean;
  camera_opened: boolean;
  camera_ready: boolean;
  latest_frame_ts?: number | null;
  known_faces?: number;
  detection_method?: string;
  yolo_loaded?: boolean;
}

interface BackendAppUser {
  id: number;
  username: string;
  role: string;
  access_type: string;
  has_device_access: boolean;
  face_profile_count: number;
  fcm_token: string | null;
}

interface BackendAdminAccount {
  id: number;
}

interface BackendProfile {
  id: number;
}

export default function Devices() {
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [events, setEvents] = useState<EventsResponse["items"]>([]);
  const [cameraHealth, setCameraHealth] = useState<CameraHealth | null>(null);
  const [appUsers, setAppUsers] = useState<BackendAppUser[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const [profileCount, setProfileCount] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);
  const [error, setError] = useState("");
  const piAddress = getStoredPiAddress();

  useEffect(() => {
    void load();

    const refreshTimer = window.setInterval(() => {
      void load({ silent: true });
    }, 12000);

    return () => window.clearInterval(refreshTimer);
  }, []);

  async function load(options?: { silent?: boolean }) {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [statusRes, eventsRes, appUsersRes, adminsRes, profilesRes, healthRes] = await Promise.all([
        apiClient.get<SystemStatusResponse>("/api/system/status"),
        apiClient.get<EventsResponse>("/api/events/", { params: { limit: 20 } }),
        apiClient.get<BackendAppUser[]>("/api/auth/admin/app-users").catch(() => ({ data: [] as BackendAppUser[] })),
        apiClient.get<BackendAdminAccount[]>("/api/auth/admin/accounts").catch(() => ({ data: [] as BackendAdminAccount[] })),
        apiClient.get<BackendProfile[]>("/api/faces/").catch(() => ({ data: [] as BackendProfile[] })),
        apiClient.get<{ status?: string }>("/health").catch(
          () => ({ data: { status: undefined } as { status?: string } })
        ),
      ]);

      setStatus(statusRes.data);
      setEvents(eventsRes.data.items);
      setAppUsers(appUsersRes.data);
      setAdminCount(adminsRes.data.length);
      setProfileCount(profilesRes.data.length);
      setBackendOnline(healthRes.data.status === "ok");

      try {
        const cameraRes = await apiClient.get<CameraHealth>("/health/camera");
        setCameraHealth(cameraRes.data);
      } catch {
        setCameraHealth(null);
      }
    } catch {
      setError("Failed to load device data.");
      setBackendOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const toggleMode = async () => {
    if (!status || togglingMode) return;

    const nextMode = status.mode === "home" ? "away" : "home";
    setTogglingMode(true);

    try {
      await apiClient.put("/api/system/mode", { mode: nextMode });
      setStatus((current) => (current ? { ...current, mode: nextMode } : current));
    } catch {
      setError("Failed to update the device mode.");
    } finally {
      setTogglingMode(false);
    }
  };

  const silenceAlarm = async () => {
    await apiClient.put("/api/system/alarm", { active: false });
    setStatus((current) => (current ? { ...current, alarm_active: false } : current));
  };

  const linkedUsers = appUsers.filter((user) => user.has_device_access);
  const lastDetection = events[0]?.timestamp ?? null;
  const lastFrameLabel = formatFrameAge(cameraHealth?.latest_frame_ts ?? null);

  const serviceChecks = useMemo(
    () => [
      { label: "Backend API", ok: backendOnline, detail: backendOnline ? "Responding" : "Unavailable" },
      { label: "OpenCV", ok: cameraHealth?.cv2_available ?? false, detail: cameraHealth?.cv2_available ? "Loaded" : "Missing" },
      { label: "Engine", ok: cameraHealth?.engine_running ?? false, detail: cameraHealth?.engine_running ? "Running" : "Stopped" },
      { label: "Camera", ok: cameraHealth?.camera_opened ?? false, detail: cameraHealth?.camera_opened ? "Opened" : "Disconnected" },
      { label: "Ready", ok: cameraHealth?.camera_ready ?? false, detail: cameraHealth?.camera_ready ? "Streaming" : "Idle" },
    ],
    [backendOnline, cameraHealth]
  );

  return (
    <div className="app-page devices-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Device Command</p>
          <h1 className="app-page__title">Active Devices</h1>
          <p className="app-page__subtitle">
            This view replaces the old user-management focus with the current running node, its
            health signals, and the accounts assigned to it.
          </p>
        </div>
        <div className="app-page__actions">
          {piAddress && (
            <span className="app-inline-note">
              <Server size={14} />
              {piAddress}
            </span>
          )}
          {status?.alarm_active && (
            <button className="app-button app-button--danger" onClick={() => void silenceAlarm()}>
              <BellOff size={15} />
              Silence Alarm
            </button>
          )}
          <button className="app-button app-button--secondary" onClick={() => void toggleMode()} disabled={!status || togglingMode}>
            {status?.mode === "away" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {togglingMode ? "Updating..." : `Switch to ${status?.mode === "away" ? "Home" : "Away"}`}
          </button>
          <button className="app-button app-button--primary" onClick={() => void load({ silent: true })} disabled={loading || refreshing}>
            <RefreshCw size={15} className={loading || refreshing ? "devices-spin" : ""} />
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="app-error">{error}</p>}

      <div className="app-kpi-grid">
        <KpiCard icon={<Server size={20} />} label="Connected Nodes" value={backendOnline ? "1" : "0"} meta={backendOnline ? "Current Pi is online" : "No active connection"} tone={backendOnline ? "success" : "danger"} />
        <KpiCard icon={<Users size={20} />} label="Assigned Users" value={loading ? "..." : String(linkedUsers.length)} meta="Accounts with device access" tone="primary" />
        <KpiCard icon={<Camera size={20} />} label="Known Faces" value={loading ? "..." : String(cameraHealth?.known_faces ?? profileCount)} meta="Profiles available to the recognizer" tone="success" />
        <KpiCard icon={<Activity size={20} />} label="Latest Frame" value={loading ? "..." : lastFrameLabel} meta="Camera freshness from the active node" tone="warning" />
      </div>

      <div className="devices-grid">
        <section className="app-card devices-card app-fade-up">
          <div className="app-panel-header">
            <div>
              <h2 className="app-section-title">Device Registry</h2>
              <p className="app-panel-subtitle">All currently reachable hardware from this frontend session.</p>
            </div>
            <span className={`app-status ${backendOnline ? "app-status--success" : "app-status--danger"}`}>
              {backendOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="app-table-card">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Mode</th>
                  <th>Alarm</th>
                  <th>Detection</th>
                  <th>Linked Users</th>
                  <th>Last Sync</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="devices-device">
                      <strong>{piAddress ?? "Not configured"}</strong>
                      <span>Raspberry Pi active node</span>
                    </div>
                  </td>
                  <td>{status ? status.mode.toUpperCase() : "Unknown"}</td>
                  <td>{status?.alarm_active ? "Triggered" : "Clear"}</td>
                  <td>{cameraHealth?.detection_method === "yolov8n" ? "YOLOv8n" : "OpenCV / default"}</td>
                  <td>{linkedUsers.length}</td>
                  <td>{status ? formatTimestamp(status.updated_at) : "Unknown"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="app-card devices-card app-fade-up">
          <div className="app-panel-header">
            <div>
              <h2 className="app-section-title">Service Readiness</h2>
              <p className="app-panel-subtitle">Core services and camera pipeline checks from the live backend.</p>
            </div>
          </div>

          <div className="devices-checks">
            {serviceChecks.map((check) => (
              <div key={check.label} className="devices-check">
                <span className={`devices-check__dot ${check.ok ? "devices-check__dot--good" : "devices-check__dot--bad"}`} />
                <div>
                  <p>{check.label}</p>
                  <span>{check.detail}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="devices-meta-grid">
            <MetaRow label="Protection Mode" value={status ? status.mode.toUpperCase() : "Unknown"} icon={<ShieldCheck size={15} />} />
            <MetaRow label="Alarm State" value={status?.alarm_active ? "Triggered" : "Clear"} icon={<ShieldAlert size={15} />} />
            <MetaRow label="Admins" value={String(adminCount)} icon={<Users size={15} />} />
            <MetaRow label="Detection Method" value={cameraHealth?.detection_method === "yolov8n" ? "YOLOv8n" : "Default"} icon={<Cpu size={15} />} />
            <MetaRow label="Last Detection" value={lastDetection ? formatTimestamp(lastDetection) : "No recent events"} icon={<Activity size={15} />} />
            <MetaRow label="Storage Watch" value={`${profileCount} profiles tracked`} icon={<HardDrive size={15} />} />
          </div>
        </section>
      </div>

      <section className="app-card devices-card app-fade-up">
        <div className="app-panel-header">
          <div>
            <h2 className="app-section-title">Assigned Access</h2>
            <p className="app-panel-subtitle">Users currently linked to this node after removing the old user screen.</p>
          </div>
        </div>

        {linkedUsers.length === 0 ? (
          <p className="app-empty">No users currently have device access.</p>
        ) : (
          <div className="app-table-card">
            <table className="app-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Profiles</th>
                  <th>Push Token</th>
                </tr>
              </thead>
              <tbody>
                {linkedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="devices-device">
                        <strong>{user.username}</strong>
                        <span>ID {user.id}</span>
                      </div>
                    </td>
                    <td>{user.role.replace(/_/g, " ")}</td>
                    <td>{user.access_type}</td>
                    <td>{user.face_profile_count}</td>
                    <td>{user.fcm_token ? "Registered" : "Missing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const palette =
    tone === "success"
      ? { accent: "#16A34A", soft: "#DCFCE7" }
      : tone === "warning"
        ? { accent: "#EA580C", soft: "#FFEDD5" }
        : tone === "danger"
          ? { accent: "#DC2626", soft: "#FEE2E2" }
          : { accent: "#2563EB", soft: "#DBEAFE" };

  return (
    <article
      className="app-card app-kpi-card app-fade-up"
      style={
        {
          "--kpi-accent": `${palette.accent}20`,
          "--kpi-accent-soft": palette.soft,
          "--kpi-accent-text": palette.accent,
        } as React.CSSProperties
      }
    >
      <div className="app-kpi-card__header">
        <div>
          <p className="app-kpi-card__label">{label}</p>
          <p className="app-kpi-card__value">{value}</p>
          <p className="app-kpi-card__meta">{meta}</p>
        </div>
        <span className="app-kpi-card__icon">{icon}</span>
      </div>
    </article>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="devices-meta">
      <div className="devices-meta__label">
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function formatFrameAge(timestamp: number | null) {
  if (!timestamp) return "Unavailable";

  const ageMs = Date.now() - timestamp * 1000;
  if (ageMs < 1000) return `${Math.round(ageMs)} ms`;
  return `${(ageMs / 1000).toFixed(1)} s`;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}
