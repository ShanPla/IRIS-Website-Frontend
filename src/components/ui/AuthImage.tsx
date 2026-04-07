import { useEffect, useRef, useState } from "react";

interface AuthImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Image component that fetches via fetch() with ngrok-skip-browser-warning header,
 * so images load correctly through ngrok tunnels.
 */
export default function AuthImage({ src, alt, className, fallback }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setFailed(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        if (!blob.type.startsWith("image/")) {
          setFailed(true);
          return;
        }
        const url = URL.createObjectURL(blob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    };
  }, []);

  useEffect(() => {
    prevUrl.current = blobUrl;
  }, [blobUrl]);

  if (failed || !blobUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
