import { requireReadyDesigner } from "@/lib/auth";

export default async function SwipePage() {
  await requireReadyDesigner();
  return (
    <main className="px-4 py-4">
      <h1 className="text-2xl font-bold">Swipe</h1>
    </main>
  );
}
