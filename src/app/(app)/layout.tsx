import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh pb-16">
            <main className="mx-auto max-w-md">{children}</main>
            <BottomNav />
        </div>
    );
}
