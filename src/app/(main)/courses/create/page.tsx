import { requireManager } from "@/src/lib/auth/getUser";
import CourseCreateView from "@/src/modules/courses/ui/views/course-create-view";

const CourseCreate = async () => {
  await requireManager();
  return <CourseCreateView />;
};

export default CourseCreate;
