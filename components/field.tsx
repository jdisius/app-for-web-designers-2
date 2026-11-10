export const inputClass =
  "rounded-2xl border border-muted/30 bg-surface px-4 py-3 text-base font-normal placeholder:text-muted";

export const labelClass = "flex flex-col gap-1.5 text-sm font-semibold";

export const buttonBase =
  "rounded-full px-6 py-3 text-center text-base font-bold transition active:scale-[0.98] disabled:opacity-60";
export const buttonClass = `${buttonBase} bg-primary text-background`;
export const secondaryButtonClass = `${buttonBase} bg-secondary text-foreground`;

export const pillClass = "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold";

export function Field({ label, name, type = "text", autoComplete }: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required className={inputClass} />
    </label>
  );
}
