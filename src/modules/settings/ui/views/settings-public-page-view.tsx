import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuthWithData, isManager } from "@/src/lib/auth/getUser";
import { prisma } from "@/src/lib/prisma";
import BusinessPublicToggle from "../components/BusinessPublicToggle";

const SettingsPublicPageView = async () => {
  const userData = await requireAuthWithData();

  if (!isManager(userData)) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Öffentliche Seite</h1>
        <p className="text-gray-500 text-sm">Keine Berechtigung.</p>
      </div>
    );
  }

  const businesses = await prisma.business.findMany({
    where: { managerId: userData.id },
    select: { id: true, name: true, isPublic: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <ChevronLeft size={15} className="mb-1" />
          Einstellungen
        </Link>
        <h1 className="text-2xl font-bold">Öffentliche Seite</h1>
        <p className="text-sm text-gray-500 mt-1">
          Steuere welche Kursseiten öffentlich sichtbar sind
        </p>
      </div>

      {businesses.length === 0 ? (
        <p className="text-gray-400 text-sm">Noch kein Business angelegt.</p>
      ) : (
        <div className="space-y-3">
          {businesses.map((business) => (
            <BusinessPublicToggle
              key={business.id}
              businessId={business.id}
              businessName={business.name}
              initialIsPublic={business.isPublic}
              initialSlug={business.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsPublicPageView;
