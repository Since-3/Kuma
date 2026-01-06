import { getCourseForBooking } from "@/src/modules/courses/actions/booking-actions";
import CourseBookingView from "@/src/modules/courses/ui/views/course-booking-view";
import { notFound } from "next/navigation";

interface CourseBookingPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseBookingPage({ params }: CourseBookingPageProps) {
  const { courseId } = await params;
  const result = await getCourseForBooking(courseId);

  if (!result.success || !result.course) {
    notFound();
  }

  return <CourseBookingView course={result.course} />;
}
