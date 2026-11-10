import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

// Shell for every page after login. Each page still checks the user itself; a layout is not a guard.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <>
      <header className="bg-surface">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-2">
          <div className="rounded-lg border-2 border-dashed border-muted px-3 py-1 text-sm font-bold text-muted">LOGO</div>
          <Link href="/profile" aria-label="Profil" className="rounded-full p-2 text-foreground">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">{children}</div>
      <BottomNav role={user.role} />
    </>
  );
}
