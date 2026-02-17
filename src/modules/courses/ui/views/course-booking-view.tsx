"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { bookCourse, checkUserBookingStatus } from "../../actions/booking-actions";
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
  };
}

const CourseBookingView = ({ course }: CourseBookingViewProps) => {
  const router = useRouter();
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
      const result = await bookCourse(course.id);

      if (result.success) {
        toast.success(result.message);
        setIsAlreadyBooked(true);
        router.refresh();
      } else {
        toast.error(result.error || "Ein Fehler ist aufgetreten");
      }
    } catch (error) {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
      console.error(error);
    } finally {
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
              {isSubmitting ? "Wird gebucht..." : isFull ? "Ausgebucht" : "Jetzt anmelden"}
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
