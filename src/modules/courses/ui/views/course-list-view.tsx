"use client";
import { useEffect, useState } from "react";
import { getMyCourses, deleteCourse } from "../../actions/course-actions";
import { getAllRooms } from "@/src/modules/rooms/actions/room-actions";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CourseListItem from "../components/CourseListItem";
import { Filter, ChevronUp, ChevronDown } from "lucide-react";
import DeleteDialog from "@/src/components/layout/DeleteDialog";

type Course = {
  id: string;
  name: string;
  sport: string;
  date: Date;
  time: string;
  trainers: string[];
  room: string;
  description: string;
  maxParticipants: number;
  isStandingOrder: boolean;
  frequency: string | null;
  weekdays: string[];
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const CourseListView = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showPastCourses, setShowPastCourses] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roomsMap, setRoomsMap] = useState<Record<string, string>>({});

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
      const result = await getAllRooms();
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

  const requestDelete = (courseId: string, courseName: string) => {
    setCourseToDelete({ id: courseId, name: courseName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);

    const result = await deleteCourse(courseToDelete.id);

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setCourseToDelete(null);

    if (result.success) {
      toast.success(result.message);
      // Reload courses with the current date range
      if (loadedDateFrom && loadedDateTo) {
        await loadCourses({ dateFrom: loadedDateFrom, dateTo: loadedDateTo }, "initial");
      }
    } else {
      toast.error(result.error || "Fehler beim Löschen");
    }
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
    if (filterSport !== "all" && course.sport !== filterSport) return false;

    // Hide past courses unless showPastCourses is enabled
    if (!showPastCourses && isPastCourse(course.date)) return false;

    // Date range filter (additional client-side filter on top of server-side)
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const courseDate = new Date(course.date);
      courseDate.setHours(0, 0, 0, 0);
      if (courseDate < fromDate) return false;
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(0, 0, 0, 0);
      const courseDate = new Date(course.date);
      courseDate.setHours(0, 0, 0, 0);
      if (courseDate > toDate) return false;
    }

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

  // Get unique sports for filter
  const uniqueSports = Array.from(new Set(courses.map((c) => c.sport)));

  // Get first trainer name (for display)
  const getTrainerName = (trainers: string[]) => {
    if (trainers.length === 0) return "Kein Trainer";
    // For now, using trainer ID as name - in real app, you'd fetch trainer names
    return trainers.length > 1 ? `${trainers[0]} +${trainers.length - 1}` : trainers[0];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Kurse werden geladen...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex w-full justify-end mr-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={18} />
            Filter
          </Button>
          <Button
            variant={deleteMode ? "destructive" : "outline"}
            onClick={() => setDeleteMode(!deleteMode)}
            className="flex items-center gap-2"
          >
            {deleteMode ? "Abbrechen" : "Kurs löschen"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Filter</h2>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "draft" | "published")}
                className="h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
              >
                <option value="all">Alle</option>
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
              </select>
            </div>

            {/* Sportart Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Sportart</label>
              <select
                value={filterSport}
                onChange={(e) => setFilterSport(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
              >
                <option value="all">Alle</option>
                {uniqueSports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Von Datum</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Bis Datum</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
              />
            </div>

            {/* Show Past Courses Toggle */}
            <div className="flex flex-col justify-end">
              <label className="text-sm font-medium text-gray-700 mb-1">Vergangene Kurse</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPastCourses}
                  onChange={(e) => setShowPastCourses(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-blue-500"
                />
                <span className="text-sm text-gray-600">anzeigen</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {(filterStatus !== "all" ||
            filterSport !== "all" ||
            dateFrom ||
            dateTo ||
            showPastCourses) && (
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterSport("all");
                  setDateFrom("");
                  setDateTo("");
                  setShowPastCourses(false);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Filter zurücksetzen
              </Button>
            </div>
          )}
        </div>
      )}

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
          {courses.length === 0 && (
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
                      courseName={course.name}
                      room={roomsMap[course.room] || course.room}
                      time={course.time}
                      currentParticipants={0} // TODO: Implement participant tracking
                      maxParticipants={course.maxParticipants}
                      trainerName={getTrainerName(course.trainers)}
                      status={course.status}
                      isPast={isPastCourse(course.date)}
                      showDeleteIcon={deleteMode}
                      onDelete={() => requestDelete(course.id, course.name)}
                      onEdit={() => router.push(`/courses/edit/${course.id}`)}
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
        onOpenChange={setDeleteDialogOpen}
        courseName={courseToDelete?.name}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CourseListView;
