import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/avatar";
import { ChatView } from "@/components/chat-view";
import { getCurrentUser, requireReadyDesigner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage({ params }: PageProps<"/chats/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "designer") await requireReadyDesigner();

  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();

  // RLS returns the selection only to its two parties, so anyone else gets "not found".
  const supabase = await createClient();
  const { data: selection } = await supabase
    .from("selections")
    .select("id, designer_id, briefs(customer_id)")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!selection) notFound();

  const otherId = user.role === "designer" ? selection.briefs?.customer_id : selection.designer_id;
  const [{ data: other }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", otherId ?? "").maybeSingle(),
    supabase.from("messages").select("*").eq("selection_id", selection.id).order("created_at"),
  ]);

  return (
    <main className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-3 px-4">
        <Link href="/chats" className="py-2 text-sm font-bold text-primary">← Chaty</Link>
        <Avatar name={other?.name ?? ""} className="size-9" />
        <h1 className="min-w-0 truncate text-xl font-bold">{other?.name ?? "Chat"}</h1>
      </div>
      <ChatView selectionId={selection.id} userId={user.id} initial={messages ?? []} />
    </main>
  );
}
