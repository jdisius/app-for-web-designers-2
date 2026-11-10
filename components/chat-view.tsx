"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage } from "@/app/actions/messages";
import { buttonClass } from "@/components/field";
import { mergeMessages } from "@/lib/chat";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Message = Tables<"messages">;

export function ChatView({ selectionId, userId, initial }: { selectionId: string; userId: string; initial: Message[] }) {
  const [messages, setMessages] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${selectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `selection_id=eq.${selectionId}` },
        (payload) => setMessages((current) => mergeMessages(current, [payload.new as Message])),
      )
      .subscribe(async (status) => {
        // Events missed while disconnected are not replayed, so load everything after every (re)subscribe.
        if (status !== "SUBSCRIBED") return;
        const { data } = await supabase.from("messages").select("*").eq("selection_id", selectionId).order("created_at");
        if (data) setMessages((current) => mergeMessages(current, data));
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectionId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    const result = await sendMessage(selectionId, text);
    if ("error" in result) {
      setError(result.error);
    } else {
      setMessages((current) => mergeMessages(current, [result.message]));
      setText("");
    }
    setPending(false);
  }

  return (
    <>
      <ul className="flex flex-col gap-2 px-4 pb-32">
        {messages.length === 0 && <li className="text-center text-muted">Zatím tu nejsou žádné zprávy.</li>}
        {messages.map((m) => (
          <li
            key={m.id}
            className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 ${
              m.sender_id === userId ? "self-end rounded-br-md bg-primary text-background" : "self-start rounded-bl-md bg-surface"
            }`}
          >
            {m.body}
          </li>
        ))}
        <div ref={end} />
      </ul>

      <form
        onSubmit={onSubmit}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-muted/20 bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-md flex-col gap-1 px-4 py-3">
          {error && <p role="alert" className="text-sm font-semibold text-accent">{error}</p>}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              aria-label="Zpráva"
              placeholder="Napište zprávu…"
              className="min-w-0 flex-1 rounded-full border border-muted/30 bg-background px-4 py-3 text-base placeholder:text-muted"
            />
            <button disabled={pending} className={buttonClass}>Odeslat</button>
          </div>
        </div>
      </form>
    </>
  );
}
