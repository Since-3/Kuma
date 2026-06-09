import { requireManager } from "@/src/lib/auth/getUser";
import SettingsCancellationPageView from "@/src/modules/settings/ui/views/settings-cancellation-page-view";

export default async function SettingsCancellationPage() {
  await requireManager();
  return <SettingsCancellationPageView />;
}
