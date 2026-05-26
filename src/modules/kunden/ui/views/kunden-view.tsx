"use client";

import { useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";
import KundenTable from "../components/kunden-table";
import type { KundeRow } from "../../actions/kunden-actions";

export type Kunde = KundeRow;

interface KundenViewProps {
  initialKunden: KundeRow[];
}

const KundenView = ({ initialKunden }: KundenViewProps) => {
  const [search, setSearch] = useState("");

  const filtered = initialKunden.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.email.toLowerCase().includes(search.toLowerCase()) ||
      k.telefon.includes(search)
  );

  return (
    <div className="p-2">
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold">Kunden</h1>
        <div className="relative w-full sm:w-60">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Suchen"
            className="pl-9 bg-white/60 backdrop-blur-xl border-white/40 supports-backdrop-filter:bg-white/50 placeholder:text-gray-400 focus-visible:ring-white/40 focus-visible:bg-white/80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <KundenTable kunden={filtered} />
    </div>
  );
};

export default KundenView;
