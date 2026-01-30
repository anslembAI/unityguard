"use client";

import Link from "next/link";
import { Bell, ChevronLeft } from "lucide-react";
import { UnityGuardMark } from "@/components/ui/branding";

export function TopBarHome() {
    return (
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="text-white">
                        <UnityGuardMark className="h-7 w-7" />
                    </div>
                    <div className="leading-tight">
                        <div className="font-semibold tracking-tight">UnityGuard</div>
                        <div className="text-xs text-muted-foreground">Local Safety Network</div>
                    </div>
                </div>
                <button className="rounded-md p-2 text-muted-foreground hover:bg-muted/40">
                    <Bell className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}

export function TopBarTitle({ title }: { title: string }) {
    return (
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-md items-center justify-center px-4 py-3">
                <div className="font-semibold">{title}</div>
            </div>
        </header>
    );
}

export function TopBarChat({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
                <Link
                    href="/chats"
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted/40"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="leading-tight">
                    <div className="font-semibold">{title}</div>
                    {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
                </div>
            </div>
        </header>
    );
}
