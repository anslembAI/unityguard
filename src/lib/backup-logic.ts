import { db, Alert, Thread, Message, SettingKV } from "@/lib/db/schema";

export type BackupSnapshot = {
    schemaVersion: 2;
    exportedAt: number;
    data: {
        alerts: Alert[];
        threads: Thread[];
        messages: Message[];
        settings: SettingKV[];
    };
};

export async function buildSnapshot(): Promise<BackupSnapshot> {
    const [alerts, threads, messages, settings] = await Promise.all([
        db.alerts.toArray(),
        db.threads.toArray(),
        db.messages.toArray(),
        db.settings.toArray(),
    ]);

    return {
        schemaVersion: 2,
        exportedAt: Date.now(),
        data: { alerts, threads, messages, settings },
    };
}

export async function restoreSnapshot(
    snapshot: BackupSnapshot,
    mode: "replace" | "merge"
) {
    if (snapshot.schemaVersion !== 2) {
        throw new Error("Backup schema version mismatch.");
    }

    await db.transaction("rw", db.alerts, db.threads, db.messages, db.settings, async () => {
        if (mode === "replace") {
            await Promise.all([
                db.alerts.clear(),
                db.threads.clear(),
                db.messages.clear(),
                db.settings.clear(),
            ]);
        }

        // merge = upsert by primary key
        await Promise.all([
            db.alerts.bulkPut(snapshot.data.alerts),
            db.threads.bulkPut(snapshot.data.threads),
            db.messages.bulkPut(snapshot.data.messages),
            db.settings.bulkPut(snapshot.data.settings),
        ]);
    });
}
