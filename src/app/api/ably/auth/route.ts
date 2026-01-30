import { NextResponse } from "next/server";
import Ably from "ably";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    if (!process.env.ABLY_API_KEY) {
        return NextResponse.json(
            { error: "Missing ABLY_API_KEY environment variable" },
            { status: 500 }
        );
    }

    const client = new Ably.Rest(process.env.ABLY_API_KEY);
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
        return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    try {
        const tokenRequestData = await client.auth.createTokenRequest({ clientId });
        return NextResponse.json(tokenRequestData);
    } catch (err) {
        console.error("Error creating token request:", err);
        return NextResponse.json(
            { error: "Error creating token request" },
            { status: 500 }
        );
    }
}
