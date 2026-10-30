"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioItem } from "@/app/actions/portfolio";
import { ImageError, uploadImage } from "@/lib/images";
import { PORTFOLIO_MAX } from "@/lib/portfolio";

export function PortfolioUploader({ userId, count }: { userId: string; count: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);
  const full = count >= PORTFOLIO_MAX;

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    setBusy(true);
    setStatus(undefined);

    const room = PORTFOLIO_MAX - count;
    if (files.length > room) setStatus(`Portfolio může mít nejvýše ${PORTFOLIO_MAX} obrázků.`);

    for (const file of files.slice(0, room)) {
      try {
        const result = await addPortfolioItem(await uploadImage("portfolio", userId, file));
        if (result.error) throw new ImageError(result.error);
      } catch (e) {
        setStatus(e instanceof ImageError ? e.message : "Obrázek se nepodařilo nahrát. Zkuste to prosím znovu.");
        break;
      }
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`rounded-full bg-primary px-6 py-3 text-center text-base font-bold text-background ${
          busy || full ? "opacity-60" : "cursor-pointer"
        }`}
      >
        {busy ? "Nahrávám…" : full ? `Maximum ${PORTFOLIO_MAX} obrázků` : "Přidat obrázky"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || full}
          onChange={onChange}
          className="sr-only"
        />
      </label>
      {status && <p role="alert" className="text-sm font-semibold text-accent">{status}</p>}
    </div>
  );
}
