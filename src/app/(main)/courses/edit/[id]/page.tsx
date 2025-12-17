import { requireManager } from "@/src/lib/auth/getUser";
import CourseEditView from "@/src/modules/courses/ui/views/course-edit-view";

const CourseEdit = async ({ params }: { params: Promise<{ id: string }> }) => {
  await requireManager();
  const { id } = await params;
  return <CourseEditView courseId={id} />;
};

export default CourseEdit;
