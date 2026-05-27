"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";
import type { KundeBooking } from "../../actions/kunde-detail-actions";
import AbstractTooltip from "@/src/components/layout/AbstractTooltip";
import { BookingDialog } from "@/src/modules/courses/ui/components/PublicCourseCard";
import type { PublicCourse } from "@/src/modules/courses/ui/components/PublicCourseCard";

// Nur anonymisierten Seed senden – keine internen IDs an Drittanbieter
const getDiceBearUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(`t-${seed.slice(0, 6)}`)}`;

const PAYMENT_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Bezahlt", bg: "bg-green-100", text: "text-green-700" },
  pending: { label: "Ausstehend", bg: "bg-yellow-100", text: "text-yellow-700" },
  refunded: { label: "Storniert", bg: "bg-red-100", text: "text-red-600" },
  failed: { label: "Fehlgeschlagen", bg: "bg-red-100", text: "text-red-600" },
};

/** KundeBooking → PublicCourse für den BookingDialog */
function toPublicCourse(b: KundeBooking): PublicCourse {
  return {
    id: b.courseId,
    name: b.courseName,
    sport: [],
    level: b.level,
    date: new Date(b.date),
    timeFrom: b.timeFrom,
    timeTo: b.timeTo,
    maxParticipants: b.maxParticipants,
    price: b.price,
    currentParticipants: b.currentParticipants,
    description: b.description,
    roomName: b.roomName,
    coverImage: b.coverImage ?? undefined,
    trainerProfiles: b.trainerProfiles,
  };
}

interface KundeBookingCardProps {
  booking: KundeBooking;
}

const KundeBookingCard = ({ booking }: KundeBookingCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const status = PAYMENT_STATUS[booking.paymentStatus] ?? PAYMENT_STATUS.pending;

  const dateFormatted = new Date(booking.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="text-left w-full bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-white/85 transition-all cursor-pointer flex flex-col gap-3 select-none"
      >
        {/* Trainer Avatare + Uhrzeit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {booking.trainers.length > 0 ? (
              booking.trainers.map((tid, idx) => {
                const info = booking.trainersMap[tid];
                const name = info?.label ?? "Trainer";
                const src = info?.pbSrc ?? getDiceBearUrl(tid);
                return (
                  <AbstractTooltip key={tid} tooltipText={name}>
                    <div
                      className={`relative w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100 ${
                        idx !== 0 ? "-ml-2" : ""
                      }`}
                      style={{ zIndex: booking.trainers.length - idx }}
                    >
                      <Image src={src} alt={name} fill className="object-cover" unoptimized />
                    </div>
                  </AbstractTooltip>
                );
              })
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                –
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock size={13} className="shrink-0" />
            {booking.timeFrom} – {booking.timeTo}
          </span>
        </div>

        {/* Kursname */}
        <h3 className="font-semibold text-gray-900 text-base leading-tight">
          {booking.courseName}
        </h3>

        {/* Datum + Raum */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{dateFormatted}</span>
          <span className="flex items-center gap-1">
            <MapPin size={13} className="shrink-0" />
            {booking.roomName}
          </span>
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>
      </button>

      {/* Exakt derselbe Dialog wie auf der Public Page, aber in der Admin-Ansicht */}
      <BookingDialog
        course={toPublicCourse(booking)}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        paymentStatus={booking.paymentStatus}
      />
    </>
  );
};

export default KundeBookingCard;
