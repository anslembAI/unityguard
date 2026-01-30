"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Report, type Alert } from "@/lib/db/schema";
import { TopBarTitle } from "@/components/layout/top-bars";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendNotification } from "@/actions/push-notifications";

function UrgencyBadge({ urgency }: { urgency: Alert["urgency"] }) {
    return (
        <Badge variant={urgency === "high" ? "destructive" : urgency === "med" ? "secondary" : "outline"}>
            {urgency.toUpperCase()}
        </Badge>
    );
}

export default function ModQueuePage() {
    const reports = useLiveQuery(
        () => db.reports.where("status").equals("pending").reverse().sortBy("createdAt"),
        [],
        [] as Report[]
    );

    async function publish(r: Report) {
        // 1) Create an official alert locally
        const alertId = crypto.randomUUID();
        const now = Date.now();
        await db.alerts.add({
            id: alertId,
            type: r.type,
            urgency: r.urgency,
            status: "active",
            title: r.title,
            description: r.description,
            createdAt: now,
            createdBy: "Moderator",
            origin: "official",
        });

        // 2) Mark report as published
        await db.reports.update(r.id, { status: "published" });

        // 3) Trigger push (demo sends to your stored subscription)
        await sendNotification(`OFFICIAL: ${r.title}`);
    }

    async function dismiss(r: Report) {
        await db.reports.update(r.id, { status: "dismissed" });
    }

    return (
        <div>
            <TopBarTitle title="Mod Queue" />

            <div className="mx-auto max-w-md space-y-3 px-4 py-4">
                {reports.length === 0 ? (
                    <Card className="p-4 text-sm text-muted-foreground">No pending reports.</Card>
                ) : (
                    reports.map((r) => (
                        <Card key={r.id} className="border-muted/60 bg-muted/20 p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-semibold">{r.title}</div>
                                    <div className="text-sm text-muted-foreground">{r.description}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        From: {r.createdBy} • {r.type}
                                    </div>
                                </div>
                                <UrgencyBadge urgency={r.urgency} />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1" onClick={() => publish(r)}>Publish Official</Button>
                                <Button className="flex-1" variant="secondary" onClick={() => dismiss(r)}>Dismiss</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
