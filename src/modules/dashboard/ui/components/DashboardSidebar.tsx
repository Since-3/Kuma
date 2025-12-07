"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import {
  ChartNoAxesCombined,
  CreditCard,
  DoorOpen,
  Dumbbell,
  IdCardLanyard,
  LayoutDashboard,
  MapPinned,
  User,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/src/public/logo-dark.png";
import { cn } from "@/src/lib/utils";
import DashboardFooter from "./DashboardFooter";
import type { AuthUserData } from "@/src/lib/auth/getUser";

const allMenuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    roles: ["manager", "user"],
  },
  {
    icon: Dumbbell,
    label: "Meine Kurse",
    href: "/courses/myCourses",
    roles: ["user"],
  },
  {
    icon: Dumbbell,
    label: "Kurse",
    href: "/courses",
    roles: ["manager"],
  },
  {
    icon: IdCardLanyard,
    label: "Trainer",
    href: "/trainer",
    roles: ["manager"],
  },
  {
    icon: User,
    label: "Kunden",
    href: "/kunden",
    roles: ["manager"],
  },
  {
    icon: CreditCard,
    label: "Zahlungen",
    href: "/zahlungen",
    roles: ["manager"],
  },
  {
    icon: DoorOpen,
    label: "Räume",
    href: "/raume",
    roles: ["manager"],
  },
  {
    icon: ChartNoAxesCombined,
    label: "Marketing",
    href: "/marketing",
    roles: ["manager"],
  },
  {
    icon: MapPinned,
    label: "Standorte",
    href: "/standorte",
    roles: ["manager"],
  },
];

interface DashboardSidebarProps {
  userData: AuthUserData;
  displayName: string;
}

const DashboardSidebar = ({ userData, displayName }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const userRole = userData.role;

  // Filter menu items based on user role
  const menu = allMenuItems.filter((item) => item.roles.includes(userRole));

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href="/" className="flex justify-center items-center gap-2 px-2 pt-2">
          <Image src={Logo} height={65} alt="Cloud_Clipboard" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-10">
              {menu.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                      pathname === item.href && "bg-linear-to-r/oklch border-[#5D6B68]/10 "
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-3 w-full">
                      <item.icon className={cn(pathname === item.href && "text-blue")} />
                      <span
                        className={`${pathname === item.href && "text-blue font-semibold"} text-lg font-medium tracking-tight mt-1.5`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DashboardFooter displayName={displayName} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
