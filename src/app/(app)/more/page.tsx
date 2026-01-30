"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "@/actions/push-notifications";
import { TopBarTitle } from "@/components/layout/top-bars";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, FolderDown, Upload } from "lucide-react";
import { buildSnapshot, restoreSnapshot, type BackupSnapshot } from "@/lib/backup-logic";
import { decryptJson, encryptJson } from "@/lib/crypto-backup";
import { saveAs } from "file-saver";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";

export default function MorePage() {
  // Push
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [msg, setMsg] = useState("Test alert from UnityGuard");

  // Profile
  const profile = useLiveQuery(() => db.settings.get("user_avatar"));
  const avatarUrl = profile?.value as string | undefined;

  // Backup
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("merge");
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (sub?.endpoint) {
      await unsubscribeUser(sub.endpoint);
    }
    setSubscribed(false);
  }

  async function onSendTest() {
    await sendNotification(msg);
    setMsg("");
  }

  async function exportBackup() {
    if (pass.length < 12) {
      alert("Use a passphrase of at least 12 characters.");
      return;
    }
    setBusy(true);
    try {
      const snap = await buildSnapshot();
      const blob = await encryptJson(pass, snap);
      const date = new Date().toISOString().slice(0, 10);
      saveAs(blob, `unityguard-backup-${date}.ugbackup.json`);
      alert("Backup exported.");
    } catch (e: unknown) {
      alert((e as Error)?.message || "Backup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(file: File) {
    if (!pass) {
      alert("Enter your backup passphrase first.");
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const snap = await decryptJson<BackupSnapshot>(pass, text);
      await restoreSnapshot(snap, restoreMode);
      alert(`Restore complete (${restoreMode}).`);
      window.location.href = "/alerts";
    } catch (e: unknown) {
      alert((e as Error)?.message || "Restore failed. Wrong passphrase or corrupted file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <TopBarTitle title="More" />

      <div className="mx-auto max-w-md space-y-3 px-4 py-4">
        {/* Account Card */}
        <Card className="border-muted/60 bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatar-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) return;

                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    const base64 = ev.target?.result as string;
                    await db.settings.put({ key: "user_avatar", value: base64 });
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-background shadow-sm bg-muted flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-2xl text-muted-foreground">👤</div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
                  <Upload className="h-3 w-3" />
                </div>
              </label>
            </div>

            <div className="flex-1 space-y-1">
              <div className="font-semibold leading-none">My Account</div>
              <div className="text-sm text-muted-foreground">Manage your profile</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="secondary" className="flex-1">
              <a href="/login">Sign In</a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/register">Sign Up</a>
            </Button>
          </div>
        </Card>

        {/* Moderator Card */}
        <Card className="border-muted/60 bg-muted/20 p-4 space-y-2">
          <div className="font-semibold">Moderator</div>
          <div className="text-sm text-muted-foreground">Review community reports.</div>
          <Button asChild>
            <a href="/mod-queue">Open Mod Queue</a>
          </Button>
        </Card>

        <Card className="border-muted/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="font-semibold">Push Notifications</div>
          </div>

          {!supported ? (
            <div className="text-sm text-muted-foreground">Push isn’t supported on this device.</div>
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
              <div className="text-sm text-muted-foreground">Encrypted export/import (local-first).</div>
            </div>
          </div>

          <Input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Backup passphrase (12+ chars)"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button disabled={busy} variant="secondary" onClick={exportBackup}>
              Export Backup
            </Button>

            <Button
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Restore mode:</span>
            <select
              className="h-8 rounded-md border bg-background px-2 text-xs"
              value={restoreMode}
              onChange={(e) => setRestoreMode(e.target.value as "merge" | "replace")}
            >
              <option value="merge">Merge</option>
              <option value="replace">Replace</option>
            </select>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBackup(f);
              e.currentTarget.value = "";
            }}
          />

          <p className="text-xs text-muted-foreground">
            If you lose your passphrase, backups cannot be recovered.
          </p>
        </Card>
      </div>
    </div>
  );
}
