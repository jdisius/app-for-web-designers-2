import { requireRole } from "@/lib/auth";

export default async function NewBriefPage() {
  await requireRole("customer");
  return (
    <main className="px-4 py-4">
      <h1 className="text-2xl font-bold">Nová zakázka</h1>
    </main>
  );
}
