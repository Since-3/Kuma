import { requireManagerOrPermission, isManager, isEmployee } from "@/src/lib/auth/getUser";
import CourseView from "@/src/modules/courses/ui/views/course-view";

const Course = async () => {
  const userData = await requireManagerOrPermission((p) => p.courses.view);
  const canCreate =
    isManager(userData) || (isEmployee(userData) && userData.permissions.courses.create);
  const canEdit =
    isManager(userData) || (isEmployee(userData) && userData.permissions.courses.edit);
  const canDelete =
    isManager(userData) || (isEmployee(userData) && userData.permissions.courses.delete);
  return <CourseView canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />;
};

export default Course;
