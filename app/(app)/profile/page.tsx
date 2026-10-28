import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/signed-urls";
import { thumbPathOf } from "@/lib/storage-paths";
import { logOut } from "@/app/actions/auth";
import { buttonClass } from "@/components/field";
import { ProfileForm } from "@/components/profile-form";
import { PortfolioUploader } from "@/components/portfolio-uploader";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("name, bio").eq("id", user.id).single();

  const { data: items } =
    user.role === "designer"
      ? await supabase.from("portfolio_items").select("id, image_url").eq("designer_id", user.id).order("created_at")
      : { data: [] };
  const thumbs = await signedUrls(supabase, "portfolio", (items ?? []).map((item) => thumbPathOf(item.image_url)));

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <h1 className="text-2xl font-bold">Profil</h1>
      <ProfileForm name={profile?.name ?? ""} bio={profile?.bio ?? ""} />

      {user.role === "designer" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Portfolio</h2>
          <div className="grid grid-cols-3 gap-2">
            {(items ?? []).map((item) => (
              // eslint-disable-next-line @next/next/no-img-element -- signed Storage URLs, already resized in the browser
              <img
                key={item.id}
                src={thumbs.get(thumbPathOf(item.image_url))}
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
          <PortfolioUploader />
        </section>
      )}

      <form action={logOut}>
        <button className={`${buttonClass} w-full bg-secondary`}>Odhlásit se</button>
      </form>
    </main>
  );
}
