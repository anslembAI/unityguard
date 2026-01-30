import { db } from "./schema";

const SEED_KEY = "unityguard_seeded_v2";

export async function ensureSeeded() {
    if (typeof window === "undefined") return;

    const seeded = localStorage.getItem(SEED_KEY);
    if (seeded) return;

    const now = Date.now();

    // Alerts (match mockup)
    await db.alerts.bulkAdd([
        {
            id: crypto.randomUUID(),
            type: "suspicious",
            urgency: "high",
            status: "active",
            title: "Suspicious activity reported",
            description: "Unfamiliar vehicle circling the block. Stay alert.",
            createdAt: now - 1000 * 60 * 12,
            createdBy: "UnityGuard",
            origin: "official",
        },
        {
            id: crypto.randomUUID(),
            type: "hazard",
            urgency: "med",
            status: "monitoring",
            title: "Road hazard",
            description: "Debris near main entrance. Drive carefully.",
            createdAt: now - 1000 * 60 * 50,
            createdBy: "UnityGuard",
            origin: "official",
        },
    ]);

    // One main group thread (match mockup)
    const threadId = crypto.randomUUID();
    await db.threads.add({
        id: threadId,
        type: "group",
        title: "Block Watch Group",
        subtitle: "75 members online",
        updatedAt: now,
        lastMessageAt: now - 1000 * 60 * 2,
    });

    await db.messages.bulkAdd([
        {
            id: crypto.randomUUID(),
            threadId,
            senderName: "Alex",
            body: "I saw someone in a hoodie lurking by the park.",
            createdAt: now - 1000 * 60 * 8,
            isMe: false,
        },
        {
            id: crypto.randomUUID(),
            threadId,
            senderName: "Lisa",
            body: "Let’s keep an eye out. What color was the hoodie?",
            createdAt: now - 1000 * 60 * 6,
            isMe: false,
        },
        {
            id: crypto.randomUUID(),
            threadId,
            senderName: "Mike",
            body: "Black hoodie, looked suspicious.",
            createdAt: now - 1000 * 60 * 4,
            isMe: false,
        },
    ]);

    // Seed a pending report for the Moderator view
    await db.reports.add({
        id: crypto.randomUUID(),
        type: "suspicious",
        urgency: "med",
        title: "Possible suspicious person",
        description: "Someone walking slowly and checking gates near the corner house.",
        createdAt: now - 1000 * 60 * 20,
        createdBy: "Resident",
        status: "pending",
    });

    localStorage.setItem(SEED_KEY, "1");
}
