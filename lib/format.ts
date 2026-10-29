const czk = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const day = new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", dateStyle: "medium" });

export const formatCzk = (amount: number) => czk.format(amount);

// Postgres dates are "YYYY-MM-DD"; noon UTC lands on the same day in Prague.
export const formatDate = (date: string) => day.format(new Date(`${date}T12:00:00Z`));
