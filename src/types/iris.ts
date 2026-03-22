export type SecurityMode = "home" | "away";

export type EventStatus = "authorized" | "unrecognized" | "unverifiable";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  status: EventStatus;
  snapshotUrl?: string;
  alarmTriggered: boolean;
}

export interface FaceProfile {
  id: string;
  name: string;
  addedAt: string;
  imageUrl?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "superadmin" | "admin";
}

export interface AuthSession {
  user: Omit<AdminUser, "password">;
}

export interface HomeownerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  piDeviceId: string;
  piDeviceLabel: string;
  status: "active" | "inactive";
  lastLogin: string | null;
  lastAlertReceived: string | null;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  storageUsed: number;
  storageTotal: number;
  cameraStatus: "online" | "offline";
  internetStatus: "connected" | "disconnected";
  alarmStatus: "armed" | "disarmed" | "triggered";
  lastDetection: string | null;
}