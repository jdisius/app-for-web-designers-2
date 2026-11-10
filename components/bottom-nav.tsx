"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth";

const ICONS = {
  cards: <><rect x="8" y="4" width="12" height="16" rx="2" /><path d="M4 7v10" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.5 2.4 3.5 5.2" />
    </>
  ),
};

const TABS: Record<Role, { href: string; label: string; icon: keyof typeof ICONS }[]> = {
  designer: [
    { href: "/swipe", label: "Zakázky", icon: "cards" },
    { href: "/chats", label: "Chaty", icon: "chat" },
  ],
  customer: [
    { href: "/briefs/new", label: "Nová zakázka", icon: "plus" },
    { href: "/designers", label: "Designéři", icon: "people" },
    { href: "/chats", label: "Chaty", icon: "chat" },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-muted/20 bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {TABS[role].map((tab) => (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              aria-current={pathname.startsWith(tab.href) ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-bold text-muted aria-[current=page]:text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICONS[tab.icon]}
              </svg>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
