import { requireManager } from "@/src/lib/auth/getUser";
import KundenView from "@/src/modules/kunden/ui/views/kunden-view";

const KundenPage = async () => {
  await requireManager();
  return <KundenView />;
};

export default KundenPage;
