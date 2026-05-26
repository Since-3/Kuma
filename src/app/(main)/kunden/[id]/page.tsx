import { requireManager } from "@/src/lib/auth/getUser";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const KundeDetailPage = async ({ params }: Props) => {
  await requireManager();
  const { id } = await params;

  return (
    <div className="p-2">
      <Link
        href="/kunden"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </Link>
      <h1 className="text-4xl font-bold mb-2">Kundendetails</h1>
      <p className="text-muted-foreground text-sm">Kunde ID: {id}</p>
    </div>
  );
};

export default KundeDetailPage;
