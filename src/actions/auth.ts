"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Mock database for users (in-memory, resets on restart)
// persistent storage would need a real DB (Postgres/SQLite)
const OTP_STORE = new Map<string, string>(); // email -> code
const USER_Store = new Map<string, { email: string; pass: string }>();

export async function sendSecurityCode(email: string) {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store it (expiration not implemented for simplicity)
    OTP_STORE.set(email, code);

    // SIMULATE SENDING EMAIL
    console.log(`[MOCK EMAIL SERVICE] To: ${email} | Subject: Security Code | Body: Your code is ${code}`);

    return { success: true, message: "Code sent to " + email };
}

export async function verifyAndRegister(email: string, pass: string, code: string) {
    const stored = OTP_STORE.get(email);
    if (!stored || stored !== code) {
        return { success: false, message: "Invalid or expired security code." };
    }

    // "Create User"
    USER_Store.set(email, { email, pass });
    OTP_STORE.delete(email);

    // Create session (cookie)
    await createSession(email);

    return { success: true };
}

export async function login(email: string, pass: string) {
    // In a real app, hash passwords!
    // For this mock, we assume implicit success if we just registered, 
    // OR we accept ANY login for demo purposes since the In-Memory DB is empty on start.

    // Checking mock store:
    const user = USER_Store.get(email);
    if (user) {
        if (user.pass !== pass) {
            return { success: false, message: "Invalid credentials." };
        }
    } else {
        // Fallback for "Demo Mode": allow login if it looks valid, 
        // or return error. Let's return error to force registration flow first for better UX demo.
        // However, since in-memory wipes on restart, this is annoying.
        // Let's just allow it for "demo" user or fail.
        // Better: Fail. Guide user to Register.
        return { success: false, message: "User not found. Please sign up." };
    }

    await createSession(email);
    return { success: true };
}

export async function logout() {
    (await cookies()).delete("ug_session");
    redirect("/login");
}

async function createSession(email: string) {
    // In real app, sign a JWT
    (await cookies()).set("ug_session", email, { httpOnly: true, path: "/" });
}
