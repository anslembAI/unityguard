import { BottomNav } from "./bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">Neighborhood Watch</div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">{children}</main>

      <BottomNav />
    </div>
  );
}
