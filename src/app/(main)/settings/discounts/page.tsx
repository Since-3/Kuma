import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import SettingsDiscountsPageView from "@/src/modules/settings/ui/views/settings-discounts-page-view";
import SettingsLoading from "../loading";

export default async function SettingsDiscountPage() {
  await requireManager();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsDiscountsPageView />
    </Suspense>
  );
}
