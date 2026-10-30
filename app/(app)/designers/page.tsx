import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatCzk, formatDate } from "@/lib/format";
import { signedUrls } from "@/lib/signed-urls";
import { thumbPathOf } from "@/lib/storage-paths";
import { createClient } from "@/lib/supabase/server";

export default async function DesignersPage() {
  const user = await requireRole("customer");
  const supabase = await createClient();

  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, deadline, budget, description")
    .eq("customer_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  const briefIds = (briefs ?? []).map((b) => b.id);

  // RLS lets a customer read only liked swipes on their own briefs; the liked filter just makes that explicit.
  const { data: likes } = briefIds.length
    ? await supabase.from("swipes").select("brief_id, designer_id").in("brief_id", briefIds).eq("liked", true)
    : { data: [] };
  const designerIds = [...new Set((likes ?? []).map((l) => l.designer_id))];

  const [{ data: profiles }, { data: images }] = designerIds.length
    ? await Promise.all([
        supabase.from("profiles").select("id, name, bio").in("id", designerIds),
        supabase.from("portfolio_items").select("designer_id, image_url").in("designer_id", designerIds).order("created_at"),
      ])
    : [{ data: [] }, { data: [] }];

  const thumbs = new Map<string, string[]>();
  for (const img of images ?? []) {
    const list = thumbs.get(img.designer_id) ?? [];
    if (list.length < 3) thumbs.set(img.designer_id, [...list, thumbPathOf(img.image_url)]);
  }
  const urls = await signedUrls(supabase, "portfolio", [...thumbs.values()].flat());
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <h1 className="text-2xl font-bold">Designéři</h1>
      {briefs?.length === 0 && <p className="text-muted">Nemáte žádnou otevřenou zakázku.</p>}

      {briefs?.map((brief) => {
        const designers = (likes ?? []).filter((l) => l.brief_id === brief.id).flatMap((l) => byId.get(l.designer_id) ?? []);
        return (
          <section key={brief.id} className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold">{formatCzk(brief.budget)} · do {formatDate(brief.deadline)}</h2>
              <p className="line-clamp-2 break-words text-sm text-muted">{brief.description}</p>
            </div>
            {designers.length === 0 && <p className="text-sm text-muted">Zatím se nikdo nepřihlásil.</p>}
            {designers.map((d) => (
              <Link
                key={d.id}
                href={`/designers/${d.id}?brief=${brief.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-muted/40 p-3"
              >
                <p className="font-bold">{d.name}</p>
                {d.bio && <p className="line-clamp-2 break-words text-sm">{d.bio}</p>}
                <div className="grid grid-cols-3 gap-2">
                  {(thumbs.get(d.id) ?? []).map((path) => (
                    // eslint-disable-next-line @next/next/no-img-element -- signed Storage URLs, already resized in the browser
                    <img key={path} src={urls.get(path)} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  ))}
                </div>
              </Link>
            ))}
          </section>
        );
      })}
    </main>
  );
}
