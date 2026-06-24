import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import SettingsPublicPageView from "@/src/modules/settings/ui/views/settings-public-page-view";
import SettingsLoading from "../loading";

export default async function SettingsPublicPage() {
  await requireManager();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPublicPageView />
    </Suspense>
  );
}
