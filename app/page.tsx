import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { buttonClass } from "@/components/field";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-8">
      <Link href="/signup?role=designer" className={`${buttonClass} py-5 text-lg`}>Jsem designér</Link>
      <Link href="/signup?role=customer" className={`${buttonClass} py-5 text-lg`}>Jsem zákazník</Link>
      <Link href="/login" className="text-center text-sm font-semibold underline">Už mám účet</Link>
    </main>
  );
}
