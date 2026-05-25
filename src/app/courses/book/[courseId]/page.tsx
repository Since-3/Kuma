import { getCourseSummaryForConfirmation } from "@/src/modules/courses/actions/booking-actions";
import { notFound, redirect } from "next/navigation";

interface CourseBookingPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

/**
 * Die alte direkte Buchungs-View ist abgelöst – gebucht wird nur noch über die
 * öffentliche Business-Seite. Alte (geteilte) Links werden hierher geleitet und
 * auf die öffentliche Seite des zugehörigen Business weitergeleitet.
 */
export default async function CourseBookingPage({ params }: CourseBookingPageProps) {
  const { courseId } = await params;
  const result = await getCourseSummaryForConfirmation(courseId);

  if (!result.success || !result.course.business?.slug) {
    notFound();
  }

  redirect(`/business/${result.course.business.slug}?course=${courseId}`);
}
