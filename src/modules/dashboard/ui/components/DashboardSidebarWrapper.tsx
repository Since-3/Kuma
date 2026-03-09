import { requireAuthWithData, isManager, isEmployee } from "@/src/lib/auth/getUser";
import DashboardSidebar from "./DashboardSidebar";

const DashboardSidebarWrapper = async () => {
  const userData = await requireAuthWithData();
  const displayName = isManager(userData)
    ? `${userData.firstName} ${userData.lastName}`
    : isEmployee(userData)
      ? `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim() || userData.email
      : userData.name || userData.email;

  return <DashboardSidebar userData={userData} displayName={displayName} />;
};

export default DashboardSidebarWrapper;
