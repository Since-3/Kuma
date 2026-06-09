import { requireManager } from "@/src/lib/auth/getUser";
import SettingsBusinessPageView from "@/src/modules/settings/ui/views/settings-business-page-view";

export default async function SettingsBusinessPage() {
  await requireManager();
  return <SettingsBusinessPageView />;
}
