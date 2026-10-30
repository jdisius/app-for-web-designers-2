import { notFound } from "next/navigation";
import { z } from "zod";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { SelectDesignerButton } from "@/components/select-designer-button";
import { requireRole } from "@/lib/auth";
import { getPortfolio } from "@/lib/portfolio-data";
import { createClient } from "@/lib/supabase/server";

export default async function DesignerProfilePage({ params, searchParams }: PageProps<"/designers/[id]">) {
  await requireRole("customer");
  const { id } = await params;
  const { brief } = await searchParams;
  const ids = z.object({ id: z.uuid(), brief: z.uuid().optional() }).safeParse({ id, brief });
  if (!ids.success) notFound();

  const supabase = await createClient();
  const { data: designer } = await supabase
    .from("profiles")
    .select("name, bio")
    .eq("id", ids.data.id)
    .eq("role", "designer")
    .single();
  if (!designer) notFound();

  // RLS limits briefs to the customer's own, so a foreign or missing brief simply yields no button.
  const { data: openBrief } = ids.data.brief
    ? await supabase.from("briefs").select("id").eq("id", ids.data.brief).eq("status", "open").maybeSingle()
    : { data: null };
  const items = await getPortfolio(supabase, ids.data.id);

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <h1 className="text-2xl font-bold">{designer.name}</h1>
      {designer.bio && <p className="whitespace-pre-line break-words">{designer.bio}</p>}
      <PortfolioGrid items={items} />
      {openBrief && <SelectDesignerButton briefId={openBrief.id} designerId={ids.data.id} />}
    </main>
  );
}
