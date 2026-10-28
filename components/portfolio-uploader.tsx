"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioItem } from "@/app/actions/portfolio";
import { ImageError, uploadImage } from "@/lib/images";

export function PortfolioUploader({ userId }: { userId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    setBusy(true);
    setStatus(undefined);

    for (const file of files) {
      try {
        const result = await addPortfolioItem(await uploadImage("portfolio", userId, file));
        if (result.error) throw new ImageError(result.error);
      } catch (e) {
        console.error("portfolio upload failed", e);
        setStatus(e instanceof ImageError ? e.message : "Obrázek se nepodařilo nahrát. Zkuste to prosím znovu.");
        break;
      }
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="cursor-pointer rounded-full bg-primary px-6 py-3 text-center text-base font-bold text-background has-disabled:opacity-60">
        {busy ? "Nahrávám…" : "Přidat obrázky"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={onChange}
          className="sr-only"
        />
      </label>
      {status && <p role="alert" className="text-sm font-semibold text-accent">{status}</p>}
    </div>
  );
}
