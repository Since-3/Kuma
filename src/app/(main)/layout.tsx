import { SidebarProvider } from "@/src/components/ui/sidebar";
import DashboardNavbar from "@/src/modules/dashboard/ui/components/DashboardNavbar";
import DashboardSidebarWrapper from "@/src/modules/dashboard/ui/components/DashboardSidebarWrapper";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      {/* Mesh-Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-[oklch(0.97_0_0)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_-10%_-10%,oklch(0.82_0.06_240/_0.5)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_110%_110%,oklch(0.88_0.09_85/_0.45)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_120%,oklch(0.84_0.05_260/_0.3)_0%,transparent_60%)]" />
      </div>
      <DashboardSidebarWrapper />
      <main className="flex flex-col h-screen w-full px-4">
        <DashboardNavbar />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
