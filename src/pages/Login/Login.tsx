import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useId,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { Radio } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getStoredBackendUrl,
  normalizeBackendUrl,
  probeBackend,
} from "../../lib/api";
import "./Login.css";
import { Button } from "../../components/ui/neon-button";
import goldGlobeVideo from "../../assets/Gold_Globe.mp4";

const FOOTER_ITEMS = [
  { label: "Developed by SSR", tone: "strong" as const },
  {
    label: "Linked In Reymark",
    href: "https://www.linkedin.com/in/reymark-de-castro-459598389",
    tone: "strong" as const,
  },
  { label: "Version: 1.0", tone: "muted" as const },
  { label: "IRIS Control Panel", tone: "muted" as const },
];

type HlsInstance = {
  loadSource: (source: string) => void;
  attachMedia: (media: HTMLMediaElement) => void;
  on: (event: string, callback: () => void) => void;
};

type HlsConstructor = {
  new (): HlsInstance;
  isSupported: () => boolean;
  Events: {
    MANIFEST_PARSED: string;
  };
};

type HlsWindow = Window & typeof globalThis & {
  Hls?: HlsConstructor;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const muxVideoRef = useRef<HTMLVideoElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const usernameInputId = useId();
  const passwordInputId = useId();
  const loginErrorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [marqueeDistance, setMarqueeDistance] = useState(0);

  // Randomized Shooting Stars
  const stars = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 45}%`,
      right: `${-10 - Math.random() * 10}%`,
      delay: `${Math.random() * 8}s`, // Reduced delay from 12s to 8s
      duration: `${4 + Math.random() * 5}s`, // Slightly faster travel time
      width: `${80 + Math.random() * 120}px`,
      angle: `${150 + Math.random() * 20}deg`,
      distance: `-${1400 + Math.random() * 800}px`,
    }));
  }, []);

  const configuredBackendUrl = useMemo(
    () => normalizeBackendUrl(getStoredBackendUrl() ?? ""),
    []
  );

  const [backendState, setBackendState] = useState<
    "checking" | "online" | "offline" | "missing"
  >(configuredBackendUrl ? "checking" : "missing");

  const marqueeItems = useMemo(
    () => [...FOOTER_ITEMS, ...FOOTER_ITEMS, ...FOOTER_ITEMS],
    []
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleReady = () => setVideoReady(true);
    const handleError = () => setVideoReady(false);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.loop = true;
    video.src = goldGlobeVideo;

    video.addEventListener("canplay", handleReady);
    video.addEventListener("error", handleError);

    void video.play().catch(() => undefined);

    return () => {
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const muxVideo = muxVideoRef.current;
    if (!muxVideo) return;

    muxVideo.muted = true;
    muxVideo.playsInline = true;
    muxVideo.loop = true;

    const hlsUrl = "https://stream.mux.com/01yW6GoUz01OTXk5w1Rt1MHkJWlCGIwj46SUONJZ4DJUE.m3u8";

    // Check if HLS.js is already loaded (via script tag in index.html or dynamic load)
    const playHls = () => {
      const Hls = (window as HlsWindow).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(muxVideo);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          muxVideo.playbackRate = 0.5;
          void muxVideo.play().catch(() => undefined);
        });
      } else if (muxVideo.canPlayType("application/vnd.apple.mpegurl")) {
        // Native support (Safari)
        muxVideo.src = hlsUrl;
        muxVideo.playbackRate = 0.5;
        void muxVideo.play().catch(() => undefined);
      }
    };

    if (!(window as HlsWindow).Hls) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.onload = playHls;
      document.head.appendChild(script);
    } else {
      playHls();
    }
  }, []);

  useEffect(() => {
    if (!configuredBackendUrl) return;

    let isMounted = true;

    const checkBackend = async () => {
      const result = await probeBackend(configuredBackendUrl);

      if (isMounted) {
        setBackendState(result.ok ? "online" : "offline");
      }
    };

    checkBackend();

    return () => {
      isMounted = false;
    };
  }, [configuredBackendUrl]);

  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;

    const updateDistance = () => setMarqueeDistance(track.scrollWidth);
    updateDistance();

    const observer = new ResizeObserver(updateDistance);
    observer.observe(track);

    return () => observer.disconnect();
  }, [marqueeItems]);

  const clock = useMemo(
    () => ({
      hours: String(now.getHours()).padStart(2, "0"),
      minutes: String(now.getMinutes()).padStart(2, "0"),
      seconds: String(now.getSeconds()).padStart(2, "0"),
    }),
    [now]
  );

  const statusLabel = useMemo(() => {
    if (backendState === "online") return "Online";
    if (backendState === "offline" || backendState === "missing") return "Offline";
    return "Linking";
  }, [backendState]);

  const marqueeStyle = useMemo(
    () =>
      ({
        "--login-marquee-distance": `${marqueeDistance}px`,
        "--login-marquee-distance-negative": `-${marqueeDistance}px`,
        "--login-marquee-duration": `${Math.max(marqueeDistance / 80, 18)}s`,
      } as CSSProperties),
    [marqueeDistance]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!configuredBackendUrl) {
        setError("Backend API is not configured.");
        return;
      }

      if (!username.trim() || !password) {
        setError("Please provide both credentials.");
        return;
      }

      setSubmitting(true);
      setError("");

      const result = await login(username, password);

      setSubmitting(false);

      if (result.success) {
        navigate("/devices", { replace: true });
      } else {
        setError(result.error ?? "Login failed. Please verify credentials.");
      }
    },
    [configuredBackendUrl, username, password, login, navigate]
  );

  return (
    <div className="login-page">
      <div className="login-page__mesh" aria-hidden="true">
        <video
          ref={muxVideoRef}
          className="login-page__background-video"
          autoPlay
          muted
          loop
          playsInline
        />
        <video
          ref={videoRef}
          className={`login-page__video ${
            videoReady ? "login-page__video--ready" : ""
          }`}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="login-page__blue-aura" />
        <div className="login-page__starfield" />

        <div className="login-page__shooting-stars">
          {stars.map((star) => (
            <span
              key={star.id}
              className="login-page__shooting-star"
              style={
                {
                  "--star-top": star.top,
                  "--star-right": star.right,
                  "--star-delay": star.delay,
                  "--star-duration": star.duration,
                  "--star-width": star.width,
                  "--star-angle": star.angle,
                  "--star-x": star.x,
                  "--star-y": star.y,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="login-page__video-overlay" />
        <div className="login-page__noise" />
        <div className="login-page__grid" />
      </div>

      <header className="login-topbar">
        <div className="login-topbar__brand">
          <Radio size={18} />
          <div>
            <h1>IRIS</h1>
            <span>System Status: {statusLabel}</span>
          </div>
        </div>

        <div className="login-topbar__clock">
          <span className="login-topbar__digit login-topbar__digit--one">
            {clock.hours}
          </span>
          <span className="login-topbar__sep">:</span>
          <span className="login-topbar__digit login-topbar__digit--two">
            {clock.minutes}
          </span>
          <span className="login-topbar__sep">:</span>
          <span className="login-topbar__digit login-topbar__digit--three">
            {clock.seconds}
          </span>
        </div>
      </header>

      <main className="login-terminal">
        <section className="login-terminal__panel glass-monolith">
          <div className="login-terminal__header">
            <h2>Admin Access</h2>
            <p>
              Encrypted terminal access for <span>IRIS Core</span>.
            </p>
          </div>

          {(error || submitting) && (
            <div className="login-alert-container">
              {submitting ? (
                <div className="login-alert login-alert--info">
                  <Radio className="login-alert__icon animate-pulse" size={14} />
                  <span>Verifying Terminal Identity...</span>
                </div>
              ) : (
                <p
                  id={loginErrorId}
                  className="login-alert login-alert--danger"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              )}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form__field">
              <label className="login-form__label" htmlFor={usernameInputId}>
                Terminal Identity
              </label>
              <div className="login-input">
                <span className="login-input__icon">@</span>
                <input
                  id={usernameInputId}
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="login-input__field"
                  autoComplete="username"
                  aria-describedby={error ? loginErrorId : undefined}
                  aria-invalid={Boolean(error)}
                  required
                />
              </div>
            </div>

            <div className="login-form__field">
              <label className="login-form__label" htmlFor={passwordInputId}>
                Encryption Key
              </label>
              <div className="login-input">
                <span className="login-input__icon">#</span>
                <input
                  id={passwordInputId}
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="login-input__field"
                  autoComplete="current-password"
                  aria-describedby={error ? loginErrorId : undefined}
                  aria-invalid={Boolean(error)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="login-submit"
              disabled={submitting}
              variant="default"
              aria-busy={submitting}
            >
              {submitting ? "Initializing..." : "Log In"}
            </Button>
          </form>
        </section>
      </main>

      <footer className="login-marquee">
        <div className="login-marquee__rail" style={marqueeStyle}>
          <div className="login-marquee__track" ref={marqueeTrackRef}>
            {marqueeItems.map((item, index) =>
              item.href ? (
                <a
                  key={index}
                  className={`login-marquee__link ${
                    item.tone === "strong"
                      ? "login-marquee__item--strong"
                      : "login-marquee__item--muted"
                  }`}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  key={index}
                  className={
                    item.tone === "strong"
                      ? "login-marquee__item--strong"
                      : "login-marquee__item--muted"
                  }
                >
                  {item.label}
                </span>
              )
            )}
          </div>

          <div className="login-marquee__track" aria-hidden="true">
            {marqueeItems.map((item, index) => (
              <span
                key={index}
                className={
                  item.tone === "strong"
                    ? "login-marquee__item--strong"
                    : "login-marquee__item--muted"
                }
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
