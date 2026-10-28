"use client";

import { useActionState } from "react";
import { logIn, signUp } from "@/app/actions/auth";
import { Field, buttonClass } from "@/components/field";
import type { Role } from "@/lib/auth";

export function SignUpForm({ role }: { role: Role }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />
      <Field label="Jméno" name="name" autoComplete="name" />
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Heslo" name="password" type="password" autoComplete="new-password" />
      <Field label="Heslo znovu" name="passwordRepeat" type="password" autoComplete="new-password" />
      {state?.error && <p role="alert" className="text-sm font-semibold text-accent">{state.error}</p>}
      <button disabled={pending} className={buttonClass}>Vytvořit účet</button>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(logIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Heslo" name="password" type="password" autoComplete="current-password" />
      {state?.error && <p role="alert" className="text-sm font-semibold text-accent">{state.error}</p>}
      <button disabled={pending} className={buttonClass}>Přihlásit se</button>
    </form>
  );
}
