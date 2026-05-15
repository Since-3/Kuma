"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { checkUserBookingStatus } from "../../actions/booking-actions";
import { toast } from "sonner";

interface CourseBookingViewProps {
  course: {
    id: string;
    name: string;
    sport: string[];
    date: Date;
    timeFrom: string;
    timeTo: string;
    description: string;
    maxParticipants: number;
    currentParticipants: number;
    room: string;
    price: number;
  };
}

const CourseBookingView = ({ course }: CourseBookingViewProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const spotsAvailable = course.maxParticipants - course.currentParticipants;
  const isFull = spotsAvailable <= 0;

  // Format date for display
  const formattedDate = new Date(course.date).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(course.price);

  // Check if user already booked this course
  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkUserBookingStatus(course.id);
      if (result.success) {
        setIsAlreadyBooked(result.isBooked);
      }
      setIsCheckingStatus(false);
    };
    checkStatus();
  }, [course.id]);

  const handleBooking = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error || "Fehler bei der Buchung");
        setIsSubmitting(false);
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
          <p className="text-lg text-gray-600">{course.sport.join(", ")}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-700">Datum</h2>
            <p className="text-gray-900">{formattedDate}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Uhrzeit</h2>
            <p className="text-gray-900">
              {course.timeFrom} - {course.timeTo}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Raum</h2>
            <p className="text-gray-900">{course.room}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Verfügbare Plätze</h2>
            <p className="text-gray-900">
              {course.currentParticipants} / {course.maxParticipants} Teilnehmer
              {isFull && <span className="text-red-500 ml-2">(Ausgebucht)</span>}
              {!isFull && (
                <span className="text-green-600 ml-2">({spotsAvailable} Plätze frei)</span>
              )}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Preis</h2>
            <p className="text-2xl font-bold text-gray-900">{formattedPrice}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700 mb-2">Was Sie mitbringen sollten</h2>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </div>
        </div>

        <div className="flex gap-4">
          {isCheckingStatus ? (
            <Button disabled className="flex-1">
              Lade Status...
            </Button>
          ) : isAlreadyBooked ? (
            <Button disabled className="flex-1">
              Bereits angemeldet
            </Button>
          ) : (
            <Button onClick={handleBooking} disabled={isSubmitting || isFull} className="flex-1">
              {isSubmitting
                ? "Wird weitergeleitet..."
                : isFull
                  ? "Ausgebucht"
                  : `Jetzt buchen - ${formattedPrice}`}
            </Button>
          )}
        </div>

        {isAlreadyBooked && (
          <p className="text-green-600 text-center mt-4">✓ Sie sind für diesen Kurs angemeldet</p>
        )}
      </div>
    </div>
  );
};

export default CourseBookingView;
