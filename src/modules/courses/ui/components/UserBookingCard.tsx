"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Clock, X } from "lucide-react";
import type { UserBooking } from "../../actions/booking-actions";
import { cancelUserBooking } from "../../actions/booking-actions";
import AbstractTooltip from "@/src/components/layout/AbstractTooltip";
import { BookingDialog } from "@/src/modules/courses/ui/components/PublicCourseCard";
import type { PublicCourse } from "@/src/modules/courses/ui/components/PublicCourseCard";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

const getDiceBearUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(`t-${seed.slice(0, 6)}`)}`;

const PAYMENT_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Bezahlt", bg: "bg-green-100", text: "text-green-700" },
  pending: { label: "Ausstehend", bg: "bg-yellow-100", text: "text-yellow-700" },
  refunded: { label: "Storniert", bg: "bg-red-100", text: "text-red-600" },
  failed: { label: "Fehlgeschlagen", bg: "bg-red-100", text: "text-red-600" },
};

function toPublicCourse(b: UserBooking): PublicCourse {
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

interface UserBookingCardProps {
  booking: UserBooking;
}

const UserBookingCard = ({ booking }: UserBookingCardProps) => {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cancelled, setCancelled] = useState(booking.paymentStatus === "refunded");

  const effectiveStatus = cancelled ? "refunded" : booking.paymentStatus;
  const status = PAYMENT_STATUS[effectiveStatus] ?? PAYMENT_STATUS.pending;

  const dateFormatted = new Date(booking.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const canCancel = !booking.isPast && !cancelled && booking.paymentStatus === "paid";

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await cancelUserBooking(booking.bookingId);
      if (result.success) {
        setCancelled(true);
        router.refresh();
        toast.success("Buchung erfolgreich storniert.");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl shadow-sm hover:shadow-md hover:bg-white/85 transition-all flex flex-col gap-0 overflow-hidden">
        {/* Clickable card area */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="text-left w-full p-4 flex flex-col gap-3 select-none cursor-pointer"
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

        {/* Stornierung Button – nur für zukünftige, nicht stornierte Buchungen */}
        {canCancel && (
          <div className="px-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X size={14} className="mr-1.5 shrink-0" />
              {isPending ? "Wird storniert…" : "Stornieren"}
            </Button>
          </div>
        )}
      </div>

      <BookingDialog
        course={toPublicCourse(booking)}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        paymentStatus={effectiveStatus}
      />
    </>
  );
};

export default UserBookingCard;
