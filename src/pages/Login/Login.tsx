import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, ShieldCheck, Users } from "lucide-react";
import heroImage from "../../assets/hero.png";
import { useAuth } from "../../context/AuthContext";
import { hasBackendUrlConfigured, hasPiBackendConfigured } from "../../lib/api";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const backendConfigured = hasBackendUrlConfigured();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await login(username, password);
    setSubmitting(false);

    if (result.success) {
      navigate(hasPiBackendConfigured() ? "/dashboard" : "/setup");
      return;
    }

    setError(result.error ?? "Login failed. Check your username, password, and backend API.");
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <section className="app-card login-panel login-panel--brand">
          <span className="login-badge">Admin access only</span>
          <h1>Protect every IRIS node from one calm control room.</h1>
          <p>
            Monitor active devices, manage authorized faces, and keep administrator access tight
            from the same web workspace.
          </p>

          <div className="login-highlights">
            <article className="login-highlight">
              <div className="login-highlight__icon">
                <HardDrive size={18} />
              </div>
              <div>
                <strong>Device health</strong>
                <span>Track the connected Raspberry Pi and its service readiness.</span>
              </div>
            </article>
            <article className="login-highlight">
              <div className="login-highlight__icon">
                <Users size={18} />
              </div>
              <div>
                <strong>Access control</strong>
                <span>Keep admins and linked user access under a single secure login.</span>
              </div>
            </article>
            <article className="login-highlight">
              <div className="login-highlight__icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>Recognition oversight</strong>
                <span>Review profile readiness and recent detections without exposing private data.</span>
              </div>
            </article>
          </div>

          <img src={heroImage} alt="IRIS hardware illustration" className="login-hero" />
        </section>

        <section className="app-card login-panel login-panel--form">
          <div className="login-brand">
            <div className="login-brand__mark">IRIS</div>
            <div>
              <p className="login-brand__eyebrow">Integrated Recognition for Intrusion System</p>
              <h2>Welcome back</h2>
            </div>
          </div>

          <p className="login-copy">Sign in to continue to the IRIS admin workspace. No sign-up is available here.</p>

          {!backendConfigured && (
            <p className="login-alert">Backend API is not configured yet. Set `VITE_API_URL` before signing in.</p>
          )}

          {error && <p className="login-alert login-alert--danger">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="app-field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="app-input"
              />
            </div>
            <div className="app-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="app-input"
              />
            </div>

            <button type="submit" className="app-button app-button--primary login-submit" disabled={submitting || !backendConfigured}>
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
