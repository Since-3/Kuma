import { Suspense } from "react";
import { requireAuthWithData } from "@/src/lib/auth/getUser";
import DashboardView from "@/src/modules/dashboard/ui/views/dashboard-view";
import DashboardLoading from "./loading";

export default async function DashboardPage() {
  const userData = await requireAuthWithData();

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardView userData={userData} />
    </Suspense>
  );
}
