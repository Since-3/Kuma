import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import SettingsBusinessPageView from "@/src/modules/settings/ui/views/settings-business-page-view";
import SettingsLoading from "../loading";

export default async function SettingsBusinessPage() {
  await requireManager();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsBusinessPageView />
    </Suspense>
  );
}
