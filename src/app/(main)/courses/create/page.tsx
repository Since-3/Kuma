import { requireManager } from "@/src/lib/auth/getUser";
import CourseCreateView from "@/src/modules/courses/ui/views/course-create-view";
import { getMySportTypes } from "@/src/modules/courses/actions/course-actions";

const CourseCreate = async () => {
  await requireManager();

  const sportsResult = await getMySportTypes();
  const customSports = sportsResult.success ? sportsResult.sports : [];

  return <CourseCreateView customSports={customSports} />;
};

export default CourseCreate;
