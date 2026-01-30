"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendSecurityCode, verifyAndRegister } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveProfile } from "@/lib/profile";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<"details" | "otp">("details");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSendCode(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await sendSecurityCode(email);
            if (res.success) {
                setStep("otp");
                alert("Check your server console for the security code!");
            } else {
                alert(res.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await verifyAndRegister(email, pass, code);
            if (res.success && res.user) {
                saveProfile(res.user);
                router.push("/alerts"); // Redirect to home/alerts
            } else {
                alert(res.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{step === "details" ? "Sign Up" : "Verify Email"}</CardTitle>
                <CardDescription>
                    {step === "details"
                        ? "Create your account to get started."
                        : `Enter the code sent to ${email}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === "details" ? (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                minLength={8}
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Continue"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="underline">
                                Sign in
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Security Code</Label>
                            <Input
                                id="code"
                                placeholder="123456"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Verifying..." : "Create Account"}
                        </Button>
                        <div className="text-center text-sm">
                            <button
                                type="button"
                                className="text-muted-foreground underline"
                                onClick={() => setStep("details")}
                            >
                                Back
                            </button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
