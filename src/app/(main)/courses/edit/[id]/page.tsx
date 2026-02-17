import { requireManager } from "@/src/lib/auth/getUser";
import CourseEditView from "@/src/modules/courses/ui/views/course-edit-view";
import { getMySportTypes } from "@/src/modules/courses/actions/course-actions";

const CourseEdit = async ({ params }: { params: Promise<{ id: string }> }) => {
  await requireManager();
  const { id } = await params;

  const sportsResult = await getMySportTypes();
  const customSports = sportsResult.success ? sportsResult.sports : [];

  return <CourseEditView courseId={id} customSports={customSports} />;
};

export default CourseEdit;
