import Dexie, { type Table } from "dexie";

export type AlertType =
  | "suspicious"
  | "theft"
  | "hazard"
  | "missing"
  | "emergency"
  | "other";

export type Urgency = "low" | "med" | "high";
export type AlertStatus = "active" | "monitoring" | "resolved";

export interface Alert {
  id: string;
  type: AlertType;
  urgency: Urgency;
  status: AlertStatus;
  title: string;
  description: string;
  createdAt: number;
  createdBy: string;
  origin?: "official" | "community";
}

export interface Thread {
  id: string;
  type: "group" | "dm";
  title: string;
  subtitle?: string; // e.g. "75 members online"
  updatedAt: number;
  lastMessageAt?: number;
}

export interface Message {
  id: string;
  threadId: string;
  senderName: string;
  body: string;
  attachment?: string; // base64 data url for images
  createdAt: number;
  // "me" drives right-side bubble styling
  isMe: boolean;
}

export interface SettingKV {
  key: string;
  value: unknown;
}

export interface Report {
  id: string;
  type: AlertType;
  urgency: Urgency;
  title: string;
  description: string;
  createdAt: number;
  createdBy: string;
  status: "pending" | "need_info" | "dismissed" | "published";
}

export class WatchDB extends Dexie {
  alerts!: Table<Alert, string>;
  threads!: Table<Thread, string>;
  messages!: Table<Message, string>;
  settings!: Table<SettingKV, string>;
  reports!: Table<Report, string>; // moderator queue (local only for now)

  constructor() {
    super("watch_db");

    // v1 had only alerts
    this.version(1).stores({
      alerts: "id, status, createdAt, urgency, type",
    });

    // v2 adds chats + settings + reports
    this.version(2).stores({
      alerts: "id, status, createdAt, urgency, type",
      threads: "id, type, updatedAt, lastMessageAt",
      messages: "id, threadId, createdAt, isMe",
      reports: "id, status, createdAt, urgency, type",
      settings: "key",
    });
  }
}

export const db = new WatchDB();

