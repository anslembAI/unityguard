"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageCircle, MoreHorizontal } from "lucide-react";

const tabs = [
  { href: "/alerts", label: "Alerts", Icon: Bell },
  { href: "/chats", label: "Chats", Icon: MessageCircle },
  { href: "/more", label: "More", Icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t bg-background">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-full flex-col items-center gap-1 rounded-md py-2 text-xs ${
                active ? "font-semibold" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
