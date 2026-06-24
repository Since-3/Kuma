import { Suspense } from "react";
import { requireManagerOrPermission, isManager, isEmployee } from "@/src/lib/auth/getUser";
import { getMyCourses } from "@/src/modules/courses/actions/course-actions";
import { getMyRooms } from "@/src/modules/rooms/actions/room-actions";
import { getMyTrainers } from "@/src/modules/employee/actions/employee-actions";
import CourseView from "@/src/modules/courses/ui/views/course-view";
import CoursesLoading from "./loading";

const Course = async () => {
  const userData = await requireManagerOrPermission((p) => p.courses.view);
  const canCreate =
    isManager(userData) || (isEmployee(userData) && userData.permissions.courses.create);
  const canEdit =
    isManager(userData) || (isEmployee(userData) && userData.permissions.courses.edit);
  const canDelete =
    isManager(userData) || (isEmployee(userData) && userData.permissions.courses.delete);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const sixWeeksLater = new Date(today);
  sixWeeksLater.setDate(today.getDate() + 42);

  const [coursesResult, roomsResult, trainersResult] = await Promise.all([
    getMyCourses({ dateFrom: twoWeeksAgo, dateTo: sixWeeksLater }),
    getMyRooms(),
    getMyTrainers(),
  ]);

  const initialCourses = coursesResult.success ? coursesResult.courses : [];

  const roomsMap: Record<string, string> = {};
  if (roomsResult.success) {
    roomsResult.rooms.forEach((r) => {
      roomsMap[r.id] = r.name;
    });
  }

  const trainersMap: Record<string, { label: string; pbSrc?: string }> = {};
  if (trainersResult.success) {
    trainersResult.trainers.forEach((t) => {
      trainersMap[t.value] = { label: t.label, pbSrc: t.pbSrc ?? undefined };
    });
  }

  return (
    <Suspense fallback={<CoursesLoading />}>
      <CourseView
        initialCourses={initialCourses}
        initialDateFrom={twoWeeksAgo}
        initialDateTo={sixWeeksLater}
        roomsMap={roomsMap}
        trainersMap={trainersMap}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </Suspense>
  );
};

export default Course;
