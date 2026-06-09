import { requireManager } from "@/src/lib/auth/getUser";
import SettingsDiscountsPageView from "@/src/modules/settings/ui/views/settings-discounts-page-view";

export default async function SettingsDiscountPage() {
  await requireManager();
  return <SettingsDiscountsPageView />;
}
