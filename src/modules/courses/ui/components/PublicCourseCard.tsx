"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import DOMPurify from "dompurify";
import { bookCourse, checkUserBookingStatus } from "../../actions/booking-actions";
import { toast } from "sonner";

const levelConfig: Record<string, { label: string; bg: string; text: string }> = {
  any: { label: "Jedes Niveau", bg: "bg-gray-200", text: "text-gray-700" },
  beginner: { label: "Anfänger", bg: "bg-blue-200", text: "text-blue-700" },
  advanced: { label: "Fortgeschrittene", bg: "bg-orange-200", text: "text-orange-700" },
  pro: { label: "Profi", bg: "bg-red-200", text: "text-red-700" },
};

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
}

interface PublicCourseCardProps {
  course: PublicCourse;
}

// Inner dialog content — only mounts when dialog opens, so booking status
// is checked lazily rather than on every card render.
const BookingDialog = ({
  course,
  open,
  onOpenChange,
}: {
  course: PublicCourse;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const safeCurrent = Math.max(0, course.currentParticipants);
  const safeMax = Math.max(0, course.maxParticipants);
  const isFull = safeCurrent >= safeMax;
  const spotsLeft = Math.max(0, safeMax - safeCurrent);

  const formattedDate = new Date(course.date).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
      const result = await bookCourse(course.id);
      if (result.success) {
        toast.success(result.message);
        setIsBooked(true);
      } else if (result.error?.includes("angemeldet sein")) {
        window.open("/login", "_blank");
      } else {
        toast.error(result.error || "Ein Fehler ist aufgetreten");
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{formattedDate}</span>
            <span>
              {course.timeFrom} – {course.timeTo}
            </span>
          </div>

          {course.sport.length > 0 && <p className="text-gray-600">{course.sport.join(", ")}</p>}

          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-lg ${levelConfig[course.level]?.bg ?? "bg-gray-200"} ${levelConfig[course.level]?.text ?? "text-gray-700"}`}
            >
              {levelConfig[course.level]?.label ?? "Jedes Niveau"}
            </span>
            <span className="font-semibold">{formattedPrice}</span>
          </div>

          <div className={`text-sm font-medium ${isFull ? "text-red-600" : "text-gray-700"}`}>
            {isFull
              ? "Ausgebucht"
              : `${spotsLeft} ${spotsLeft === 1 ? "Platz" : "Plätze"} verfügbar`}
          </div>

          {/* Participant bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${isFull ? "bg-red-500" : "bg-blue-500"}`}
              style={{
                width: `${safeMax > 0 ? Math.min(100, (safeCurrent / safeMax) * 100) : 0}%`,
              }}
            />
          </div>

          {course.description && (
            <div
              className="prose prose-sm max-w-none text-gray-600 pt-1"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }}
            />
          )}
        </div>

        <div className="pt-2">
          {isCheckingStatus ? (
            <Button disabled className="w-full">
              Lade Status…
            </Button>
          ) : isBooked ? (
            <Button disabled className="w-full">
              ✓ Bereits angemeldet
            </Button>
          ) : (
            <Button onClick={handleBooking} disabled={isSubmitting || isFull} className="w-full">
              {isSubmitting ? "Wird gebucht…" : isFull ? "Ausgebucht" : "Jetzt anmelden"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PublicCourseCard = ({ course }: PublicCourseCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const cardSafeCurrent = Math.max(0, course.currentParticipants);
  const cardSafeMax = Math.max(0, course.maxParticipants);
  const isFull = cardSafeCurrent >= cardSafeMax;
  const currentLevel = levelConfig[course.level] ?? levelConfig.any;

  const formattedDate = new Date(course.date).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedPrice = course.price.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  const fillPercent = cardSafeMax > 0 ? Math.min(100, (cardSafeCurrent / cardSafeMax) * 100) : 0;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{formattedDate}</p>
          <p className="text-gray-500 text-sm">
            {course.timeFrom} – {course.timeTo}
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">{course.name}</h2>

        <p className="text-gray-500 text-sm">{course.sport.join(", ")}</p>

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

      <BookingDialog course={course} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default PublicCourseCard;
