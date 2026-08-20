import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import { FavoritesSection } from "@/components/home-sections";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis favoritos" };

export default async function FavoritesPage() {
  const { categories, resources } = await getPublicView();
  return (
    <SiteShell data={{ categories, resources }}>
      <div className="pt-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Inicio
        </Link>
      </div>
      <div className="pb-4">
        <FavoritesSection resources={resources} />
      </div>
    </SiteShell>
  );
}
