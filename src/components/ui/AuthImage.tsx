import { useEffect, useState } from "react";
import { apiClient } from "../../lib/api";

interface AuthImageProps {
  /** API path like "/api/snapshots/xxx.jpg" — fetched via apiClient with auth */
  src: string | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function AuthImage({ src, alt, className, fallback }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) {
      return;
    }

    let cancelled = false;

    apiClient
      .get<Blob>(src, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const blob = res.data;
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
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  if (!src || failed || !blobUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
