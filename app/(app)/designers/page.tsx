import { requireRole } from "@/lib/auth";

export default async function DesignersPage() {
  await requireRole("customer");
  return (
    <main className="px-4 py-4">
      <h1 className="text-2xl font-bold">Designéři</h1>
    </main>
  );
}
