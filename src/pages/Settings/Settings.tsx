import { useState } from "react";
import { Shield, Bell, Wifi, Save } from "lucide-react";
import type { SecurityMode } from "../../types/iris";
import "./Settings.css";

export default function Settings() {
  const [mode, setMode] = useState<SecurityMode>("home");
  const [sensitivity, setSensitivity] = useState(50);
  const [alarmDelay, setAlarmDelay] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [snapshotAlerts, setSnapshotAlerts] = useState(true);
  const [piAddress, setPiAddress] = useState("192.168.1.100");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: send to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <button className="settings-save-btn" onClick={handleSave}>
          <Save size={15} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Security Mode */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Shield size={16} />
          Security Mode
        </div>
        <p className="settings-section-desc">
          Set whether the system is in Home or Away mode. Away mode applies stricter detection and faster alerting.
        </p>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "home" ? "mode-btn--active" : ""}`}
            onClick={() => setMode("home")}
          >
            🏠 Home
          </button>
          <button
            className={`mode-btn ${mode === "away" ? "mode-btn--active" : ""}`}
            onClick={() => setMode("away")}
          >
            🌙 Away
          </button>
        </div>
        <p className="mode-description">
          {mode === "home"
            ? "Home mode: alarm behavior suitable for occupied residences. Alarms still trigger for unrecognized individuals."
            : "Away mode: stricter sensitivity and faster alerting. All unverified presence triggers an immediate alert."}
        </p>
      </section>

      {/* Detection Sensitivity */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Shield size={16} />
          Detection Sensitivity
        </div>
        <p className="settings-section-desc">
          Controls how sensitive the human verification step is. Higher values may increase false positives.
        </p>
        <div className="slider-row">
          <span className="slider-label">Low</span>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="slider"
          />
          <span className="slider-label">High</span>
          <span className="slider-value">{sensitivity}%</span>
        </div>
      </section>

      {/* Alarm Delay */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Bell size={16} />
          Alarm Escalation Delay
        </div>
        <p className="settings-section-desc">
          How long (in seconds) the system waits after sending a soft alert before triggering the local audible alarm.
        </p>
        <div className="slider-row">
          <span className="slider-label">0s</span>
          <input
            type="range"
            min={0}
            max={60}
            value={alarmDelay}
            onChange={(e) => setAlarmDelay(Number(e.target.value))}
            className="slider"
          />
          <span className="slider-label">60s</span>
          <span className="slider-value">{alarmDelay}s</span>
        </div>
      </section>

      {/* Notifications */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Bell size={16} />
          Notifications
        </div>
        <div className="toggle-row">
          <div>
            <p className="toggle-label">Enable Mobile Notifications</p>
            <p className="toggle-desc">Send alerts to the homeowner's mobile device via Telegram.</p>
          </div>
          <button
            className={`toggle-switch ${notificationsEnabled ? "toggle-switch--on" : ""}`}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <div className="toggle-row">
          <div>
            <p className="toggle-label">Include Snapshot in Alerts</p>
            <p className="toggle-desc">Attach a snapshot image to every mobile notification.</p>
          </div>
          <button
            className={`toggle-switch ${snapshotAlerts ? "toggle-switch--on" : ""}`}
            onClick={() => setSnapshotAlerts(!snapshotAlerts)}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </section>

      {/* Raspberry Pi Connection */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Wifi size={16} />
          Raspberry Pi Connection
        </div>
        <p className="settings-section-desc">
          The local IP address of the Raspberry Pi running the IRIS backend.
        </p>
        <div className="settings-input-row">
          <label>Pi IP Address</label>
          <input
            type="text"
            value={piAddress}
            onChange={(e) => setPiAddress(e.target.value)}
            placeholder="e.g. 192.168.1.100"
            className="settings-input"
          />
        </div>
      </section>
    </div>
  );
}