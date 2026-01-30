"use client";

import { useEffect, useState } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "@/actions/push-notifications";
import { TopBarTitle } from "@/components/layout/top-bars";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, FolderDown } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function MorePage() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [msg, setMsg] = useState("Test alert from UnityGuard");

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;

    (async () => {
      await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

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

  function fakeExport() {
    alert("Next step: encrypted backup export/import (I’ll add this in the next step).");
  }

  function fakeImport() {
    alert("Next step: encrypted backup import (I’ll add this in the next step).");
  }

  return (
    <div>
      <TopBarTitle title="More" />

      <div className="mx-auto max-w-md space-y-3 px-4 py-4">
        <Card className="border-muted/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="font-semibold">Push Notifications</div>
          </div>

          {!supported ? (
            <div className="text-sm text-muted-foreground">
              Push isn’t supported on this browser/device.
            </div>
          ) : subscribed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">✅ Subscribed</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onUnsubscribe}>Unsubscribe</Button>
                <Button onClick={onSendTest}>Send Test Alert</Button>
              </div>
            </div>
          ) : (
            <Button onClick={onSubscribe}>Subscribe</Button>
          )}

          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message..." />
        </Card>

        <Card className="border-muted/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FolderDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-semibold">Backup & Restore</div>
              <div className="text-sm text-muted-foreground">Enable encrypted backups.</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={fakeExport}>Enable Backup</Button>
            <Button className="flex-1" onClick={fakeImport}>Import Data</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
