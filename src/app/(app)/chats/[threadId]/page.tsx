"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Message } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { TopBarChat } from "@/components/layout/top-bars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";

export default function ChatThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);

  useEffect(() => {
    ensureSeeded();
  }, []);

  const thread = useLiveQuery(() => db.threads.get(threadId), [threadId]);
  const messages = useLiveQuery(
    () => db.messages.where("threadId").equals(threadId).sortBy("createdAt"),
    [threadId],
    [] as Message[]
  );

  const [text, setText] = useState("");

  const subtitle = useMemo(() => thread?.subtitle || "", [thread?.subtitle]);

  async function send() {
    const body = text.trim();
    if (!body) return;

    await db.messages.add({
      id: crypto.randomUUID(),
      threadId,
      senderName: "You",
      body,
      createdAt: Date.now(),
      isMe: true,
    });

    await db.threads.update(threadId, {
      updatedAt: Date.now(),
      lastMessageAt: Date.now(),
    });

    setText("");
  }

  return (
    <div className="min-h-dvh">
      <TopBarChat title={thread?.title || "Chat"} subtitle={subtitle} />

      <div className="mx-auto flex max-w-md flex-col px-4 pb-24 pt-4">
        <div className="mx-auto mb-3 rounded-full bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          Today • 01:30
        </div>

        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.isMe ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"
                  }`}
              >
                {!m.isMe ? (
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">{m.senderName}:</div>
                ) : null}
                <div>{m.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 border-t bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <button className="rounded-md p-2 text-muted-foreground hover:bg-muted/40">
            <Paperclip className="h-5 w-5" />
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <Button size="icon" onClick={send}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
