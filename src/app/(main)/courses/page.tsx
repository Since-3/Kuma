import { requireManager } from "@/src/lib/auth/getUser";
import CourseView from "@/src/modules/courses/ui/views/course-view";

const Course = async () => {
  await requireManager();
  return <CourseView />;
};

export default Course;
