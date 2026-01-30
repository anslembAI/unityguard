import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function setupWebPush() {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;

    if (!pub || !priv) throw new Error("Missing VAPID keys in env");

    webpush.setVapidDetails("mailto:admin@unityguard.app", pub, priv);
}

export async function POST(req: Request) {
    setupWebPush();

    const { title, body, url } = await req.json();

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
                        title: title || "UnityGuard",
                        body: body || "",
                        url: url || "/alerts",
                        icon: "/icon.png",
                        badge: "/badge.png",
                    })
                );
                sent++;
            } catch (e: any) {
                const code = e?.statusCode;
                if (code === 404 || code === 410) {
                    await kv.hdel("push:subs", endpoint);
                    removed++;
                }
            }
        })
    );

    return NextResponse.json({ ok: true, sent, removed, total: subs.length });
}
