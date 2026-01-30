"use server";

import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Type definition for PushSubscription (Web Push API)
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Demo-only: single subscription in memory.
// In production, store subscriptions per user in a server DB.
let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub;
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) throw new Error("No subscription available");

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: "Neighborhood Watch",
      body: message,
      icon: "/icon.png",
      url: "/alerts",
    })
  );

  return { success: true };
}
