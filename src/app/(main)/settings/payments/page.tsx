import { requireManager } from "@/src/lib/auth/getUser";
import SettingsPaymentsView from "@/src/modules/settings/ui/views/settings-payments-view";

export default async function SettingsPaymentsPage() {
  await requireManager();
  return <SettingsPaymentsView />;
}
