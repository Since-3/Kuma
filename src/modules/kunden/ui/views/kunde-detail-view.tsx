"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Phone,
  Mail,
  User,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  BookOpen,
  History,
  CreditCard,
  Bell,
  Scale,
  CheckCircle2,
} from "lucide-react";
import type { KundeDetail } from "../../actions/kunde-detail-actions";
import KundeBookingCard from "../components/kunde-booking-card";

// ─── DiceBear Fallback ────────────────────────────────────────────────────────
// Nur anonymisierten Seed senden – keine internen IDs an Drittanbieter
const getDiceBearUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(`u-${seed.slice(0, 6)}`)}`;

// ─── ID kürzen: erste 8 Zeichen + … ──────────────────────────────────────────
const shortenId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`;

// ─── Kollapsible Sektion ──────────────────────────────────────────────────────
interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: number | string;
}

const CollapsibleSection = ({
  icon,
  title,
  defaultOpen = true,
  children,
  badge,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl shadow-sm overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-blue">{icon}</span>
          <span className="font-semibold text-gray-800 text-base">{title}</span>
          {badge !== undefined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue/10 text-blue">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-white/40">{children}</div>}
    </div>
  );
};

// ─── Info-Zeile in der ID-Karte ───────────────────────────────────────────────
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 text-blue shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
      <p className="font-medium text-gray-800 text-sm truncate">{value}</p>
    </div>
  </div>
);

// ─── Haupt-View ───────────────────────────────────────────────────────────────
interface KundeDetailViewProps {
  kunde: KundeDetail;
}

const KundeDetailView = ({ kunde }: KundeDetailViewProps) => {
  const avatarSrc = kunde.pbSrc ?? getDiceBearUrl(kunde.id);

  const upcomingBookings = kunde.bookings.filter((b) => !b.isPast);
  const pastBookings = kunde.bookings.filter((b) => b.isPast);

  const genderLabel: Record<string, string> = {
    male: "Männlich",
    female: "Weiblich",
    diverse: "Divers",
  };

  const birthdayFormatted = kunde.birthday
    ? new Date(kunde.birthday).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "–";

  const memberSinceFormatted = kunde.createdAt
    ? new Date(kunde.createdAt).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "–";

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Kundenname */}
      <h1 className="text-4xl font-bold">{kunde.name}</h1>

      {/* ── Glassmorphism ID-Karte ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/60 shadow-lg w-full">
        {/* weißes Glas-Hintergrundpanel */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl" />
        {/* subtiler weißer Glanz-Schein oben */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/80" />

        <div className="relative p-6 flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar – größer */}
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white/80 shadow-lg shrink-0 bg-white/50">
            <Image src={avatarSrc} alt={kunde.name} fill className="object-cover" unoptimized />
          </div>

          {/* Info-Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow icon={<Phone size={15} />} label="Telefon" value={kunde.telefon} />
            <InfoRow icon={<Mail size={15} />} label="E-Mail" value={kunde.email} />
            <InfoRow
              icon={<User size={15} />}
              label="Geschlecht"
              value={kunde.gender ? (genderLabel[kunde.gender] ?? kunde.gender) : "–"}
            />
            <InfoRow icon={<Calendar size={15} />} label="Geburtsdatum" value={birthdayFormatted} />
            {/* Kunden-ID über volle Breite */}
            <div className="sm:col-span-2 flex items-start gap-2.5">
              <span className="mt-0.5 text-blue shrink-0">
                <Hash size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none mb-0.5">Kunden-ID</p>
                <p
                  className="font-mono text-sm text-gray-700 truncate cursor-default"
                  title={kunde.id}
                >
                  {shortenId(kunde.id)}
                </p>
              </div>
            </div>
          </div>

          {/* Mitglied-seit Chip – oben rechts auf Desktop */}
          <div className="sm:absolute sm:top-4 sm:right-5 shrink-0">
            <span className="text-xs text-gray-500 bg-white/70 border border-white/60 px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
              Mitglied seit {memberSinceFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* ── Gebuchte Kurse (zukünftig) ── */}
      <CollapsibleSection
        icon={<BookOpen size={18} />}
        title="Gebuchte Kurse"
        badge={upcomingBookings.length}
        defaultOpen={true}
      >
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Keine bevorstehenden Kursbuchungen.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-3">
            {upcomingBookings.map((b) => (
              <KundeBookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ── Vergangene Kurse ── */}
      <CollapsibleSection
        icon={<History size={18} />}
        title="Vergangene Kurse"
        badge={pastBookings.length}
        defaultOpen={false}
      >
        {pastBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Keine vergangenen Kursbuchungen.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-3">
            {pastBookings.map((b) => (
              <KundeBookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ── Abonnements & Credits (Dummy) ── */}
      <CollapsibleSection
        icon={<CreditCard size={18} />}
        title="Abonnements & Credits"
        defaultOpen={false}
      >
        <div className="pt-3 flex flex-col gap-2.5">
          {[
            { label: "Aktive Abonnements", value: "1 Abo" },
            { label: "Übrige Buchungen", value: "4" },
            { label: "Credits", value: "0" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl bg-white/60 border border-white/50 px-4 py-3"
            >
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className="font-semibold text-gray-900 text-sm">{row.value}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── Benachrichtigungen (Dummy) ── */}
      <CollapsibleSection icon={<Bell size={18} />} title="Benachrichtigungen" defaultOpen={false}>
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { label: "Newsletter", value: "Nein" },
            { label: "Marketing", value: "Nein" },
            { label: "Buchungsbestätigung", value: "Ja" },
            { label: "Warteliste", value: "Ja" },
            { label: "Erinnerungen", value: "Ja" },
            { label: "Kursbeginn", value: "Ja" },
            { label: "Kursänderungen", value: "Ja" },
            { label: "Abonnements-News", value: "Nein" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-white/60 border border-white/50 px-4 py-3"
            >
              <span className="text-sm text-gray-600">{item.label}</span>
              <span
                className={`text-sm font-semibold ${
                  item.value === "Ja" ? "text-green-600" : "text-red-500"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── Rechtliches (Dummy) ── */}
      <CollapsibleSection icon={<Scale size={18} />} title="Rechtliches" defaultOpen={false}>
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* AGB */}
          <div className="rounded-xl bg-white/60 border border-white/50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 text-sm">AGB</p>
                <p className="text-xs text-gray-500 mt-0.5">Zustimmung: Ja</p>
                <p className="text-xs text-gray-400 mt-0.5">Datum: 14.01.2025</p>
                <p className="text-xs text-gray-400">Uhrzeit: 19:51</p>
                <p className="text-xs text-gray-400 font-mono mt-1">Version 1.0.0</p>
              </div>
            </div>
          </div>

          {/* Datenschutzerklärung */}
          <div className="rounded-xl bg-white/60 border border-white/50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 text-sm">Datenschutzerklärung</p>
                <p className="text-xs text-gray-500 mt-0.5">Zustimmung: Ja</p>
                <p className="text-xs text-gray-400 mt-0.5">Datum: 14.01.2025</p>
                <p className="text-xs text-gray-400">Uhrzeit: 19:51</p>
                <button className="text-xs text-blue underline mt-2 hover:opacity-70 transition-opacity">
                  Datenschutzerklärung ansehen
                </button>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default KundeDetailView;
