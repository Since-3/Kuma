import { requireAuthWithData, isManager, isUser, isEmployee } from "@/src/lib/auth/getUser";
import SettingsMenuItem from "../components/SettingsMenuItem";
import {
  Bell,
  Building2,
  CreditCard,
  LucideIcon,
  Megaphone,
  PanelTop,
  Settings,
  TicketPercent,
  TicketX,
  User,
} from "lucide-react";

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
    icon: Building2,
    name: "Business Einsetllungen",
    href: "/settings/business",
    description: "Verwalte deine Business Daten",
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
  {
    icon: TicketX,
    name: "Stornierung",
    href: "/settings/cancellation",
    description: "Verwalte deine Stornierungsregeln",
  },
  {
    icon: TicketPercent,
    name: "Rabatt",
    href: "/settings/discounts",
    description: "Verwalte deine Rabattaktionen und Pakete",
  },
  {
    icon: Bell,
    name: "Benachrichtigungen",
    href: "/settings/notifications",
    description: "Verwalte deine Benachrichtigungseinstellungen",
  },
  {
    icon: Megaphone,
    name: "Branding",
    href: "/settings/branding",
    description: "Platziere dein Logo und nimm deine Farben",
  },
];

const SettingsOverviewView = async () => {
  const userData = await requireAuthWithData();

  if (isUser(userData) || isEmployee(userData)) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl flex gap-2 font-bold">
            <Settings /> Einstellungen
          </h1>
          <p className="text-sm text-gray-500 mt-1">Verwalte deine persönlichen Daten</p>
        </div>
        <div className="flex flex-col gap-4">
          <SettingsMenuItem
            name="Persönliche Einstellungen"
            description="Profilbild, Name, E-Mail, Passwort und mehr"
            icon={User}
            href="/settings/personal"
          />
        </div>
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
