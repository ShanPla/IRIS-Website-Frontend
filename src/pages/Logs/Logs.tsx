import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { SecurityEvent, EventStatus } from "../../types/iris";
import "./Logs.css";

const mockEvents: SecurityEvent[] = [
  {
    id: "1",
    timestamp: "2026-03-18 08:42:11",
    status: "authorized",
    alarmTriggered: false,
  },
  {
    id: "2",
    timestamp: "2026-03-18 09:15:03",
    status: "unrecognized",
    alarmTriggered: true,
    snapshotUrl: "https://placehold.co/120x80?text=Snapshot",
  },
  {
    id: "3",
    timestamp: "2026-03-18 10:02:47",
    status: "unverifiable",
    alarmTriggered: false,
    snapshotUrl: "https://placehold.co/120x80?text=Snapshot",
  },
  {
    id: "4",
    timestamp: "2026-03-18 11:30:55",
    status: "authorized",
    alarmTriggered: false,
  },
  {
    id: "5",
    timestamp: "2026-03-18 12:08:19",
    status: "unrecognized",
    alarmTriggered: true,
    snapshotUrl: "https://placehold.co/120x80?text=Snapshot",
  },
];

const statusConfig: Record<EventStatus, { label: string; icon: React.ReactNode; className: string }> = {
  authorized: {
    label: "Authorized",
    icon: <ShieldCheck size={14} />,
    className: "badge badge--authorized",
  },
  unrecognized: {
    label: "Unrecognized",
    icon: <ShieldAlert size={14} />,
    className: "badge badge--unrecognized",
  },
  unverifiable: {
    label: "Unverifiable",
    icon: <ShieldQuestion size={14} />,
    className: "badge badge--unverifiable",
  },
};

export default function Logs() {
  const [filter, setFilter] = useState<EventStatus | "all">("all");

  const filtered = filter === "all"
    ? mockEvents
    : mockEvents.filter((e) => e.status === filter);

  return (
    <div className="logs">
      <div className="logs-header">
        <h1 className="logs-title">Event Logs</h1>
        <div className="logs-filters">
          {(["all", "authorized", "unrecognized", "unverifiable"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? "filter-btn--active" : ""}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Snapshot</th>
              <th>Alarm</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="logs-empty">No events found.</td>
              </tr>
            ) : (
              filtered.map((event) => {
                const config = statusConfig[event.status];
                return (
                  <tr key={event.id}>
                    <td className="logs-timestamp">{event.timestamp}</td>
                    <td>
                      <span className={config.className}>
                        {config.icon}
                        {config.label}
                      </span>
                    </td>
                    <td>
                      {event.snapshotUrl ? (
                        <img
                          src={event.snapshotUrl}
                          alt="snapshot"
                          className="logs-snapshot"
                        />
                      ) : (
                        <span className="logs-no-snapshot">—</span>
                      )}
                    </td>
                    <td>
                      <span className={event.alarmTriggered ? "alarm-yes" : "alarm-no"}>
                        {event.alarmTriggered ? "Triggered" : "No"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}