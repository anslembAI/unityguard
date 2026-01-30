import Dexie, { type Table } from "dexie";

export type AlertType = "suspicious" | "theft" | "hazard" | "missing" | "emergency" | "other";
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
  title: string;
  participantIds: string[];
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  lastMessagePreview?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: number;
}

export class WatchDB extends Dexie {
  alerts!: Table<Alert, string>;
  threads!: Table<Thread, string>;
  messages!: Table<Message, string>;

  constructor() {
    super("watch_db");
    this.version(1).stores({
      alerts: "id, status, createdAt, urgency, type",
      threads: "id, participantIds, createdAt, updatedAt, lastMessageAt",
      messages: "id, threadId, senderId, createdAt",
    });
  }
}

export const db = new WatchDB();

const SEED_KEY = "watch_seeded_v1";

export async function ensureSeeded() {
  if (typeof window === "undefined") return;

  const seeded = localStorage.getItem(SEED_KEY);
  if (seeded) return;

  await db.alerts.bulkAdd([
    {
      id: crypto.randomUUID(),
      type: "suspicious",
      urgency: "high",
      status: "active",
      title: "Suspicious activity reported",
      description: "Unfamiliar vehicle circling the block. Stay aware and report details.",
      createdAt: Date.now() - 1000 * 60 * 12,
      createdBy: "System",
      origin: "official",
    },
    {
      id: crypto.randomUUID(),
      type: "hazard",
      urgency: "med",
      status: "monitoring",
      title: "Road hazard",
      description: "Debris reported near the main entrance. Drive carefully.",
      createdAt: Date.now() - 1000 * 60 * 50,
      createdBy: "System",
      origin: "official",
    },
  ]);

  localStorage.setItem(SEED_KEY, "1");
}
