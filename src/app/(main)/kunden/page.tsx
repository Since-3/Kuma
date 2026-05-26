import { requireManager } from "@/src/lib/auth/getUser";
import { getKunden } from "@/src/modules/kunden/actions/kunden-actions";
import KundenView from "@/src/modules/kunden/ui/views/kunden-view";

const KundenPage = async () => {
  await requireManager();
  const result = await getKunden();
  const kunden = result.success ? result.kunden : [];

  return <KundenView initialKunden={kunden} />;
};

export default KundenPage;
