"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PublicCourseCard from "../components/PublicCourseCard";
import { getPublishedCoursesForBusiness } from "../../actions/booking-actions";
import { Calendar } from "@/src/components/ui/calendar";
import { de } from "date-fns/locale";

interface Business {
  id: string;
  name: string;
  address: string;
  email: string;
  title: string;
  slug: string;
}

interface TrainerProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  pbSrc: string | null;
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
  trainerProfiles?: TrainerProfile[];
}

interface BusinessPublicViewProps {
  business: Business;
  initialCourses: PublicCourse[];
  initialWindow: { from: Date; to: Date };
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const BusinessPublicView = ({
  business,
  initialCourses,
  initialWindow,
}: BusinessPublicViewProps) => {
  const [loadedCourses, setLoadedCourses] = useState<PublicCourse[]>(initialCourses);
  const [loadedWindow, setLoadedWindow] = useState(initialWindow);
  const [selectedDate, setSelectedDate] = useState<Date>(TODAY);
  const [activeSport, setActiveSport] = useState<string>("Alle");
  const [isPending, startTransition] = useTransition();

  // Deep-Link: ?course=<id> öffnet das Detail-Popup des Kurses und springt
  // auf dessen Datum, damit die Karte sichtbar ist (z.B. geteilter Buchungslink).
  const searchParams = useSearchParams();
  const deepLinkCourseId = searchParams.get("course");

  useEffect(() => {
    if (!deepLinkCourseId) return;
    const target = loadedCourses.find((c) => c.id === deepLinkCourseId);
    if (!target) return;
    const day = new Date(target.date);
    day.setHours(0, 0, 0, 0);
    setSelectedDate(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkCourseId]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    setSelectedDate(dayStart);

    // Within loaded window — client-side filter, no fetch
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

  // Derive all distinct sports from loaded courses for tab list
  const allSports = useMemo(() => {
    const set = new Set<string>();
    loadedCourses.forEach((c) => c.sport.forEach((s) => set.add(s)));
    return ["Alle", ...Array.from(set).sort()];
  }, [loadedCourses]);

  // Reset active sport if it no longer exists after a window refetch
  const resolvedSport = allSports.includes(activeSport) ? activeSport : "Alle";

  const displayedCourses = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    return loadedCourses.filter((c) => {
      const d = new Date(c.date);
      if (d < dayStart || d > dayEnd) return false;
      if (resolvedSport !== "Alle" && !c.sport.includes(resolvedSport)) return false;
      return true;
    });
  }, [loadedCourses, selectedDate, resolvedSport]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formattedSelectedDate = selectedDate.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-white/60 bg-white/55 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-10">
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

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          {/* Left: sticky calendar */}
          <div className="lg:sticky lg:top-6 shrink-0 w-full lg:w-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">{formattedSelectedDate}</h2>
            <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-xl shadow-sm p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={{ before: TODAY }}
                locale={de}
                className="[--cell-size:--spacing(10)]"
              />
            </div>
          </div>

          {/* Right: filter + cards */}
          <div className="flex-1 min-w-0">
            {/* Filter bündig mit Kalender-Oberkante (gleiche mb wie h2 links) */}
            <div className="mb-4 mt-11">
              {allSports.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {allSports.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setActiveSport(sport)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        resolvedSport === sport
                          ? "bg-gray-900 text-white"
                          : "border border-white/60 bg-white/55 backdrop-blur-sm text-gray-600 hover:bg-white/70"
                      }`}
                    >
                      {sport === "Alle" ? "Alle" : capitalize(sport)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Courses */}
            {isPending ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : displayedCourses.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                Für diesen Tag sind keine Kurse verfügbar.
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {displayedCourses.map((course) => (
                  <PublicCourseCard
                    key={course.id}
                    course={course}
                    business={{ address: business.address, email: business.email }}
                    defaultOpen={course.id === deepLinkCourseId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPublicView;
