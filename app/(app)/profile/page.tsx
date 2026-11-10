import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPortfolio } from "@/lib/portfolio-data";
import { PORTFOLIO_MAX, PORTFOLIO_MIN } from "@/lib/portfolio";
import { logOut } from "@/app/actions/auth";
import { Avatar } from "@/components/avatar";
import { secondaryButtonClass } from "@/components/field";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PortfolioUploader } from "@/components/portfolio-uploader";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("name, bio").eq("id", user.id).single();

  const items = user.role === "designer" ? await getPortfolio(supabase, user.id) : [];
  if (user.role === "designer" && items.length < PORTFOLIO_MIN) redirect("/onboarding");

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-4 rounded-2xl bg-primary/15 p-4">
        <Avatar name={profile?.name ?? ""} className="size-16 text-2xl" />
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold">{profile?.name || "Profil"}</h1>
          <p className="text-sm font-semibold text-muted">{user.role === "designer" ? "Designér" : "Zákazník"}</p>
        </div>
      </div>
      <ProfileForm name={profile?.name ?? ""} bio={profile?.bio ?? ""} />

      {user.role === "designer" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Portfolio ({items.length}/{PORTFOLIO_MAX})</h2>
          <PortfolioGrid items={items} editable />
          <PortfolioUploader userId={user.id} count={items.length} />
        </section>
      )}

      <form action={logOut}>
        <button className={`${secondaryButtonClass} w-full`}>Odhlásit se</button>
      </form>
    </main>
  );
}
