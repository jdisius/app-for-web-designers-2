import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { buttonClass } from "@/components/field";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-8">
      <div className="self-start rounded-lg border-2 border-dashed border-muted px-3 py-1 text-sm font-bold text-muted">LOGO</div>
      <h1 className="text-4xl font-bold tracking-tight">
        Designéři a zakázky <span className="text-primary">na jedno přejetí</span>
      </h1>
      <p className="mb-4 text-muted">Zadejte zakázku, nebo si vybírejte ty, které vás baví.</p>
      <Link href="/signup?role=designer" className={`${buttonClass} py-5 text-lg`}>Jsem designér</Link>
      <Link href="/signup?role=customer" className={`${buttonClass} py-5 text-lg`}>Jsem zákazník</Link>
      <Link href="/login" className="py-3 text-center text-sm font-semibold underline">Už mám účet</Link>
    </main>
  );
}
