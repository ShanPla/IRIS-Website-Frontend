import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BellOff,
  Camera,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { apiClient, getStoredBackendUrl, getStoredPiAddress, getStoredToken } from "../../lib/api";
import AuthImage from "../../components/ui/AuthImage";
import "./Dashboard.css";

interface SystemStatus {
  mode: "home" | "away";
  alarm_active: boolean;
  updated_at: string;
}

type EventType = "authorized" | "unknown" | "unverifiable" | "possible_threat";

interface BackendEvent {
  id: number;
  event_type: EventType;
  snapshot_path: string | null;
  alarm_triggered: boolean;
  timestamp: string;
  matched_name: string | null;
}

interface BackendProfile {
  id: number;
}

interface BackendAdminAccount {
  id: number;
}

interface BackendAppUser {
  id: number;
  role: string;
  has_device_access: boolean;
}

const eventPalette: Record<EventType, { label: string; color: string; tone: string }> = {
  authorized: { label: "Authorized", color: "#16A34A", tone: "success" },
  unknown: { label: "Intruder", color: "#DC2626", tone: "danger" },
  possible_threat: { label: "Possible Threat", color: "#EA580C", tone: "warning" },
  unverifiable: { label: "Unverifiable", color: "#2563EB", tone: "primary" },
};

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [appUsers, setAppUsers] = useState<BackendAppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [togglingMode, setTogglingMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const load = async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [statusRes, eventsRes, profilesRes, adminsRes, appUsersRes] = await Promise.all([
        apiClient.get<SystemStatus>("/api/system/status"),
        apiClient.get<{ items: BackendEvent[] }>("/api/events/", { params: { limit: 180 } }),
        apiClient.get<BackendProfile[]>("/api/faces/").catch(() => ({ data: [] as BackendProfile[] })),
        apiClient.get<BackendAdminAccount[]>("/api/auth/admin/accounts").catch(() => ({ data: [] as BackendAdminAccount[] })),
        apiClient.get<BackendAppUser[]>("/api/auth/admin/app-users").catch(() => ({ data: [] as BackendAppUser[] })),
      ]);

      setStatus(statusRes.data);
      setEvents(sortEvents(eventsRes.data.items));
      setProfileCount(profilesRes.data.length);
      setAdminCount(adminsRes.data.length);
      setAppUsers(appUsersRes.data);
    } catch {
      setError("Failed to load overview data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();

    const refreshTimer = window.setInterval(() => {
      void load({ silent: true });
    }, 12000);

    const base = getStoredBackendUrl();
    const token = getStoredToken();

    if (base && token) {
      const wsBase = base.replace(/^http/i, "ws");
      const ws = new WebSocket(`${wsBase}/ws/live?token=${token}`);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type: string;
            event_type?: EventType;
            snapshot_url?: string;
            alarm_triggered?: boolean;
            timestamp?: string;
            id?: number;
            mode?: "home" | "away";
            alarm_active?: boolean;
            matched_name?: string;
          };

          if (message.type === "security_event") {
            const nextEvent: BackendEvent = {
              id: message.id ?? Date.now(),
              event_type: message.event_type ?? "unverifiable",
              snapshot_path: message.snapshot_url ?? null,
              alarm_triggered: message.alarm_triggered ?? false,
              timestamp: message.timestamp ?? new Date().toISOString(),
              matched_name: message.matched_name ?? null,
            };

            setEvents((current) => upsertEvent(current, nextEvent));
          }

          if (message.type === "threat_cleared" && message.id) {
            setEvents((current) =>
              current.map((item) =>
                item.id === message.id ? { ...item, event_type: "authorized" } : item
              )
            );
          }

          if (message.type === "mode_change") {
            setStatus((current) => (current ? { ...current, mode: message.mode ?? current.mode } : current));
          }

          if (message.type === "alarm_change") {
            setStatus((current) =>
              current ? { ...current, alarm_active: message.alarm_active ?? current.alarm_active } : current
            );
          }
        } catch {
          // Ignore websocket parse issues and keep the last stable UI.
        }
      };

      const ping = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 30000);

      ws.onclose = () => window.clearInterval(ping);
      wsRef.current = ws;
    }

    return () => {
      window.clearInterval(refreshTimer);
      wsRef.current?.close();
    };
  }, []);

  const silenceAlarm = async () => {
    await apiClient.put("/api/system/alarm", { active: false });
    setStatus((current) => (current ? { ...current, alarm_active: false } : current));
  };

  const toggleMode = async () => {
    if (!status || togglingMode) return;

    const nextMode = status.mode === "home" ? "away" : "home";
    setTogglingMode(true);

    try {
      await apiClient.put("/api/system/mode", { mode: nextMode });
      setStatus((current) => (current ? { ...current, mode: nextMode } : current));
    } catch {
      setError("Failed to update the protection mode.");
    } finally {
      setTogglingMode(false);
    }
  };

  const latestEvent = events[0] ?? null;
  const events24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return events.filter((event) => new Date(event.timestamp).getTime() >= cutoff);
  }, [events]);
  const weeklySeries = useMemo(() => buildDailySeries(events), [events]);

  const eventSegments = [
    { label: "Authorized", value: events24h.filter((item) => item.event_type === "authorized").length, color: "#16A34A" },
    { label: "Intruder", value: events24h.filter((item) => item.event_type === "unknown").length, color: "#DC2626" },
    { label: "Possible Threat", value: events24h.filter((item) => item.event_type === "possible_threat").length, color: "#EA580C" },
    { label: "Unverifiable", value: events24h.filter((item) => item.event_type === "unverifiable").length, color: "#2563EB" },
  ];

  const primaryUsers = appUsers.filter((user) => user.role === "homeowner_primary").length;
  const secondaryUsers = appUsers.filter((user) => user.role === "homeowner_invited").length;
  const linkedUsers = appUsers.filter((user) => user.has_device_access).length;

  const accountSegments = [
    { label: "Primary", value: primaryUsers, color: "#2563EB" },
    { label: "Secondary", value: secondaryUsers, color: "#93C5FD" },
    { label: "Admins", value: adminCount, color: "#16A34A" },
  ];

  return (
    <div className="app-page dashboard-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Security Command</p>
          <h1 className="app-page__title">IRIS Overview</h1>
          <p className="app-page__subtitle">
            Monitor the active node, recent detections, and account coverage without losing the
            current backend-driven workflows.
          </p>
        </div>
        <div className="app-page__actions">
          {getStoredPiAddress() && (
            <span className="app-inline-note">
              <HardDrive size={14} />
              {getStoredPiAddress()}
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
            <RefreshCw size={15} className={loading || refreshing ? "dashboard-spin" : ""} />
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="app-error">{error}</p>}

      <div className="app-kpi-grid">
        <MetricCard
          icon={<Camera size={20} />}
          label="Face Profiles"
          value={loading ? "..." : String(profileCount)}
          meta="Registered identities ready for verification"
          accent="#2563EB"
          tone="primary"
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Linked Access"
          value={loading ? "..." : `${linkedUsers}/${appUsers.length || 0}`}
          meta="Accounts currently mapped to the active node"
          accent="#16A34A"
          tone="success"
        />
        <MetricCard
          icon={<ShieldAlert size={20} />}
          label="24h Events"
          value={loading ? "..." : String(events24h.length)}
          meta={`${eventSegments[1].value + eventSegments[2].value} require attention`}
          accent="#EA580C"
          tone="warning"
        />
        <MetricCard
          icon={status?.alarm_active ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
          label="Protection Mode"
          value={status ? status.mode.toUpperCase() : "..."}
          meta={status?.alarm_active ? "Alarm is active right now" : "Alarm channel is clear"}
          accent={status?.alarm_active ? "#DC2626" : "#16A34A"}
          tone={status?.alarm_active ? "danger" : "success"}
        />
      </div>

      <div className="dashboard-grid">
        <section className="app-card dashboard-card app-fade-up">
          <div className="app-panel-header">
            <div>
              <h2 className="app-section-title">Event Mix</h2>
              <p className="app-panel-subtitle">Detection outcomes across the last 24 hours.</p>
            </div>
            <span className="app-status app-status--primary">{events24h.length} Total</span>
          </div>
          <DonutPanel
            centerLabel={`${events24h.length}`}
            centerValue="detections"
            segments={eventSegments}
          />
        </section>

        <section className="app-card dashboard-card app-fade-up">
          <div className="app-panel-header">
            <div>
              <h2 className="app-section-title">Latest Recognition</h2>
              <p className="app-panel-subtitle">The newest event streamed from the active device.</p>
            </div>
            {status && (
              <span className={`app-status ${status.alarm_active ? "app-status--danger" : "app-status--success"}`}>
                {status.alarm_active ? "Alarm Active" : `${status.mode} mode`}
              </span>
            )}
          </div>

          {latestEvent ? (
            <div className="dashboard-latest">
              <AuthImage
                src={latestEvent.snapshot_path ?? undefined}
                alt="Latest recognition snapshot"
                className="dashboard-latest__image"
                fallback={
                  <div className="dashboard-latest__placeholder">
                    <Camera size={30} />
                  </div>
                }
              />
              <div className="dashboard-latest__body">
                <div className="dashboard-latest__headline">
                  <p className="dashboard-latest__name">
                    {latestEvent.matched_name ?? eventPalette[latestEvent.event_type].label}
                  </p>
                  <span className={`app-status app-status--${eventPalette[latestEvent.event_type].tone}`}>
                    {eventPalette[latestEvent.event_type].label}
                  </span>
                </div>
                <div className="dashboard-meta-grid">
                  <MetaItem label="Time" value={formatTimestamp(latestEvent.timestamp)} />
                  <MetaItem label="Alarm" value={latestEvent.alarm_triggered ? "Triggered" : "No"} />
                  <MetaItem label="Mode" value={status?.mode.toUpperCase() ?? "Unknown"} />
                  <MetaItem label="State Updated" value={status ? formatTimestamp(status.updated_at) : "Unknown"} />
                </div>
              </div>
            </div>
          ) : (
            <p className="app-empty">No events have been recorded yet.</p>
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="app-card dashboard-card app-fade-up">
          <div className="app-panel-header">
            <div>
              <h2 className="app-section-title">Weekly Activity</h2>
              <p className="app-panel-subtitle">Detection volume over the last seven days.</p>
            </div>
          </div>
          <div className="dashboard-bars">
            {weeklySeries.map((day) => (
              <div key={day.label} className="dashboard-bars__item">
                <span className="dashboard-bars__count">{day.count}</span>
                <div className="dashboard-bars__track">
                  <div
                    className="dashboard-bars__fill"
                    style={{ height: `${day.height}%` }}
                  />
                </div>
                <span className="dashboard-bars__label">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="app-card dashboard-card app-fade-up">
          <div className="app-panel-header">
            <div>
              <h2 className="app-section-title">Account Coverage</h2>
              <p className="app-panel-subtitle">Primary, invited, and admin accounts in the current backend.</p>
            </div>
            <span className="app-status app-status--neutral">{appUsers.length + adminCount} Total</span>
          </div>
          <DonutPanel
            centerLabel={`${linkedUsers}`}
            centerValue="with device access"
            segments={accountSegments}
          />
        </section>
      </div>

      <section className="app-card dashboard-card app-fade-up">
        <div className="app-panel-header">
          <div>
            <h2 className="app-section-title">Recent Events</h2>
            <p className="app-panel-subtitle">The latest security decisions coming from the backend event stream.</p>
          </div>
        </div>

        {loading ? (
          <p className="app-empty">Loading recent events...</p>
        ) : events.length === 0 ? (
          <p className="app-empty">No events yet.</p>
        ) : (
          <div className="dashboard-events">
            {events.slice(0, 6).map((event) => (
              <article
                key={event.id}
                className={`dashboard-event dashboard-event--${eventPalette[event.event_type].tone}`}
              >
                <AuthImage
                  src={event.snapshot_path ?? undefined}
                  alt="Recognition snapshot"
                  className="dashboard-event__image"
                  fallback={
                    <div className="dashboard-event__placeholder">
                      <Camera size={20} />
                    </div>
                  }
                />
                <div className="dashboard-event__body">
                  <div className="dashboard-event__headline">
                    <p className="dashboard-event__title">
                      {event.matched_name ?? eventPalette[event.event_type].label}
                    </p>
                    <span className={`app-status app-status--${eventPalette[event.event_type].tone}`}>
                      {eventPalette[event.event_type].label}
                    </span>
                  </div>
                  <p className="dashboard-event__meta">{formatTimestamp(event.timestamp)}</p>
                </div>
                {event.alarm_triggered && <span className="app-status app-status--danger">Alarm</span>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  meta,
  accent,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta: string;
  accent: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  return (
    <article
      className="app-card app-kpi-card app-fade-up"
      style={
        {
          "--kpi-accent": `${accent}20`,
          "--kpi-accent-soft":
            tone === "success"
              ? "#dcfce7"
              : tone === "warning"
                ? "#ffedd5"
                : tone === "danger"
                  ? "#fee2e2"
                  : "#dbeafe",
          "--kpi-accent-text": accent,
        } as CSSProperties
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

function DonutPanel({
  centerLabel,
  centerValue,
  segments,
}: {
  centerLabel: string;
  centerValue: string;
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="dashboard-donut">
      <div className="dashboard-donut__chart">
        <div className="dashboard-donut__ring" style={{ "--donut": buildDonut(segments) } as CSSProperties}>
          <div className="dashboard-donut__center">
            <strong>{centerLabel}</strong>
            <span>{centerValue}</span>
          </div>
        </div>
      </div>
      <div className="dashboard-donut__legend">
        {segments.map((segment) => (
          <div key={segment.label} className="dashboard-donut__legend-item">
            <span className="dashboard-donut__swatch" style={{ background: segment.color }} />
            <div>
              <p>{segment.label}</p>
              <span>
                {segment.value}
                {total > 0 ? ` • ${Math.round((segment.value / total) * 100)}%` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildDonut(segments: Array<{ value: number; color: string }>) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return "conic-gradient(#E2E8F0 0deg 360deg)";
  }

  let cursor = 0;
  const parts: string[] = [];

  for (const segment of segments) {
    if (segment.value <= 0) continue;
    const next = cursor + (segment.value / total) * 360;
    parts.push(`${segment.color} ${cursor}deg ${next}deg`);
    cursor = next;
  }

  return `conic-gradient(${parts.join(", ")})`;
}

function buildDailySeries(events: BackendEvent[]) {
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const today = new Date();
  const counts = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const count = events.filter((event) => {
      const time = new Date(event.timestamp).getTime();
      return time >= day.getTime() && time < nextDay.getTime();
    }).length;

    return { label: formatter.format(day), count };
  });

  const peak = Math.max(...counts.map((item) => item.count), 1);

  return counts.map((item) => ({
    ...item,
    height: Math.max(14, Math.round((item.count / peak) * 100)),
  }));
}

function sortEvents(events: BackendEvent[]) {
  return [...events].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

function upsertEvent(current: BackendEvent[], next: BackendEvent) {
  const exists = current.some((item) => item.id === next.id);
  const merged = exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
  return sortEvents(merged);
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}
