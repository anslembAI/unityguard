"use client";

import { useEffect, useState } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "@/actions/push-notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function MorePage() {
  const [supported] = useState(
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  );
  const [subscribed, setSubscribed] = useState(false);
  const [msg, setMsg] = useState("Test alert from Neighborhood Watch");

  useEffect(() => {
    if (!supported) return;

    (async () => {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, [supported]);

  async function onSubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    await subscribeUser(JSON.parse(JSON.stringify(sub)));
    setSubscribed(true);
  }

  async function onUnsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
    await unsubscribeUser();
    setSubscribed(false);
  }

  async function onSendTest() {
    await sendNotification(msg);
    setMsg("");
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-3">
        <div className="font-medium">Push Notifications (Test)</div>
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            Push isn&apos;t supported in this browser/device.
          </p>
        ) : subscribed ? (
          <>
            <p className="text-sm text-muted-foreground">You&apos;re subscribed.</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onUnsubscribe}>Unsubscribe</Button>
              <Button onClick={onSendTest}>Send Test</Button>
            </div>
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message..." />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Not subscribed yet.</p>
            <Button onClick={onSubscribe}>Subscribe</Button>
          </>
        )}
      </Card>

      <Card className="p-4">
        <div className="font-medium">Backup (next)</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Next we&apos;ll add &quot;Enable encrypted backup&quot; + export/import.
        </p>
      </Card>
    </div>
  );
}
