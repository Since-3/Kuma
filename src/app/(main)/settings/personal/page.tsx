import { Suspense } from "react";
import { requireAuthWithData } from "@/src/lib/auth/getUser";
import SettingsPersonalPageView from "@/src/modules/settings/ui/views/settings-personal-page-view";
import SettingsLoading from "../loading";

export default async function SettingsPersonalPage() {
  await requireAuthWithData();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPersonalPageView />
    </Suspense>
  );
}
