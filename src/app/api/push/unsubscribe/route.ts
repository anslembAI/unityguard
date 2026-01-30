import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { endpoint } = await req.json();

    if (!endpoint) {
        return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
    }

    await kv.hdel("push:subs", endpoint);
    return NextResponse.json({ ok: true });
}
