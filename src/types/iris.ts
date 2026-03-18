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