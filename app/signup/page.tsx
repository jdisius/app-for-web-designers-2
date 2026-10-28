import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { roleSchema } from "@/lib/schemas/auth";
import { SignUpForm } from "@/components/auth-forms";

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  const role = roleSchema.safeParse((await searchParams).role);
  if (!role.success) redirect("/");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Registrace</h1>
      <SignUpForm role={role.data} />
    </main>
  );
}
