import { requireAuthWithData, isManager } from "@/src/lib/auth/getUser";
import SettingsMenuItem from "../components/SettingsMenuItem";
import { CreditCard, LucideIcon, PanelTop, Settings, User } from "lucide-react";

type SettingsMenuItem = {
  icon: LucideIcon;
  name: string;
  href: string;
  description?: string;
};

const settingsMenuTitles: SettingsMenuItem[] = [
  {
    icon: User,
    name: "Persöhnliche Einstellungen",
    href: "/settings/personal",
    description: "Verwalte deine persöhnlichen Daten",
  },
  {
    icon: PanelTop,
    name: "Öffentliche Seite",
    href: "/settings/public-page",
    description: "Verwalte deine öffentliche Kursseite",
  },
  {
    icon: CreditCard,
    name: "Zahlungen",
    href: "/settings/payments",
    description: "Verbinde dein Stripe-Konto um Zahlungen zu empfangen",
  },
];

const SettingsOverviewView = async () => {
  const userData = await requireAuthWithData();

  if (!isManager(userData)) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Einstellungen</h1>
        <p className="text-gray-500 text-sm">Keine weiteren Einstellungen verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl flex gap-2 font-bold">
          <Settings /> Allgemeine Einstellungen
        </h1>
        <p className="text-sm text-gray-500 mt-1">Verwalte deine App-Einstellungen</p>
      </div>
      <div className="flex flex-col gap-4">
        {settingsMenuTitles.map((item) => (
          <SettingsMenuItem
            key={item.href}
            name={item.name}
            description={item.description}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsOverviewView;
