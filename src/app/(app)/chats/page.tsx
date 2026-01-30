"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Thread } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { TopBarTitle } from "@/components/layout/top-bars";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    ensureSeeded();
  }, []);

  const threads = useLiveQuery(
    () => db.threads.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Thread[]
  );

  async function createGroup() {
    if (!newTitle.trim()) return;
    const id = crypto.randomUUID();
    await db.threads.add({
      id,
      type: "group",
      title: newTitle.trim(),
      subtitle: "1 member",
      updatedAt: Date.now(),
      lastMessageAt: Date.now(),
    });

    setNewTitle("");
    setOpen(false);
    router.push(`/chats/${id}`);
  }

  return (
    <div>
      <TopBarTitle title="Chats" />
      <div className="mx-auto max-w-md space-y-3 px-4 py-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Group Name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Button onClick={createGroup} className="w-full">Create & Open</Button>
            </div>
          </DialogContent>
        </Dialog>

        {threads.map((t) => (
          <Link key={t.id} href={`/chats/${t.id}`}>
            <Card className="border-muted/60 bg-muted/20 p-4 hover:bg-muted/30">
              <div className="font-semibold">{t.title}</div>
              <div className="text-sm text-muted-foreground">{t.subtitle || "—"}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
