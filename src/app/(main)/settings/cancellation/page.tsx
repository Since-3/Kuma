import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import SettingsCancellationPageView from "@/src/modules/settings/ui/views/settings-cancellation-page-view";
import SettingsLoading from "../loading";

export default async function SettingsCancellationPage() {
  await requireManager();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsCancellationPageView />
    </Suspense>
  );
}
