import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const sub = await req.json();

    if (!sub?.endpoint) {
        return NextResponse.json({ ok: false, error: "Invalid subscription" }, { status: 400 });
    }

    await kv.hset("push:subs", { [sub.endpoint]: JSON.stringify(sub) });
    return NextResponse.json({ ok: true });
}
