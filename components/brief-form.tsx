"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrief } from "@/app/actions/briefs";
import { buttonClass } from "@/components/field";
import { ImageError, uploadImage } from "@/lib/images";
import { briefSchema, todayPrague } from "@/lib/schemas/brief";

const inputClass = "rounded-2xl border border-muted/40 px-4 py-3 text-base font-normal";

export function BriefForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = data.get("photo");
    const fields = {
      imagePath: null as string | null,
      deadline: String(data.get("deadline")),
      budget: String(data.get("budget")),
      description: String(data.get("description")),
    };

    // Same schema as the server, so errors show before the photo is uploaded.
    const parsed = briefSchema.safeParse(fields);
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setBusy(true);
    setError(undefined);
    try {
      if (photo instanceof File && photo.size > 0) fields.imagePath = await uploadImage("briefs", userId, photo);
      const result = await createBrief(fields);
      if (result.error) throw new ImageError(result.error);
      form.reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof ImageError ? e.message : "Zakázku se nepodařilo uložit. Zkuste to prosím znovu.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Referenční fotka (nepovinná)
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Termín
        <input name="deadline" type="date" min={todayPrague()} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Rozpočet (Kč)
        <input name="budget" type="text" inputMode="decimal" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Krátký popis
        <textarea name="description" rows={4} maxLength={1000} className={inputClass} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-accent">{error}</p>}
      <button disabled={busy} className={buttonClass}>{busy ? "Ukládám…" : "Zadat zakázku"}</button>
    </form>
  );
}
