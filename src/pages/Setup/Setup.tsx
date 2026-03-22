import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Server, Wifi } from "lucide-react";
import { DEFAULT_PI_HINT, getStoredPiAddress, probeBackend, setStoredBackendUrl } from "../../lib/api";
import "./Setup.css";

export default function Setup() {
  const navigate = useNavigate();
  const [backendInput, setBackendInput] = useState(getStoredPiAddress() ?? DEFAULT_PI_HINT);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!backendInput.trim()) {
      setError("Please enter your Raspberry Pi IP.");
      return;
    }
    setSaving(true);
    setError("");
    const probe = await probeBackend(backendInput);
    if (!probe.ok) {
      setError(probe.message);
      setSaving(false);
      return;
    }
    setStoredBackendUrl(probe.normalizedUrl);
    setSaving(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-icon"><Server size={22} /></div>
        <h1 className="setup-title">Connect to IRIS Backend</h1>
        <p className="setup-desc">
          Enter the IP address of the Raspberry Pi running the IRIS backend. Port defaults to 8000.
        </p>
        <div className="setup-field">
          <label>Raspberry Pi IP Address</label>
          <input
            type="text"
            value={backendInput}
            onChange={(e) => setBackendInput(e.target.value)}
            placeholder="e.g. 192.168.1.120"
            onKeyDown={(e) => e.key === "Enter" && void handleSave()}
          />
        </div>
        {error && <p className="setup-error">{error}</p>}
        <button className="setup-btn" onClick={() => void handleSave()} disabled={saving}>
          <Wifi size={16} />
          {saving ? "Connecting..." : "Connect & Continue"}
        </button>
        <p className="setup-hint">
          For local testing: <code>127.0.0.1:8000</code>
        </p>
      </div>
    </div>
  );
}
