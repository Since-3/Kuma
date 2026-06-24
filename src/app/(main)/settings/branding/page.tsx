import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import SettingsBrandingPageView from "@/src/modules/settings/ui/views/settings-branding-page-view";
import SettingsLoading from "../loading";

export default async function SettingsBrandingPage() {
  await requireManager();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsBrandingPageView />
    </Suspense>
  );
}
