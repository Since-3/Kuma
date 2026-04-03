import { SidebarProvider } from "@/src/components/ui/sidebar";
import DashboardNavbar from "@/src/modules/dashboard/ui/components/DashboardNavbar";
import DashboardSidebarWrapper from "@/src/modules/dashboard/ui/components/DashboardSidebarWrapper";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <DashboardSidebarWrapper />
      <main className="flex flex-col h-screen w-full bg-muted px-4">
        <DashboardNavbar />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
