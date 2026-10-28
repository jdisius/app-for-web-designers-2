import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPortfolio } from "@/lib/portfolio-data";
import { PORTFOLIO_MAX, PORTFOLIO_MIN } from "@/lib/portfolio";
import { OnboardingContinue } from "@/components/onboarding-continue";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PortfolioUploader } from "@/components/portfolio-uploader";

export default async function OnboardingPage() {
  const user = await requireRole("designer");
  const items = await getPortfolio(await createClient(), user.id);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Vaše portfolio</h1>
        <p className="mt-1 text-sm text-muted">
          Nahrajte {PORTFOLIO_MIN} až {PORTFOLIO_MAX} ukázek své práce.
        </p>
      </div>
      <PortfolioGrid items={items} editable />
      <PortfolioUploader userId={user.id} count={items.length} />
      <OnboardingContinue count={items.length} />
    </main>
  );
}
