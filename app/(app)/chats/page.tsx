import Link from "next/link";
import { redirect } from "next/navigation";
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
        {selections?.length === 0 && <p className="text-muted">Zatím nemáte žádný chat.</p>}
        {selections?.map((s) => (
          <Link key={s.id} href={`/chats/${s.id}`} className="rounded-2xl border border-muted/40 p-3">
            <p className="font-bold">{names.get((isDesigner ? s.briefs?.customer_id : s.designer_id) ?? "") ?? "Chat"}</p>
            <p className="line-clamp-1 break-words text-sm text-muted">{s.briefs?.description}</p>
          </Link>
        ))}
      </section>

      {isDesigner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Moje zájmy</h2>
          {liked?.length === 0 && <p className="text-muted">Zatím jste neprojevili zájem o žádnou zakázku.</p>}
          {liked?.map((l) => (
            <div key={l.brief_id} className="rounded-2xl border border-muted/40 p-3">
              <p className="font-bold">{l.briefs ? formatCzk(l.briefs.budget) : ""}</p>
              <p className="line-clamp-2 break-words text-sm">{l.briefs?.description}</p>
              <p className="text-sm font-semibold text-primary">
                {l.briefs?.status === "open" ? "Otevřená" : mine.has(l.brief_id) ? "Vybráno" : "Zakázka obsazena"}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
