"use server";

import { cookies } from "next/headers";
import { kv } from "@vercel/kv";

export async function sendSecurityCode(email: string) {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store expiration (5 mins)
    await kv.set(`otp:${email}`, code, { ex: 300 });

    console.log(`[MOCK EMAIL SERVICE] To: ${email} | Subject: Security Code | Body: Your code is ${code}`);

    return { success: true, message: "Code sent to " + email };
}

export async function verifyAndRegister(email: string, pass: string, code: string) {
    const stored = await kv.get<string>(`otp:${email}`);

    if (!stored || stored !== code) {
        return { success: false, message: "Invalid or expired security code." };
    }

    // Create User
    const id = crypto.randomUUID();
    const displayName = email.split("@")[0]; // distinct name
    const user = { id, email, pass, displayName };

    // Check if exists?
    const existing = await kv.get(`user:${email}`);
    if (existing) {
        return { success: false, message: "User already exists. Please login." };
    }

    await kv.set(`user:${email}`, user);
    await kv.del(`otp:${email}`);

    // Create session
    await createSession(email);

    return { success: true, user: { id: user.id, displayName: user.displayName } };
}

export async function login(email: string, pass: string) {
    const user = await kv.get<{ pass: string; id: string; displayName: string }>(`user:${email}`);

    if (!user || user.pass !== pass) {
        return { success: false, message: "Invalid credentials." };
    }

    await createSession(email);
    return { success: true, user: { id: user.id, displayName: user.displayName } };
}

export async function logout() {
    (await cookies()).delete("ug_session");
    // client should also clear localStorage profile if strictly needed, 
    // but for local-first we might want to keep history? 
    // For now just server logout.
}

async function createSession(email: string) {
    (await cookies()).set("ug_session", email, { httpOnly: true, path: "/" });
}
