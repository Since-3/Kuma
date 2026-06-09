import { requireManager } from "@/src/lib/auth/getUser";
import SettingsPublicPageView from "@/src/modules/settings/ui/views/settings-public-page-view";

export default async function SettingsPublicPage() {
  await requireManager();
  return <SettingsPublicPageView />;
}
