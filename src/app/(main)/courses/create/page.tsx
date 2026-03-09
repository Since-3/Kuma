import { requireManagerOrPermission } from "@/src/lib/auth/getUser";
import CourseCreateView from "@/src/modules/courses/ui/views/course-create-view";
import { getMySportTypes } from "@/src/modules/courses/actions/course-actions";

const CourseCreate = async () => {
  await requireManagerOrPermission("canCreateCourses");

  const sportsResult = await getMySportTypes();
  const customSports = sportsResult.success ? sportsResult.sports : [];

  return <CourseCreateView customSports={customSports} />;
};

export default CourseCreate;
