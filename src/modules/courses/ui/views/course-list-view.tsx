"use client";
import { useEffect, useState } from "react";
import { getMyCourses } from "../../actions/course-actions";
import { useDeleteCourse } from "../../hooks/useDeleteCourse";
import { getMyRooms } from "@/src/modules/rooms/actions/room-actions";
import { getMyTrainers } from "@/src/modules/employee/actions/employee-actions";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import CourseListItem from "../components/CourseListItem";
import { Filter, ChevronUp, ChevronDown } from "lucide-react";
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
  _count?: {
    bookings: number;
  };
};

interface CourseListViewProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const CourseListView = ({ canCreate, canEdit, canDelete }: CourseListViewProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterTrainer, setFilterTrainer] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>(searchParams.get("room") ?? "all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [roomsMap, setRoomsMap] = useState<Record<string, string>>({});
  const [trainersMap, setTrainersMap] = useState<Record<string, { label: string; pbSrc?: string }>>(
    {}
  );

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    courseToDelete,
    setCourseToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useDeleteCourse({
    onSuccess: async () => {
      if (loadedDateFrom && loadedDateTo) {
        await loadCourses({ dateFrom: loadedDateFrom, dateTo: loadedDateTo }, "initial");
      }
    },
  });

  // Date range state for infinite scroll
  const [loadedDateFrom, setLoadedDateFrom] = useState<Date | null>(null);
  const [loadedDateTo, setLoadedDateTo] = useState<Date | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [hasOlderCourses, setHasOlderCourses] = useState(true);
  const [hasNewerCourses, setHasNewerCourses] = useState(true);

  // Load rooms once on mount
  useEffect(() => {
    const loadRooms = async () => {
      const result = await getMyRooms();
      if (result.success) {
        const map: Record<string, string> = {};
        result.rooms.forEach((room) => {
          map[room.id] = room.name;
        });
        setRoomsMap(map);
      }
    };
    loadRooms();
  }, []);

  // Load trainers once on mount
  useEffect(() => {
    const loadTrainers = async () => {
      const result = await getMyTrainers();
      if (result.success) {
        const map: Record<string, { label: string; pbSrc?: string }> = {};
        result.trainers.forEach((t) => {
          map[t.value] = { label: t.label, pbSrc: t.pbSrc ?? undefined };
        });
        setTrainersMap(map);
      }
    };
    loadTrainers();
  }, []);

  /**
   * Load courses with optional date range
   * @param options - Optional date range parameters
   * @param mode - Loading mode: 'initial', 'older', or 'newer'
   */
  const loadCourses = async (
    options?: { dateFrom?: Date; dateTo?: Date },
    mode: "initial" | "older" | "newer" = "initial"
  ) => {
    const result = await getMyCourses(options);
    if (result.success) {
      if (mode === "initial") {
        // Replace all courses on initial load
        setCourses(result.courses);
      } else if (mode === "older") {
        // Prepend older courses to the beginning
        setCourses((prev) => [...result.courses, ...prev]);
      } else if (mode === "newer") {
        // Append newer courses to the end
        setCourses((prev) => [...prev, ...result.courses]);
      }

      // Check if there are more courses to load
      if (mode === "older" && result.courses.length === 0) {
        setHasOlderCourses(false);
      }
      if (mode === "newer" && result.courses.length === 0) {
        setHasNewerCourses(false);
      }
    } else {
      toast.error(result.error || "Fehler beim Laden der Kurse");
    }
  };

  /**
   * Initial load: Load courses from -2 weeks to +6 weeks from today
   */
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);

      // Calculate default date range: -2 weeks to +6 weeks from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(today.getDate() - 14); // -2 weeks

      const sixWeeksLater = new Date(today);
      sixWeeksLater.setDate(today.getDate() + 42); // +6 weeks

      // Store the loaded date range
      setLoadedDateFrom(twoWeeksAgo);
      setLoadedDateTo(sixWeeksLater);

      await loadCourses({ dateFrom: twoWeeksAgo, dateTo: sixWeeksLater }, "initial");
      setIsLoading(false);
    };
    fetchCourses();
  }, []);

  /**
   * Extend loaded date range when filter dates are outside the current range
   */
  useEffect(() => {
    if (!loadedDateFrom || !loadedDateTo || isLoading) return;

    const extendRange = async () => {
      let needsReload = false;
      let newDateFrom = loadedDateFrom;
      let newDateTo = loadedDateTo;

      // Check if dateFrom filter is before loaded range
      if (dateFrom) {
        const filterFromDate = new Date(dateFrom);
        filterFromDate.setHours(0, 0, 0, 0);
        if (filterFromDate < loadedDateFrom) {
          newDateFrom = filterFromDate;
          needsReload = true;
        }
      }

      // Check if dateTo filter is after loaded range
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
        await loadCourses({ dateFrom: newDateFrom, dateTo: newDateTo }, "initial");
        setIsLoading(false);
      }
    };

    extendRange();
  }, [dateFrom, dateTo, loadedDateFrom, loadedDateTo, isLoading]);

  /**
   * Load older courses (extend the date range backwards by 4 weeks)
   */
  const loadOlderCourses = async () => {
    if (!loadedDateFrom || isLoadingOlder) return;

    setIsLoadingOlder(true);

    // Calculate new date range: 4 weeks before the current loadedDateFrom
    const fourWeeksEarlier = new Date(loadedDateFrom);
    fourWeeksEarlier.setDate(loadedDateFrom.getDate() - 28); // -4 weeks

    const oneDayBeforeLoadedFrom = new Date(loadedDateFrom);
    oneDayBeforeLoadedFrom.setDate(loadedDateFrom.getDate() - 1); // -1 day to avoid duplicates

    await loadCourses({ dateFrom: fourWeeksEarlier, dateTo: oneDayBeforeLoadedFrom }, "older");

    // Update the loaded date range
    setLoadedDateFrom(fourWeeksEarlier);
    setIsLoadingOlder(false);
  };

  /**
   * Load newer courses (extend the date range forwards by 4 weeks)
   */
  const loadNewerCourses = async () => {
    if (!loadedDateTo || isLoadingNewer) return;

    setIsLoadingNewer(true);

    // Calculate new date range: 4 weeks after the current loadedDateTo
    const oneDayAfterLoadedTo = new Date(loadedDateTo);
    oneDayAfterLoadedTo.setDate(loadedDateTo.getDate() + 1); // +1 day to avoid duplicates

    const fourWeeksLater = new Date(loadedDateTo);
    fourWeeksLater.setDate(loadedDateTo.getDate() + 28); // +4 weeks

    await loadCourses({ dateFrom: oneDayAfterLoadedTo, dateTo: fourWeeksLater }, "newer");

    // Update the loaded date range
    setLoadedDateTo(fourWeeksLater);
    setIsLoadingNewer(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateKey = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE");
  };

  // Helper to check if a course is in the past
  const isPastCourse = (courseDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const course = new Date(courseDate);
    course.setHours(0, 0, 0, 0);
    return course < today;
  };

  // Filter courses (client-side filtering for status, sport, etc.)
  const filteredCourses = courses.filter((course) => {
    if (filterStatus !== "all" && course.status !== filterStatus) return false;
    if (filterSport !== "all" && !course.sport.includes(filterSport)) return false;
    if (filterLevel !== "all" && course.level !== filterLevel) return false;

    // Trainer filter
    if (filterTrainer !== "all" && !course.trainers.includes(filterTrainer)) return false;

    // Room filter (compare by room name, not ID)
    if (filterRoom !== "all") {
      const roomName = roomsMap[course.room] || course.room;
      if (roomName !== filterRoom) return false;
    }

    // Date range filter (additional client-side filter on top of server-side)
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const courseDate = new Date(course.date);
      courseDate.setHours(0, 0, 0, 0);
      if (courseDate < fromDate) return false;
    } else {
      // If no dateFrom filter is set, only show courses from today onwards
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

    // Time range filter
    if (timeFrom && course.timeFrom < timeFrom) return false;
    if (timeTo && course.timeTo > timeTo) return false;

    // Price range filter
    if (priceMin !== null && course.price < priceMin) return false;
    if (priceMax !== null && course.price > priceMax) return false;

    return true;
  });

  // Group courses by date
  const groupedCourses = filteredCourses.reduce(
    (acc, course) => {
      const dateKey = formatDateKey(course.date);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(course);
      return acc;
    },
    {} as Record<string, Course[]>
  );

  // Sort dates
  const sortedDates = Object.keys(groupedCourses).sort((a, b) => {
    return (
      new Date(a.split(".").reverse().join("-")).getTime() -
      new Date(b.split(".").reverse().join("-")).getTime()
    );
  });

  // Calculate price range from courses
  const priceRangeMin =
    courses.length > 0 ? Math.floor(Math.min(...courses.map((c) => c.price))) : 0;
  const priceRangeMax =
    courses.length > 0 ? Math.ceil(Math.max(...courses.map((c) => c.price))) : 0;

  // Get unique sports for filter
  const uniqueSports = Array.from(new Set(courses.flatMap((c) => c.sport)));

  // Get unique trainers for filter (flatten trainer UIDs, map to labels)
  const uniqueTrainers = Array.from(new Set(courses.flatMap((c) => c.trainers))).map((uid) => ({
    value: uid,
    label: trainersMap[uid]?.label ?? uid,
  }));

  // Get unique rooms for filter (using room names from roomsMap)
  const uniqueRooms = Array.from(new Set(courses.map((c) => roomsMap[c.room] || c.room)));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Kurse werden geladen...</p>
      </div>
    );
  }

  // Count active filters
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

          {/* Mobile: Filter button below the two action buttons */}
          <div className="sm:hidden">
            <CourseFilter
              filterStatus={filterStatus}
              filterSport={filterSport}
              filterTrainer={filterTrainer}
              filterRoom={filterRoom}
              filterLevel={filterLevel}
              dateFrom={dateFrom}
              dateTo={dateTo}
              timeFrom={timeFrom}
              timeTo={timeTo}
              priceMin={priceMin ?? priceRangeMin}
              priceMax={priceMax ?? priceRangeMax}
              priceRangeMin={priceRangeMin}
              priceRangeMax={priceRangeMax}
              uniqueSports={uniqueSports}
              uniqueTrainers={uniqueTrainers}
              uniqueRooms={uniqueRooms}
              onApplyFilters={(filters) => {
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
              }}
              onReset={() => {
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
              }}
            >
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

          {/* Desktop: Filter + Kurs löschen nebeneinander */}
          <CourseFilter
            filterStatus={filterStatus}
            filterSport={filterSport}
            filterTrainer={filterTrainer}
            filterRoom={filterRoom}
            filterLevel={filterLevel}
            dateFrom={dateFrom}
            dateTo={dateTo}
            timeFrom={timeFrom}
            timeTo={timeTo}
            priceMin={priceMin ?? priceRangeMin}
            priceMax={priceMax ?? priceRangeMax}
            priceRangeMin={priceRangeMin}
            priceRangeMax={priceRangeMax}
            uniqueSports={uniqueSports}
            uniqueTrainers={uniqueTrainers}
            uniqueRooms={uniqueRooms}
            onApplyFilters={(filters) => {
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
            }}
            onReset={() => {
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
            }}
          >
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

      {/* Load Older Courses Button */}
      {hasOlderCourses && (
        <div className="mb-4 flex justify-center">
          <Button
            variant="outline"
            onClick={loadOlderCourses}
            disabled={isLoadingOlder}
            className="flex items-center gap-2"
          >
            <ChevronUp size={18} />
            {isLoadingOlder ? "Lädt..." : "Ältere Kurse laden"}
          </Button>
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600">
            {courses.length === 0
              ? "Sie haben noch keine Kurse erstellt"
              : "Keine Kurse gefunden mit den ausgewählten Filtern"}
          </p>
          <p className="text-gray-500 mt-2">
            {courses.length === 0
              ? "Erstellen Sie Ihren ersten Kurs!"
              : "Ändern Sie die Filter oder setzen Sie sie zurück"}
          </p>
          {courses.length === 0 && canCreate && (
            <Button onClick={() => router.push("/courses/create")} className="mt-4">
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {formatDate(firstCourse.date)}
                </h2>
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

      {/* Load Newer Courses Button */}
      {hasNewerCourses && filteredCourses.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={loadNewerCourses}
            disabled={isLoadingNewer}
            className="flex items-center gap-2"
          >
            <ChevronDown size={18} />
            {isLoadingNewer ? "Lädt..." : "Neuere Kurse laden"}
          </Button>
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
