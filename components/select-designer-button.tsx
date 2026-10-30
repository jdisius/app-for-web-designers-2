"use client";

import { useState, useTransition } from "react";
import { selectDesigner } from "@/app/actions/selections";
import { buttonClass } from "@/components/field";

export function SelectDesignerButton({ briefId, designerId }: { briefId: string; designerId: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            // On success the action redirects, so it only returns when there is an error.
            setError((await selectDesigner(briefId, designerId)).error);
          })
        }
        className={buttonClass}
      >
        {pending ? "Vybírám…" : "Vybrat"}
      </button>
      {error && <p role="alert" className="text-sm font-semibold text-accent">{error}</p>}
    </div>
  );
}
