"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/field";
import { PORTFOLIO_MAX, PORTFOLIO_MIN } from "@/lib/portfolio";

// shortcut: the ownership confirmation is enforced in the UI only; the data model has no column for it.
export function OnboardingContinue({ count }: { count: number }) {
  const [confirmed, setConfirmed] = useState(false);
  const ready = confirmed && count >= PORTFOLIO_MIN;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Nahráno: {count} z {PORTFOLIO_MAX} (potřebujete alespoň {PORTFOLIO_MIN}).
      </p>
      <label className="flex items-start gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 size-5 shrink-0"
        />
        Potvrzuji, že jde o moje vlastní dílo
      </label>
      {ready ? (
        <Link href="/swipe" className={buttonClass}>Pokračovat</Link>
      ) : (
        <button type="button" disabled className={buttonClass}>Pokračovat</button>
      )}
    </div>
  );
}
