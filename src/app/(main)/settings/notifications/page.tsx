import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import SettingsNotificationPageView from "@/src/modules/settings/ui/views/settings-notification-page-view";
import SettingsLoading from "../loading";

export default async function SettingsNotificationPage() {
  await requireManager();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsNotificationPageView />
    </Suspense>
  );
}
