"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Thread } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { TopBarTitle } from "@/components/layout/top-bars";
import { Card } from "@/components/ui/card";

export default function ChatsPage() {
  useEffect(() => {
    ensureSeeded();
  }, []);

  const threads = useLiveQuery(
    () => db.threads.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Thread[]
  );

  return (
    <div>
      <TopBarTitle title="Chats" />
      <div className="mx-auto max-w-md space-y-3 px-4 py-4">
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
