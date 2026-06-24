import { Suspense } from "react";
import SettingsPersonalPageView from "@/src/modules/settings/ui/views/settings-personal-page-view";
import SettingsLoading from "../loading";

export default function SettingsPersonalPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPersonalPageView />
    </Suspense>
  );
}
