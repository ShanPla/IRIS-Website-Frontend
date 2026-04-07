import { Camera } from "lucide-react";
import AuthImage from "../AuthImage";
import "./SnapshotCard.css";

interface SnapshotCardProps {
  url?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
}

export default function SnapshotCard({ url, alt = "snapshot", size = "md" }: SnapshotCardProps) {
  return (
    <div className={`snapshot-card snapshot-card--${size}`}>
      <AuthImage
        src={url}
        alt={alt}
        className="snapshot-img"
        fallback={
          <div className="snapshot-placeholder">
            <Camera size={size === "sm" ? 14 : size === "lg" ? 32 : 20} />
          </div>
        }
      />
    </div>
  );
}

