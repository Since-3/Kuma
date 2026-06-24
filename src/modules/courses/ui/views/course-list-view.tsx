"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getMyCourses } from "../../actions/course-actions";
import { useDeleteCourse } from "../../hooks/useDeleteCourse";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import CourseListItem from "../components/CourseListItem";
import { Filter } from "lucide-react";
import DeleteDialog from "@/src/components/layout/DeleteDialog";
import CourseFilter from "../components/CourseFilter";

type Course = {
  id: string;
  name: string;
  sport: string[];
  level: string;
  date: Date;
  timeFrom: string;
  timeTo: string;
  trainers: string[];
  room: string;
  description: string;
  maxParticipants: number;
  price: number;
  isStandingOrder: boolean;
  frequency: string | null;
  weekdays: string[];
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  coverImage: string | null;
  _count?: { bookings: number };
};

interface CourseListViewProps {
  initialCourses: Course[];
  initialDateFrom: Date;
  initialDateTo: Date;
  roomsMap: Record<string, string>;
  trainersMap: Record<string, { label: string; pbSrc?: string }>;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const CourseListView = ({
  initialCourses,
  initialDateFrom,
  initialDateTo,
  roomsMap,
  trainersMap,
  canCreate,
  canEdit,
  canDelete,
}: CourseListViewProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedDateFrom, setLoadedDateFrom] = useState<Date>(initialDateFrom);
  const [loadedDateTo, setLoadedDateTo] = useState<Date>(initialDateTo);

  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterTrainer, setFilterTrainer] = useState<string>(searchParams.get("trainer") ?? "all");
  const [filterRoom, setFilterRoom] = useState<string>(searchParams.get("room") ?? "all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    courseToDelete,
    setCourseToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useDeleteCourse({
    onSuccess: (deletedId) => {
      setCourses((prev) => prev.filter((c) => c.id !== deletedId));
      router.refresh();
    },
  });

  const loadCourses = async (options: { dateFrom: Date; dateTo: Date }) => {
    const result = await getMyCourses(options);
    if (result.success) {
      setCourses(result.courses);
    } else {
      toast.error(result.error || "Fehler beim Laden der Kurse");
    }
  };

  // Extend loaded date range only when filter dates go outside the server-fetched range
  useEffect(() => {
    if (isLoading) return;

    const extendRange = async () => {
      let needsReload = false;
      let newDateFrom = loadedDateFrom;
      let newDateTo = loadedDateTo;

      if (dateFrom) {
        const filterFromDate = new Date(dateFrom);
        filterFromDate.setHours(0, 0, 0, 0);
        if (filterFromDate < loadedDateFrom) {
          newDateFrom = filterFromDate;
          needsReload = true;
        }
      }

      if (dateTo) {
        const filterToDate = new Date(dateTo);
        filterToDate.setHours(0, 0, 0, 0);
        if (filterToDate > loadedDateTo) {
          newDateTo = filterToDate;
          needsReload = true;
        }
      }

      if (needsReload) {
        setIsLoading(true);
        setLoadedDateFrom(newDateFrom);
        setLoadedDateTo(newDateTo);
        await loadCourses({ dateFrom: newDateFrom, dateTo: newDateTo });
        setIsLoading(false);
      }
    };

    extendRange();
  }, [dateFrom, dateTo]);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatDateKey = (date: Date) => new Date(date).toLocaleDateString("de-DE");

  const isPastCourse = (courseDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const course = new Date(courseDate);
    course.setHours(0, 0, 0, 0);
    return course < today;
  };

  const filteredCourses = courses.filter((course) => {
    if (filterStatus !== "all" && course.status !== filterStatus) return false;
    if (filterSport !== "all" && !course.sport.includes(filterSport)) return false;
    if (filterLevel !== "all" && course.level !== filterLevel) return false;
    if (filterTrainer !== "all" && !course.trainers.includes(filterTrainer)) return false;
    if (filterRoom !== "all") {
      const roomName = roomsMap[course.room] || course.room;
      if (roomName !== filterRoom) return false;
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const courseDate = new Date(course.date);
      courseDate.setHours(0, 0, 0, 0);
      if (courseDate < fromDate) return false;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const courseDate = new Date(course.date);
      courseDate.setHours(0, 0, 0, 0);
      if (courseDate < today) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(0, 0, 0, 0);
      const courseDate = new Date(course.date);
      courseDate.setHours(0, 0, 0, 0);
      if (courseDate > toDate) return false;
    }
    if (timeFrom && course.timeFrom < timeFrom) return false;
    if (timeTo && course.timeTo > timeTo) return false;
    if (priceMin !== null && course.price < priceMin) return false;
    if (priceMax !== null && course.price > priceMax) return false;
    return true;
  });

  const groupedCourses = filteredCourses.reduce(
    (acc, course) => {
      const dateKey = formatDateKey(course.date);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(course);
      return acc;
    },
    {} as Record<string, Course[]>
  );

  const sortedDates = Object.keys(groupedCourses).sort(
    (a, b) =>
      new Date(a.split(".").reverse().join("-")).getTime() -
      new Date(b.split(".").reverse().join("-")).getTime()
  );

  const priceRangeMin =
    courses.length > 0 ? Math.floor(Math.min(...courses.map((c) => c.price))) : 0;
  const priceRangeMax =
    courses.length > 0 ? Math.ceil(Math.max(...courses.map((c) => c.price))) : 0;
  const uniqueSports = Array.from(new Set(courses.flatMap((c) => c.sport)));
  const uniqueTrainers = Array.from(new Set(courses.flatMap((c) => c.trainers))).map((uid) => ({
    value: uid,
    label: trainersMap[uid]?.label ?? uid,
  }));
  const uniqueRooms = Array.from(new Set(courses.map((c) => roomsMap[c.room] || c.room)));

  const activeFiltersCount = [
    filterStatus !== "all",
    filterSport !== "all",
    filterTrainer !== "all",
    filterRoom !== "all",
    filterLevel !== "all",
    !!dateFrom,
    !!dateTo,
    !!timeFrom,
    !!timeTo,
    priceMin !== null && priceMin !== priceRangeMin,
    priceMax !== null && priceMax !== priceRangeMax,
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-5 space-y-3"
          >
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between pt-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filterProps = {
    filterStatus,
    filterSport,
    filterTrainer,
    filterRoom,
    filterLevel,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    priceMin: priceMin ?? priceRangeMin,
    priceMax: priceMax ?? priceRangeMax,
    priceRangeMin,
    priceRangeMax,
    uniqueSports,
    uniqueTrainers,
    uniqueRooms,
    onApplyFilters: (filters: {
      filterStatus: "all" | "draft" | "published";
      filterSport: string;
      filterTrainer: string;
      filterRoom: string;
      filterLevel: string;
      dateFrom: string;
      dateTo: string;
      timeFrom: string;
      timeTo: string;
      priceMin: number;
      priceMax: number;
    }) => {
      setFilterStatus(filters.filterStatus);
      setFilterSport(filters.filterSport);
      setFilterTrainer(filters.filterTrainer);
      setFilterRoom(filters.filterRoom);
      setFilterLevel(filters.filterLevel);
      setDateFrom(filters.dateFrom);
      setDateTo(filters.dateTo);
      setTimeFrom(filters.timeFrom);
      setTimeTo(filters.timeTo);
      setPriceMin(filters.priceMin === priceRangeMin ? null : filters.priceMin);
      setPriceMax(filters.priceMax === priceRangeMax ? null : filters.priceMax);
    },
    onReset: () => {
      setFilterStatus("all");
      setFilterSport("all");
      setFilterTrainer("all");
      setFilterRoom("all");
      setFilterLevel("all");
      setDateFrom("");
      setDateTo("");
      setTimeFrom("");
      setTimeTo("");
      setPriceMin(null);
      setPriceMax(null);
    },
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col w-full gap-2 mr-2 sm:flex-row sm:justify-end">
          <div className="flex gap-2 sm:hidden">
            {canCreate && (
              <Button onClick={() => router.push("/courses/create")} className="flex-1">
                Kurs anlegen
              </Button>
            )}
            {canDelete && (
              <Button
                variant={deleteMode ? "destructive" : "outline"}
                onClick={() => setDeleteMode(!deleteMode)}
                className="flex-1"
              >
                {deleteMode ? "Abbrechen" : "Kurs löschen"}
              </Button>
            )}
          </div>
          <div className="sm:hidden">
            <CourseFilter {...filterProps}>
              <Button variant="outline" className="flex w-full items-center gap-2 relative">
                <Filter size={18} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow text-blue text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </CourseFilter>
          </div>
          <CourseFilter {...filterProps}>
            <Button variant="outline" className="hidden sm:flex items-center gap-2 relative">
              <Filter size={18} />
              Filter
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow text-blue text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </CourseFilter>
          {canDelete && (
            <Button
              variant={deleteMode ? "destructive" : "outline"}
              onClick={() => setDeleteMode(!deleteMode)}
              className="hidden sm:flex items-center gap-2"
            >
              {deleteMode ? "Abbrechen" : "Kurs löschen"}
            </Button>
          )}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl">
          <p className="text-3xl font-black text-gray-800 mb-2">
            {courses.length === 0 ? "Noch keine Kurse" : "Keine Treffer"}
          </p>
          <p className="text-gray-400 font-light text-sm">
            {courses.length === 0
              ? "Erstelle deinen ersten Kurs und starte durch."
              : "Andere Filter ausprobieren oder zurücksetzen."}
          </p>
          {courses.length === 0 && canCreate && (
            <Button onClick={() => router.push("/courses/create")} className="mt-6">
              Kurs anlegen
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => {
            const coursesForDate = groupedCourses[dateKey];
            const firstCourse = coursesForDate[0];
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                    {formatDate(firstCourse.date)}
                  </h2>
                  <div className="flex-1 h-px bg-white/50" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coursesForDate.map((course) => (
                    <CourseListItem
                      key={course.id}
                      courseId={course.id}
                      courseName={course.name}
                      room={roomsMap[course.room] || course.room}
                      timeFrom={course.timeFrom}
                      timeTo={course.timeTo}
                      currentParticipants={course._count?.bookings || 0}
                      maxParticipants={course.maxParticipants}
                      price={course.price}
                      level={course.level}
                      trainers={course.trainers}
                      trainersMap={trainersMap}
                      status={course.status}
                      isPast={isPastCourse(course.date)}
                      showDeleteIcon={deleteMode && canDelete}
                      coverImage={course.coverImage ?? undefined}
                      onDelete={
                        canDelete ? () => handleDeleteClick(course.id, course.name) : undefined
                      }
                      onEdit={canEdit ? () => router.push(`/courses/edit/${course.id}`) : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setCourseToDelete(null);
        }}
        itemName={courseToDelete?.name}
        topicName="Kurs"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CourseListView;
