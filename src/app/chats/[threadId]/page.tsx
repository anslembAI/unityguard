"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MoreHorizontal } from "lucide-react";
import { db, type Thread, type Message } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  const router = useRouter();
  const { threadId } = params;
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadThread = useCallback(async () => {
    try {
      const loadedThread = await db.threads.get(threadId);
      setThread(loadedThread || null);
    } catch (error) {
      console.error("Failed to load thread:", error);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const loadMessages = useCallback(async () => {
    try {
      const allMessages = await db.messages.where("threadId").equals(threadId).toArray();
      setMessages(allMessages.sort((a, b) => a.createdAt - b.createdAt));
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, [threadId]);

  useEffect(() => {
    loadThread();
    loadMessages();
  }, [loadThread, loadMessages]);

  async function sendMessage() {
    if (!newMessage.trim() || !thread) return;

    try {
      const message: Message = {
        id: crypto.randomUUID(),
        threadId: thread.id,
        senderId: "user",
        content: newMessage.trim(),
        createdAt: Date.now(),
      };

      await db.messages.add(message);

      const updatedThread: Partial<Thread> = {
        lastMessageAt: message.createdAt,
        lastMessagePreview: message.content.substring(0, 50),
        updatedAt: Date.now(),
      };

      await db.threads.update(thread.id, updatedThread);

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  function formatTime(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center border-b bg-background p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chats")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold">Chat not found</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">This chat doesn&apos;t exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center border-b bg-background p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/chats")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">{thread.title}</h2>
          <p className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] px-4 py-2 ${
                  message.senderId === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`mt-1 text-xs ${
                    message.senderId === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </Card>
            </div>
          ))
        )}
      </div>

      <div className="border-t bg-background p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
