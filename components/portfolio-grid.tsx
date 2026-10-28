"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePortfolioItem } from "@/app/actions/portfolio";
import { buttonClass } from "@/components/field";

type Item = { id: string; thumbUrl?: string; fullUrl?: string };

// Thumbnail grid; tapping an image opens a larger view. `editable` adds a delete button there.
export function PortfolioGrid({ items, editable = false }: { items: Item[]; editable?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<Item>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(undefined);
    setError(undefined);
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deletePortfolioItem(id);
      if (result.error) return setError(result.error);
      close();
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <button key={item.id} type="button" aria-label="Zobrazit obrázek" onClick={() => setOpen(item)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URLs, already resized in the browser */}
            <img src={item.thumbUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
          </button>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-secondary/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL */}
          <img src={open.fullUrl} alt="" className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          {error && <p role="alert" className="rounded-lg bg-background px-3 py-2 text-sm font-semibold text-accent">{error}</p>}
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={close} className={buttonClass}>Zavřít</button>
            {editable && (
              <button type="button" disabled={pending} onClick={() => remove(open.id)} className={`${buttonClass} bg-accent`}>
                Smazat
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
