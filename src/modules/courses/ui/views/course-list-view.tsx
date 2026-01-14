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
import CourseFilter from "../components/CourseFilter";

type Course = {
  id: string;
  name: string;
  sport: string;
  date: Date;
  timeFrom: string;
  timeTo: string;
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
  _count?: {
    bookings: number;
  };
};

const CourseListView = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterTrainer, setFilterTrainer] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
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

  // Get unique trainers for filter (flatten trainers arrays)
  const uniqueTrainers = Array.from(new Set(courses.flatMap((c) => c.trainers)));

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
    !!dateFrom,
    !!dateTo,
    !!timeFrom,
    !!timeTo,
  ].filter(Boolean).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex w-full justify-end mr-2 gap-2">
          <CourseFilter
            filterStatus={filterStatus}
            filterSport={filterSport}
            filterTrainer={filterTrainer}
            filterRoom={filterRoom}
            dateFrom={dateFrom}
            dateTo={dateTo}
            timeFrom={timeFrom}
            timeTo={timeTo}
            uniqueSports={uniqueSports}
            uniqueTrainers={uniqueTrainers}
            uniqueRooms={uniqueRooms}
            setFilterStatus={setFilterStatus}
            setFilterSport={setFilterSport}
            setFilterTrainer={setFilterTrainer}
            setFilterRoom={setFilterRoom}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            setTimeFrom={setTimeFrom}
            setTimeTo={setTimeTo}
            onReset={() => {
              setFilterStatus("all");
              setFilterSport("all");
              setFilterTrainer("all");
              setFilterRoom("all");
              setDateFrom("");
              setDateTo("");
              setTimeFrom("");
              setTimeTo("");
            }}
          >
            <Button variant="outline" className="flex items-center gap-2 relative">
              <Filter size={18} />
              Filter
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow text-blue text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </CourseFilter>
          <Button
            variant={deleteMode ? "destructive" : "outline"}
            onClick={() => setDeleteMode(!deleteMode)}
            className="flex items-center gap-2"
          >
            {deleteMode ? "Abbrechen" : "Kurs löschen"}
          </Button>
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
                      courseId={course.id}
                      courseName={course.name}
                      room={roomsMap[course.room] || course.room}
                      timeFrom={course.timeFrom}
                      timeTo={course.timeTo}
                      currentParticipants={course._count?.bookings || 0}
                      maxParticipants={course.maxParticipants}
                      trainers={course.trainers}
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
        itemName={courseToDelete?.name}
        topicName="Kurs"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CourseListView;
