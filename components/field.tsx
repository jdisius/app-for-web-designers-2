export function Field({ label, name, type = "text", autoComplete }: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="rounded-full border border-muted/40 px-4 py-3 text-base font-normal"
      />
    </label>
  );
}

export const buttonClass =
  "rounded-full bg-primary px-6 py-3 text-center text-base font-bold text-background disabled:opacity-60";
