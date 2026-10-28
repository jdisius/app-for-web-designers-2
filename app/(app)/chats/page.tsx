import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return (
    <main className="px-4 py-4">
      <h1 className="text-2xl font-bold">Chaty</h1>
    </main>
  );
}
