"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { buttonClass, inputClass, labelClass } from "@/components/field";

export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={labelClass}>
        Jméno
        <input name="name" defaultValue={name} required className={inputClass} />
      </label>
      <label className={labelClass}>
        O mně
        <textarea name="bio" defaultValue={bio} rows={4} maxLength={500} className={inputClass} />
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-accent">{state.error}</p>}
      {state?.saved && <p role="status" className="text-sm font-semibold text-primary">Uloženo.</p>}
      <button disabled={pending} className={buttonClass}>Uložit</button>
    </form>
  );
}
