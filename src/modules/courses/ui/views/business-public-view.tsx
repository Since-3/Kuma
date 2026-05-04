"use client";

import { useState, useTransition } from "react";
import { CalendarIcon, X } from "lucide-react";
import PublicCourseCard from "../components/PublicCourseCard";
import { getPublishedCoursesForBusiness } from "../../actions/booking-actions";
import { Calendar } from "@/src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";

interface Business {
  id: string;
  name: string;
  address: string;
  email: string;
  title: string;
  slug: string;
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
}

interface BusinessPublicViewProps {
  business: Business;
  initialCourses: PublicCourse[];
  initialWindow: { from: Date; to: Date };
}

const BusinessPublicView = ({
  business,
  initialCourses,
  initialWindow,
}: BusinessPublicViewProps) => {
  const [loadedCourses, setLoadedCourses] = useState<PublicCourse[]>(initialCourses);
  const [loadedWindow, setLoadedWindow] = useState(initialWindow);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDateSelect = (date: Date | undefined) => {
    setCalendarOpen(false);
    setSelectedDate(date);

    if (!date) return;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // If within loaded window — filter client-side, no fetch needed
    if (dayStart >= loadedWindow.from && dayEnd <= loadedWindow.to) {
      return;
    }

    // Outside window — fetch ±15 day window around chosen date
    const newFrom = new Date(date);
    newFrom.setDate(newFrom.getDate() - 15);
    newFrom.setHours(0, 0, 0, 0);
    const newTo = new Date(date);
    newTo.setDate(newTo.getDate() + 15);
    newTo.setHours(23, 59, 59, 999);

    startTransition(async () => {
      const result = await getPublishedCoursesForBusiness(business.id, {
        from: newFrom,
        to: newTo,
      });
      if (result.success && result.courses) {
        setLoadedCourses(result.courses as PublicCourse[]);
        setLoadedWindow({ from: newFrom, to: newTo });
      }
    });
  };

  const handleReset = () => {
    setSelectedDate(undefined);
    if (
      loadedWindow.from.getTime() !== initialWindow.from.getTime() ||
      loadedWindow.to.getTime() !== initialWindow.to.getTime()
    ) {
      startTransition(async () => {
        const result = await getPublishedCoursesForBusiness(business.id, initialWindow);
        if (result.success && result.courses) {
          setLoadedCourses(result.courses as PublicCourse[]);
          setLoadedWindow(initialWindow);
        }
      });
    }
  };

  const displayedCourses = selectedDate
    ? loadedCourses.filter((c) => {
        const d = new Date(c.date);
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);
        return d >= dayStart && d <= dayEnd;
      })
    : loadedCourses;

  const formattedSelectedDate = selectedDate
    ? selectedDate.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-gray-900">{business.name}</h1>
          {business.title && <p className="text-xl text-gray-500 mt-1">{business.title}</p>}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 text-sm text-gray-600">
            <span>{business.address}</span>
            {business.email && (
              <>
                <span className="hidden sm:inline">·</span>
                <a href={`mailto:${business.email}`} className="hover:underline text-blue-600">
                  {business.email}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Unsere Kurse</h2>

          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon size={16} />
                  {formattedSelectedDate ?? "Datum filtern"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {selectedDate && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                title="Filter zurücksetzen"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isPending ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : displayedCourses.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {selectedDate
              ? "Für diesen Tag sind keine Kurse verfügbar."
              : "Aktuell sind keine Kurse verfügbar."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedCourses.map((course) => (
              <PublicCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessPublicView;
