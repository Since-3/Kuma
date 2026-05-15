"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, MapPin, Users, Mail, Phone, DoorOpen, Info } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
import DOMPurify from "dompurify";
import { checkUserBookingStatus } from "../../actions/booking-actions";
import { toast } from "sonner";

const levelConfig: Record<string, { label: string; bg: string; text: string }> = {
  any: { label: "Jedes Niveau", bg: "bg-gray-200", text: "text-gray-700" },
  beginner: { label: "Anfänger", bg: "bg-blue-200", text: "text-blue-700" },
  advanced: { label: "Fortgeschrittene", bg: "bg-orange-200", text: "text-orange-700" },
  pro: { label: "Profi", bg: "bg-red-200", text: "text-red-700" },
};

interface TrainerProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  pbSrc: string | null;
}

interface BusinessInfo {
  address: string;
  email: string;
  tel?: string;
}

interface PublicCourse {
  id: string;
  name: string;
  sport: string[];
  level: string;
  date: Date;
  timeFrom: string;
  timeTo: string;
  maxParticipants: number;
  price: number;
  currentParticipants: number;
  description?: string;
  room?: string;
  roomName?: string | null;
  coverImage?: string;
  trainerProfiles?: TrainerProfile[];
}

interface PublicCourseCardProps {
  course: PublicCourse;
  business?: BusinessInfo;
}

const TrainerAvatar = ({ trainer, size }: { trainer: TrainerProfile; size: "sm" | "lg" }) => {
  const fullName = [trainer.firstName, trainer.lastName].filter(Boolean).join(" ") || "Trainer";
  const initials =
    [trainer.firstName?.[0], trainer.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "T";
  const sizeClass = size === "lg" ? "size-10" : "size-8";
  const textClass = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0`}
    >
      {trainer.pbSrc ? (
        <Image
          src={trainer.pbSrc}
          alt={fullName}
          width={size === "lg" ? 40 : 32}
          height={size === "lg" ? 40 : 32}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className={`${textClass} font-medium text-gray-600`}>{initials}</span>
      )}
    </div>
  );
};

const BookingDialog = ({
  course,
  business,
  open,
  onOpenChange,
}: {
  course: PublicCourse;
  business?: BusinessInfo;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const safeCurrent = Math.max(0, course.currentParticipants);
  const safeMax = Math.max(0, course.maxParticipants);
  const isFull = safeCurrent >= safeMax;
  const level = levelConfig[course.level] ?? levelConfig.any;

  const formattedDate = new Date(course.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedPrice = course.price.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  useEffect(() => {
    if (!open) return;
    let active = true;

    const loadStatus = async () => {
      setIsCheckingStatus(true);
      try {
        const result = await checkUserBookingStatus(course.id);
        if (!active) return;
        setIsBooked(result.success ? result.isBooked : false);
      } catch {
        if (!active) return;
        setIsBooked(false);
      } finally {
        if (active) setIsCheckingStatus(false);
      }
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, [open, course.id]);

  const handleBooking = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        window.open("/login", "_blank");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok || !data.url) {
        toast.error(data.error || "Ein Fehler ist aufgetreten");
        setIsSubmitting(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl! w-[95vw] p-0 overflow-hidden gap-0">
        <VisuallyHidden>
          <DialogTitle>{course.name}</DialogTitle>
        </VisuallyHidden>

        {/* Cover image */}
        <div className="relative w-full h-64 bg-gray-200 shrink-0">
          {course.coverImage ? (
            <Image src={course.coverImage} alt={course.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Kein Bild vorhanden</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{course.name}</h2>
            <span className="text-sm text-gray-500 shrink-0 mt-0.5">{formattedDate}</span>
          </div>

          {/* Trainer(s) */}
          {course.trainerProfiles && course.trainerProfiles.length > 0 && (
            <div className="flex flex-col gap-2">
              {course.trainerProfiles.map((trainer) => {
                const fullName =
                  [trainer.firstName, trainer.lastName].filter(Boolean).join(" ") || "Trainer";
                return (
                  <div key={trainer.id} className="flex items-center gap-3">
                    <TrainerAvatar trainer={trainer} size="lg" />
                    <span className="text-sm font-medium text-gray-800">{fullName}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Level badge */}
          <span
            className={`self-start text-xs font-semibold px-2.5 py-1 rounded-lg ${level.bg} ${level.text}`}
          >
            {level.label}
          </span>

          {/* Info rows */}
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="text-gray-400 shrink-0" />
              <span>
                <b>Uhrzeit:</b> {course.timeFrom} – {course.timeTo}
              </span>
            </div>

            {course.roomName && (
              <div className="flex items-center gap-2.5">
                <DoorOpen size={15} className="text-gray-400 shrink-0" />
                <span>
                  <b>Raum:</b> {course.roomName}
                </span>
              </div>
            )}

            {business?.address && (
              <div className="flex items-center gap-2.5">
                <MapPin size={15} className="text-gray-400 shrink-0" />
                <span>
                  <b>Ort:</b> {business?.address}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Users size={15} className="text-gray-400 shrink-0" />
              <span>
                <b>Teilnehmer:</b> {safeCurrent}/{safeMax}
                {isFull && <span className="ml-2 text-red-600 font-medium">· Ausgebucht</span>}
              </span>
            </div>

            {business?.email && (
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <a href={`mailto:${business.email}`} className="hover:underline text-gray-700">
                  <b>Email:</b> {business.email}
                </a>
              </div>
            )}

            {business?.tel && (
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-gray-400 shrink-0" />
                <a href={`tel:${business.tel}`} className="hover:underline text-gray-700">
                  {business.tel}
                </a>
              </div>
            )}

            {course.description && (
              <div className="flex items-start gap-2.5">
                <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <b>Was Sie beachten sollten:</b>
                  <div
                    className="prose prose-sm max-w-none text-gray-600 mt-1"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer: price + actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-lg font-bold text-gray-900">Preis: {formattedPrice}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
              {isCheckingStatus ? (
                <Button disabled>Lade…</Button>
              ) : isBooked ? (
                <Button disabled>✓ Angemeldet</Button>
              ) : (
                <Button onClick={handleBooking} disabled={isSubmitting || isFull}>
                  {isSubmitting ? "Wird gebucht…" : isFull ? "Ausgebucht" : "Buchen"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PublicCourseCard = ({ course, business }: PublicCourseCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const cardSafeCurrent = Math.max(0, course.currentParticipants);
  const cardSafeMax = Math.max(0, course.maxParticipants);
  const isFull = cardSafeCurrent >= cardSafeMax;
  const currentLevel = levelConfig[course.level] ?? levelConfig.any;

  const formattedDate = new Date(course.date).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const formattedPrice = course.price.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  const fillPercent = cardSafeMax > 0 ? Math.min(100, (cardSafeCurrent / cardSafeMax) * 100) : 0;

  return (
    <>
      <div
        onClick={() => setDialogOpen(true)}
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{formattedDate}</p>
          <p className="text-gray-500 text-sm">
            {course.timeFrom} – {course.timeTo}
          </p>
        </div>

        {course.trainerProfiles && course.trainerProfiles.length > 0 && (
          <div className="flex items-center gap-1.5">
            {course.trainerProfiles.map((trainer) => {
              const fullName =
                [trainer.firstName, trainer.lastName].filter(Boolean).join(" ") || "Trainer";
              return (
                <Tooltip key={trainer.id}>
                  <TooltipTrigger asChild>
                    <div>
                      <TrainerAvatar trainer={trainer} size="sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{fullName}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-900">{course.name}</h2>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-lg ${currentLevel.bg} ${currentLevel.text}`}
          >
            {currentLevel.label}
          </span>
          <span className="text-lg font-semibold">{formattedPrice}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className={isFull ? "text-red-600 font-semibold text-sm" : "text-gray-700 text-sm"}>
            {course.currentParticipants}/{course.maxParticipants} Teilnehmer
          </span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isFull ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {isFull ? (
          <Button disabled variant="outline" className="w-full">
            Ausgebucht
          </Button>
        ) : (
          <Button className="w-full" onClick={() => setDialogOpen(true)}>
            Jetzt anmelden
          </Button>
        )}
      </div>

      <BookingDialog
        course={course}
        business={business}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default PublicCourseCard;
