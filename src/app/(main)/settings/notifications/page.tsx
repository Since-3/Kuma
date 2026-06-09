import { requireManager } from "@/src/lib/auth/getUser";
import SettingsNotificationPageView from "@/src/modules/settings/ui/views/settings-notification-page-view";

export default async function SettingsNotificationPage() {
  await requireManager();
  return <SettingsNotificationPageView />;
}
