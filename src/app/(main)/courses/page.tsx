import { requireManagerOrPermission } from "@/src/lib/auth/getUser";
import CourseView from "@/src/modules/courses/ui/views/course-view";

const Course = async () => {
  await requireManagerOrPermission("canCreateCourses");
  return <CourseView />;
};

export default Course;
