"use client";

import { Button } from "@/src/components/ui/button";
import { useSidebar } from "@/src/components/ui/sidebar";
import { PanelLeftCloseIcon, PanelLeftIcon } from "lucide-react";
import { usePathname } from "next/navigation";

const menuTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/courses": "Kurs Übersicht",
  "/courses/create": "Erstelle einen Kurs",
  "/courses/edit": "Bearbeite den Kurs",
  "/rooms": "Räume",
  "/rooms/create": "Erstelle einen Raum",
  "/rooms/edit": "Bearbeite den Raum",
};

const dynamicRoutes: Array<{
  prefix: string;
  titleKey: string;
}> = [
  {
    prefix: "/courses/edit",
    titleKey: "/courses/edit",
  },
  {
    prefix: "/rooms/edit",
    titleKey: "/rooms/edit",
  },
];

const getPageTitle = (pathname: string) => {
  if (menuTitles[pathname]) {
    return menuTitles[pathname];
  }

  for (const route of dynamicRoutes) {
    if (pathname.startsWith(route.prefix)) {
      return menuTitles[route.titleKey];
    }
  }

  // Fallback
  return "Dashboard";
};

const DashboardNavbar = () => {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();

  const pageTitle = getPageTitle(pathname);

  return (
    <div>
      <div className="flex gap-x-4 items-center py-4 bg-muted">
        <Button className="size-9 cursor-pointer" variant="outline" onClick={toggleSidebar}>
          {state === "collapsed" || isMobile ? (
            <PanelLeftIcon className="size-4" />
          ) : (
            <PanelLeftCloseIcon className="size-4" />
          )}
        </Button>

        <div className="w-px h-6 bg-border" />

        <h1 className="text-xl font-semibold mt-1">{pageTitle}</h1>
      </div>
      <hr className="mb-8" />
    </div>
  );
};

export default DashboardNavbar;
