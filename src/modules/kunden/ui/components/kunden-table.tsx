"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { ArrowRight, User, Mail, Phone, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Kunde } from "../views/kunden-view";

const STATUS_STYLES: Record<Kunde["status"], string> = {
  Bezahlt: "bg-green-100 text-green-700",
  Storniert: "bg-red-100 text-red-600",
  Ausstehend: "bg-yellow-100 text-yellow-700",
};

interface KundenTableProps {
  kunden: Kunde[];
}

const KundenTable = ({ kunden }: KundenTableProps) => {
  const router = useRouter();

  return (
    <div className="rounded-xl overflow-hidden border border-white/40 bg-white/60 backdrop-blur-xl shadow-sm supports-backdrop-filter:bg-white/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-white/30 hover:bg-white/30 border-b-0">
            <TableHead className="font-semibold text-gray-700 pt-4 pb-3">
              <span className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                Name
              </span>
            </TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-gray-700 pt-4 pb-3">
              <span className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                E-Mail
              </span>
            </TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-gray-700 pt-4 pb-3">
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                Telefonnummer
              </span>
            </TableHead>
            <TableHead className="font-semibold text-gray-700 pt-4 pb-3">
              <span className="flex items-center gap-2">
                <Tag size={14} className="text-gray-400" />
                Status
              </span>
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
          {/* HR-Trennlinie zwischen Header und Daten */}
          <tr aria-hidden>
            <td colSpan={5} className="p-0">
              <hr className="border-none bg-linear-to-r from-transparent via-gray-300/70 to-transparent" />
            </td>
          </tr>
        </TableHeader>
        <TableBody>
          {kunden.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                Keine Kunden gefunden.
              </TableCell>
            </TableRow>
          ) : (
            kunden.map((kunde) => (
              <TableRow
                key={kunde.id}
                className="border-b border-white/30 transition-colors duration-150 hover:bg-white/70 cursor-pointer"
                onClick={() => router.push(`/kunden/${kunde.id}`)}
              >
                <TableCell className="font-medium">{kunde.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {kunde.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {kunde.telefon}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[kunde.status]}`}
                  >
                    {kunde.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/kunden/${kunde.id}`);
                    }}
                  >
                    <ArrowRight size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default KundenTable;
