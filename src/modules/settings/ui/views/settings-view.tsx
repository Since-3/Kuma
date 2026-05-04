import { requireAuthWithData, isManager } from "@/src/lib/auth/getUser";
import { prisma } from "@/src/lib/prisma";
import BusinessPublicToggle from "../components/BusinessPublicToggle";

const SettingsView = async () => {
  const userData = await requireAuthWithData();

  if (!isManager(userData)) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Einstellungen</h1>
        <p className="text-gray-500">Keine weiteren Einstellungen verfügbar.</p>
      </div>
    );
  }

  const businesses = await prisma.business.findMany({
    where: { managerId: userData.id },
    select: { id: true, name: true, isPublic: true, slug: true },
    orderBy: { name: "asc" },
  });

  // If manager has exactly one business, auto-assign any unassigned courses to it
  if (businesses.length === 1) {
    await prisma.course.updateMany({
      where: { createdBy: userData.id, businessId: null },
      data: { businessId: businesses[0].id },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-gray-500 mt-1">Verwalte die öffentlichen Seiten deiner Businesses</p>
      </div>

      {businesses.length === 0 ? (
        <p className="text-gray-400">Noch kein Business angelegt.</p>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Öffentliche Seiten</h2>
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

export default SettingsView;
