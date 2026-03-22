import { useEffect, useRef, useState } from "react";
import { Shield, Camera, ShieldAlert, ShieldCheck, BellOff, RefreshCw } from "lucide-react";
import { apiClient, buildApiUrl, getStoredBackendUrl, getStoredToken } from "../../lib/api";
import "./Dashboard.css";

interface SystemStatus { mode: "home" | "away"; alarm_active: boolean; updated_at: string; }
interface BackendEvent { id: number; event_type: "authorized" | "unknown" | "unverifiable"; snapshot_path: string | null; alarm_triggered: boolean; timestamp: string; matched_name: string | null; }

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, eventsRes] = await Promise.all([
        apiClient.get<SystemStatus>("/api/system/status"),
        apiClient.get<{ items: BackendEvent[] }>("/api/events/", { params: { limit: 5 } }),
      ]);
      setStatus(statusRes.data);
      setEvents(eventsRes.data.items);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    // WebSocket live feed
    const base = getStoredBackendUrl();
    const token = getStoredToken();
    if (base && token) {
      const wsBase = base.replace(/^http/, "ws");
      const ws = new WebSocket(`${wsBase}/ws/live?token=${token}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as { type: string; event_type?: string; snapshot_url?: string; alarm_triggered?: boolean; timestamp?: string; id?: number; mode?: string; alarm_active?: boolean; matched_name?: string };
          if (msg.type === "security_event") {
            const newEvent: BackendEvent = {
              id: msg.id ?? Date.now(),
              event_type: (msg.event_type ?? "unverifiable") as BackendEvent["event_type"],
              snapshot_path: msg.snapshot_url ?? null,
              alarm_triggered: msg.alarm_triggered ?? false,
              timestamp: msg.timestamp ?? new Date().toISOString(),
              matched_name: msg.matched_name ?? null,
            };
            setEvents((prev) => [newEvent, ...prev].slice(0, 5));
          }
          if (msg.type === "mode_change") setStatus((s) => s ? { ...s, mode: msg.mode as "home" | "away" } : s);
          if (msg.type === "alarm_change") setStatus((s) => s ? { ...s, alarm_active: msg.alarm_active ?? false } : s);
        } catch { /* ignore */ }
      };
      const ping = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send("ping"); }, 30000);
      ws.onclose = () => clearInterval(ping);
      wsRef.current = ws;
    }

    return () => { wsRef.current?.close(); };
  }, []);

  const silenceAlarm = async () => {
    await apiClient.put("/api/system/alarm", { active: false });
    setStatus((s) => s ? { ...s, alarm_active: false } : s);
  };

  const colorMap: Record<string, string> = {
    authorized: "text-green-400",
    unknown: "text-red-400",
    unverifiable: "text-yellow-400",
  };
  const labelMap: Record<string, string> = {
    authorized: "Authorized",
    unknown: "Unknown Person",
    unverifiable: "Unverifiable",
  };

  return (
    <div className="dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="flex items-center gap-3">
          {status?.alarm_active && (
            <button onClick={() => void silenceAlarm()} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold animate-pulse transition-colors">
              <BellOff size={15} /> Silence Alarm
            </button>
          )}
          <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="dashboard-stats">
        <StatCard icon={<Shield className={status?.mode === "away" ? "icon-yellow" : "icon-cyan"} />} label="Mode" value={status?.mode?.toUpperCase() ?? "—"} />
        <StatCard icon={<Camera className="icon-cyan" />} label="Camera" value="Active" />
        <StatCard
          icon={status?.alarm_active ? <ShieldAlert className="text-red-400" /> : <ShieldCheck className="text-green-400" />}
          label="Alarm"
          value={status?.alarm_active ? "TRIGGERED" : "Safe"}
        />
        <StatCard icon={<ShieldAlert className="icon-yellow" />} label="Last Alert" value={events[0] ? labelMap[events[0].event_type] : "None"} />
      </div>

      <div className="dashboard-feed">
        <p className="feed-label">Recent Events</p>
        {loading ? (
          <div className="feed-placeholder"><p className="text-gray-500 text-sm">Loading...</p></div>
        ) : events.length === 0 ? (
          <div className="feed-placeholder"><Camera size={48} /><p className="text-gray-500 text-sm mt-2">No events yet</p></div>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 bg-gray-900 rounded-xl p-3 border border-gray-800">
                {buildApiUrl(event.snapshot_path) ? (
                  <img src={buildApiUrl(event.snapshot_path)} alt="snapshot" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0"><Camera size={20} className="text-gray-600" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${colorMap[event.event_type]}`}>
                    {labelMap[event.event_type]}{event.matched_name ? ` — ${event.matched_name}` : ""}
                  </p>
                  <p className="text-gray-500 text-xs">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
                {event.alarm_triggered && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full flex-shrink-0">Alarm</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
    </div>
  );
}
