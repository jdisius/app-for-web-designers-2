"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth";

const TABS: Record<Role, { href: string; label: string }[]> = {
  designer: [
    { href: "/swipe", label: "Swipe" },
    { href: "/chats", label: "Chaty" },
  ],
  customer: [
    { href: "/briefs/new", label: "+ Nová zakázka" },
    { href: "/designers", label: "Designéři" },
    { href: "/chats", label: "Chaty" },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-muted/30 bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {TABS[role].map((tab) => (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              aria-current={pathname.startsWith(tab.href) ? "page" : undefined}
              className="block px-2 py-4 text-center text-sm font-bold text-muted aria-[current=page]:text-primary"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
