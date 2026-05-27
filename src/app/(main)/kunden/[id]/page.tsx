import { requireManager } from "@/src/lib/auth/getUser";
import { getKundeDetail } from "@/src/modules/kunden/actions/kunde-detail-actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import KundeDetailView from "@/src/modules/kunden/ui/views/kunde-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

const KundeDetailPage = async ({ params }: Props) => {
  await requireManager();
  const { id } = await params;

  const result = await getKundeDetail(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="p-2">
      <Link
        href="/kunden"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </Link>
      <KundeDetailView kunde={result.kunde} />
    </div>
  );
};

export default KundeDetailPage;
