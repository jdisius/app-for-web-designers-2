import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function SwipePage() {
  const user = await requireRole("designer");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Swipe</h1>
      <p>Ahoj, {user.name}.</p>
      <LogoutButton />
    </main>
  );
}
