import { NextResponse } from "next/server";
import Ably from "ably";

// Use runtime nodejs for Ably Rest client (incompat w/ edge rarely)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || `anon-${crypto.randomUUID()}`;

    if (!process.env.ABLY_API_KEY) {
        return NextResponse.json({ error: "Missing ABLY_API_KEY" }, { status: 500 });
    }

    const ably = new Ably.Rest(process.env.ABLY_API_KEY);

    const tokenRequest = await ably.auth.createTokenRequest({
        clientId,
        // Capability can be added later when you have real roles.
    });

    return NextResponse.json(tokenRequest);
}
