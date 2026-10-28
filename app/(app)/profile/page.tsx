import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/actions/auth";
import { buttonClass } from "@/components/field";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("name, bio").eq("id", user.id).single();

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <h1 className="text-2xl font-bold">Profil</h1>
      <ProfileForm name={profile?.name ?? ""} bio={profile?.bio ?? ""} />
      <form action={logOut}>
        <button className={`${buttonClass} w-full bg-secondary`}>Odhlásit se</button>
      </form>
    </main>
  );
}
