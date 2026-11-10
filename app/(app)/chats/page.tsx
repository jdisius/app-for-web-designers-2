import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { pillClass } from "@/components/field";
import { getCurrentUser, requireReadyDesigner } from "@/lib/auth";
import { formatCzk } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "designer") await requireReadyDesigner();
  const isDesigner = user.role === "designer";

  const supabase = await createClient();
  // RLS returns only the selections this user is a party of.
  const { data: selections } = await supabase
    .from("selections")
    .select("id, brief_id, designer_id, briefs(customer_id, description, budget)")
    .order("created_at", { ascending: false });

  const otherIds = (selections ?? []).flatMap((s) => (isDesigner ? s.briefs?.customer_id : s.designer_id) ?? []);
  const { data: people } = otherIds.length
    ? await supabase.from("profiles").select("id, name").in("id", otherIds)
    : { data: [] };
  const names = new Map((people ?? []).map((p) => [p.id, p.name]));

  // "Moje zájmy": every brief this designer liked. Taken briefs that were not given to them show "Zakázka obsazena".
  const { data: liked } = isDesigner
    ? await supabase
        .from("swipes")
        .select("brief_id, briefs(description, budget, status)")
        .eq("designer_id", user.id)
        .eq("liked", true)
        .order("created_at", { ascending: false })
    : { data: [] };
  const mine = new Set((selections ?? []).map((s) => s.brief_id));

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <h1 className="text-2xl font-bold">Chaty</h1>

      <section className="flex flex-col gap-3">
        {selections?.length === 0 && <EmptyState>Zatím nemáte žádný chat.</EmptyState>}
        {selections?.map((s) => {
          const name = names.get((isDesigner ? s.briefs?.customer_id : s.designer_id) ?? "") ?? "Chat";
          return (
            <Link key={s.id} href={`/chats/${s.id}`} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{name}</p>
                <p className="line-clamp-1 break-words text-sm text-muted">{s.briefs?.description}</p>
              </div>
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          );
        })}
      </section>

      {isDesigner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Moje zájmy</h2>
          {liked?.length === 0 && <p className="text-muted">Zatím jste neprojevili zájem o žádnou zakázku.</p>}
          {liked?.map((l) => (
            <div key={l.brief_id} className="flex flex-col items-start gap-1 rounded-2xl bg-surface p-4">
              <p className="font-bold">{l.briefs ? formatCzk(l.briefs.budget) : ""}</p>
              <p className="line-clamp-2 break-words text-sm text-muted">{l.briefs?.description}</p>
              {l.briefs?.status === "open" ? (
                <span className={`${pillClass} bg-primary/15 text-primary`}>Otevřená</span>
              ) : mine.has(l.brief_id) ? (
                <span className={`${pillClass} bg-accent/15 text-accent`}>Vybráno</span>
              ) : (
                <span className={`${pillClass} bg-secondary text-muted`}>Zakázka obsazena</span>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
