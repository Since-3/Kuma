"use client";
import { HelpCircle, Settings } from "lucide-react";
import Link from "next/link";

const footerMenu = [
  {
    icon: Settings,
    label: "Einstellungen",
    href: "/settings",
  },
  {
    icon: HelpCircle,
    label: "Hilfe",
    href: "/help",
  },
];

interface DashboardFooterProps {
  displayName: string;
}

const DashboardFooter = ({ displayName }: DashboardFooterProps) => {
  return (
    <div>
      {footerMenu.map((item) => (
        <div key={item.href}>
          <Link href={item.href} className="flex items-center gap-3 w-full">
            <item.icon size={18} />
            <span className="text-md font-medium tracking-tight mt-1">{item.label}</span>
          </Link>
        </div>
      ))}
      <div className="w-full flex items-center gap-4 p-2 mt-4">
        <div className="w-10 h-10 bg-black rounded-full" />
        <p>{displayName}</p>
      </div>
    </div>
  );
};

export default DashboardFooter;
