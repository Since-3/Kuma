"use client";

import { useState } from "react";
import { BookOpen, History, ChevronDown, ChevronUp } from "lucide-react";
import type { UserBooking } from "../../actions/booking-actions";
import UserBookingCard from "../components/UserBookingCard";

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: number;
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

interface MeineKurseViewProps {
  bookings: UserBooking[];
}

const MeineKurseView = ({ bookings }: MeineKurseViewProps) => {
  const upcomingBookings = bookings.filter((b) => !b.isPast);
  const pastBookings = bookings.filter((b) => b.isPast);

  return (
    <div className="flex flex-col gap-5 w-full">
      <h1 className="text-4xl font-bold">Meine Kurse</h1>

      <CollapsibleSection
        icon={<BookOpen size={18} />}
        title="Bevorstehende Kurse"
        badge={upcomingBookings.length}
        defaultOpen={true}
      >
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Keine bevorstehenden Kursbuchungen.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-3">
            {upcomingBookings.map((b) => (
              <UserBookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </CollapsibleSection>

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
              <UserBookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default MeineKurseView;
