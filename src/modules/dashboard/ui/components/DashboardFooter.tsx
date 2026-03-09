"use client";
import { HelpCircle, Settings, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { AuthUserData } from "@/src/lib/auth/getUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";

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

const getDiceBearUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

const AvatarImage = ({
  userData,
  displayName,
}: {
  userData: AuthUserData;
  displayName: string;
}) => {
  const pbSrc = "pbSrc" in userData ? userData.pbSrc : null;
  const src = pbSrc || getDiceBearUrl(displayName);

  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-100">
      <Image src={src} alt={displayName} fill className="object-cover" unoptimized />
    </div>
  );
};

interface DashboardFooterProps {
  displayName: string;
  userData: AuthUserData;
}

const DashboardFooter = ({ displayName, userData }: DashboardFooterProps) => {
  const isManager = userData.role === "manager";
  const businesses = isManager ? userData.businesses : [];
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    businesses.length > 0 ? businesses[0].id : ""
  );

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);

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

      {/* Business Dropdown - nur für Manager */}
      {isManager && businesses.length > 0 && (
        <div className="mt-2 mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <span className="text-xs text-gray-500">Business</span>
                <button className="w-full flex text-left items-center justify-between p-2 rounded-lg border border-blue hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium mt-1 truncate w-full">
                      {selectedBusiness?.name || "Business auswählen"}
                    </span>
                  </div>
                  <ChevronDown size={16} className="ml-2 shrink-0" />
                </button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
              {businesses.map((business) => (
                <DropdownMenuItem
                  key={business.id}
                  onSelect={() => setSelectedBusinessId(business.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{business.name}</span>
                    <span className="text-xs text-gray-500">{business.address}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <Link href="/business/add" className="block mt-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Plus size={16} />
                  <span className="mt-1">Standort hinzufügen</span>
                </Button>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* DisplayName + Avatar */}
      <div className="w-full flex items-center gap-4 p-2 mt-2">
        <AvatarImage userData={userData} displayName={displayName} />
        <p className="truncate text-sm font-medium">{displayName}</p>
      </div>
    </div>
  );
};

export default DashboardFooter;
