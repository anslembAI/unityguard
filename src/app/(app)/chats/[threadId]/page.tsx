"use client";

import { useEffect, useMemo, useState, use, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Message } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { getClientId, channelName, publish, subscribe, history } from "@/lib/realtime/ably";
import { getDisplayName } from "@/lib/profile";
import { TopBarChat } from "@/components/layout/top-bars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";

export default function ChatThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureSeeded();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = channelName("chat", threadId);

    // Subscribe to incoming messages
    const unsubscribe = subscribe(channel, "message_created", async (msg) => {
      const data = msg.data as Message & { senderId: string };

      // Ignore our own messages (handled optimistically)
      if (data.senderId === getClientId()) return;

      await db.messages.put({
        ...data,
        isMe: false,
      });

      await db.threads.update(threadId, {
        updatedAt: Date.now(),
        lastMessageAt: Date.now(),
      });
    });

    return () => {
      unsubscribe();
    };
  }, [threadId]);

  const thread = useLiveQuery(() => db.threads.get(threadId), [threadId]);
  const messages = useLiveQuery(
    () => db.messages.where("threadId").equals(threadId).sortBy("createdAt"),
    [threadId],
    [] as Message[]
  );

  useEffect(() => {
    if (messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  const [text, setText] = useState("");

  // Avatar
  const profile = useLiveQuery(() => db.settings.get("user_avatar"));
  const avatarUrl = profile?.value as string | undefined;

  const subtitle = useMemo(() => thread?.subtitle || "", [thread?.subtitle]);

  async function send() {
    const body = text.trim();
    if (!body) return;

    const senderName = await getDisplayName(); // This is async now
    const senderId = getClientId();

    const message = {
      id: crypto.randomUUID(),
      threadId,
      senderId,
      senderName,
      body,
      createdAt: Date.now(),
    };

    // local-first write
    await db.messages.put({ ...message, isMe: true });

    await db.threads.update(threadId, {
      updatedAt: Date.now(),
      lastMessageAt: Date.now(),
    });

    // realtime publish
    await publish(channelName("chat", threadId), "message_created", message);

    setText("");
  }

  async function sendImage(base64: string) {
    const senderName = await getDisplayName();
    const senderId = getClientId();

    const message = {
      id: crypto.randomUUID(),
      threadId,
      senderId,
      senderName,
      body: "Sent an image",
      attachment: base64,
      createdAt: Date.now(),
    };

    await db.messages.put({ ...message, isMe: true });
    await db.threads.update(threadId, { updatedAt: Date.now(), lastMessageAt: Date.now() });
    await publish(channelName("chat", threadId), "message_created", message);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only images are supported for now.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      await sendImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
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
            <div key={m.id} className={`flex items-end gap-2 ${m.isMe ? "justify-end" : "justify-start"}`}>
              {!m.isMe && (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                  {m.senderName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div
                className={`max-w-[75%] space-y-1 rounded-2xl px-3 py-2 text-sm ${m.isMe ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"
                  }`}
              >
                {!m.isMe ? (
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">{m.senderName}:</div>
                ) : null}

                {m.attachment && (
                  <img src={m.attachment} alt="attachment" className="mb-1 max-h-48 rounded-lg object-cover" />
                )}

                <div>{m.body}</div>
              </div>

              {m.isMe && (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Me" className="h-full w-full object-cover" />
                  ) : (
                    "You"
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 border-t bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-muted/40"
            onClick={() => fileInputRef.current?.click()}
          >
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
