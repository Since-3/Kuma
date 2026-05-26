"use client";

import { useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";
import KundenTable from "../components/kunden-table";

const DUMMY_KUNDEN = [
  {
    id: "1",
    name: "Stern Thireau",
    email: "sthireau0@prilog.org",
    telefon: "+49 160 14256244",
    status: "Teilgenommen" as const,
  },
  {
    id: "2",
    name: "Ford Mckibbin",
    email: "fmckibbin1@slate.com",
    telefon: "+49 160 84256328",
    status: "Storniert" as const,
  },
  {
    id: "3",
    name: "Foss Roglieri",
    email: "froglieri2@xing.com",
    telefon: "+49 160 78745913",
    status: "Teilgenommen" as const,
  },
  {
    id: "4",
    name: "Maurits Elgey",
    email: "melgey3@blogger.com",
    telefon: "+49 160 55834625",
    status: "Teilgenommen" as const,
  },
  {
    id: "5",
    name: "Gun Kaasmann",
    email: "gkaasmann4@economist.com",
    telefon: "+49 160 32679584",
    status: "Teilgenommen" as const,
  },
  {
    id: "6",
    name: "Edmund McCrae",
    email: "emccrae5@woothemes.com",
    telefon: "+49 160 69321457",
    status: "Bezahlt" as const,
  },
  {
    id: "7",
    name: "Samuel Totman",
    email: "stotman6@wisc.edu",
    telefon: "+49 160 96851428",
    status: "Teilgenommen" as const,
  },
  {
    id: "8",
    name: "Patsy Cuardall",
    email: "pcuardall70@barnesandnoble.com",
    telefon: "+49 160 38591426",
    status: "Bezahlt" as const,
  },
  {
    id: "9",
    name: "Barnaby Carl",
    email: "bcarl8@alexa.com",
    telefon: "+49 160 77958426",
    status: "Storniert" as const,
  },
  {
    id: "10",
    name: "Lena Bergmann",
    email: "lbergmann9@spiegel.de",
    telefon: "+49 160 12345678",
    status: "Bezahlt" as const,
  },
];

export type Kunde = (typeof DUMMY_KUNDEN)[number];

const KundenView = () => {
  const [search, setSearch] = useState("");

  const filtered = DUMMY_KUNDEN.filter(
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
