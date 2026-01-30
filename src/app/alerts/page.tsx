"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Alert } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function UrgencyBadge({ urgency }: { urgency: Alert["urgency"] }) {
  const label = urgency.toUpperCase();
  return <Badge variant={urgency === "high" ? "destructive" : urgency === "med" ? "secondary" : "outline"}>{label}</Badge>;
}

export default function AlertsPage() {
  useEffect(() => {
    ensureSeeded();
  }, []);

  const alerts = useLiveQuery(
    () => db.alerts.orderBy("createdAt").reverse().toArray(),
    [],
    [] as Alert[]
  );

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Alert["type"]>("suspicious");
  const [urgency, setUrgency] = useState<Alert["urgency"]>("med");

  async function createLocalAlert() {
    if (!title.trim()) return;

    await db.alerts.add({
      id: crypto.randomUUID(),
      type,
      urgency,
      status: "active",
      title: title.trim(),
      description: description.trim(),
      createdAt: Date.now(),
      createdBy: "You",
      origin: "community",
    });

    setTitle("");
    setDescription("");
    setType("suspicious");
    setUrgency("med");
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Active & recent updates</div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">New Report</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Community Report</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Type</div>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value as Alert["type"])}
                    aria-label="Alert type"
                  >
                    <option value="suspicious">Suspicious</option>
                    <option value="theft">Theft</option>
                    <option value="hazard">Hazard</option>
                    <option value="missing">Missing</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Urgency</div>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as Alert["urgency"])}
                    aria-label="Alert urgency"
                  >
                    <option value="low">Low</option>
                    <option value="med">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Details (what happened?)" value={description} onChange={(e) => setDescription(e.target.value)} />

              <Button onClick={createLocalAlert}>Submit</Button>
              <p className="text-xs text-muted-foreground">
                This MVP saves locally. Next step is routing reports to a Mod Queue + sending official alerts.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">No alerts yet.</Card>
      ) : (
        alerts.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium leading-tight">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.description || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {a.origin === "official" ? "Official" : "Community"} • {a.type}
                </div>
              </div>
              <UrgencyBadge urgency={a.urgency} />
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
