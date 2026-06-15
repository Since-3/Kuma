import { requireManager } from "@/src/lib/auth/getUser";
import { prisma } from "@/src/lib/prisma";
import BusinessSettingsForm from "../components/BusinessSettingsForm";

const SettingsBusinessPageView = async () => {
  const manager = await requireManager();

  const business = await prisma.business.findFirst({
    where: { managerId: manager.id },
    select: {
      id: true,
      name: true,
      address: true,
      email: true,
      title: true,
      ustId: true,
      banking: true,
    },
  });

  if (!business) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Business Einstellungen</h1>
          <p className="text-sm text-gray-500 mt-1">Kein Business gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">Verwalte die Daten deines Unternehmens</p>
      </div>
      <BusinessSettingsForm
        businessId={business.id}
        name={business.name}
        address={business.address}
        email={business.email}
        title={business.title}
        ustId={business.ustId}
        banking={business.banking}
        managerTel={manager.tel}
      />
    </div>
  );
};

export default SettingsBusinessPageView;
