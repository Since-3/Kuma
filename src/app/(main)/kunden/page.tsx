import { requireManager } from "@/src/lib/auth/getUser";
import { getKunden } from "@/src/modules/kunden/actions/kunden-actions";
import KundenView from "@/src/modules/kunden/ui/views/kunden-view";

const KundenPage = async () => {
  await requireManager();
  const result = await getKunden();
  if (!result.success) {
    throw new Error(result.error);
  }

  return <KundenView initialKunden={result.kunden} />;
};

export default KundenPage;
