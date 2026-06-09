import { requireManager } from "@/src/lib/auth/getUser";
import SettingsBrandingPageView from "@/src/modules/settings/ui/views/settings-branding-page-view";

export default async function SettingsBrandingPage() {
  await requireManager();
  return <SettingsBrandingPageView />;
}
