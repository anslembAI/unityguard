"use server";

import webpush from "web-push";
import { kv } from "@vercel/kv";

webpush.setVapidDetails(
  "mailto:admin@unityguard.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function subscribeUser(sub: PushSubscription) {
  if (!sub?.endpoint) return { success: false, error: "Missing endpoint" };
  await kv.hset("push:subs", { [sub.endpoint]: JSON.stringify(sub) });
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  if (!endpoint) return { success: false, error: "Missing endpoint" };
  await kv.hdel("push:subs", endpoint);
  return { success: true };
}

export async function sendNotification(message: string) {
  const all = (await kv.hgetall<Record<string, string>>("push:subs")) || {};
  const subs = Object.entries(all).map(([endpoint, json]) => ({ endpoint, json }));

  let sent = 0;
  let removed = 0;

  await Promise.allSettled(
    subs.map(async ({ endpoint, json }) => {
      try {
        const sub = JSON.parse(json);
        await webpush.sendNotification(
          sub,
          JSON.stringify({
            title: "UnityGuard",
            body: message,
            icon: "/icon.png",
            url: "/alerts",
          })
        );
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await kv.hdel("push:subs", endpoint);
          removed++;
        }
      }
    })
  );

  return { success: true, sent, removed };
}
