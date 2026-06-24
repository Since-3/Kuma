import { Suspense } from "react";
import { requireAuthWithData } from "@/src/lib/auth/getUser";
import SettingsOverviewView from "@/src/modules/settings/ui/views/settings-overview-view";
import SettingsLoading from "./loading";

export default async function SettingsPage() {
  await requireAuthWithData();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsOverviewView />
    </Suspense>
  );
}
