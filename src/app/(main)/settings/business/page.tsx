import { Suspense } from "react";
import SettingsBusinessPageView from "@/src/modules/settings/ui/views/settings-business-page-view";
import SettingsLoading from "../loading";

export default function SettingsBusinessPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsBusinessPageView />
    </Suspense>
  );
}
