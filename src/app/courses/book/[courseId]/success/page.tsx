import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { getCourseSummaryForConfirmation } from "@/src/modules/courses/actions/booking-actions";
import { CheckCircle2, Calendar, Clock, MapPin } from "lucide-react";

interface SuccessPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CourseBookingSuccessPage({ params }: SuccessPageProps) {
  const { courseId } = await params;
  const result = await getCourseSummaryForConfirmation(courseId);

  const course = result.success ? result.course : null;
  const businessSlug = course?.business?.slug ?? null;

  const formattedDate = course
    ? new Date(course.date).toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedPrice = course
    ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(course.price)
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-50 rounded-full p-4">
            <CheckCircle2 className="text-green-600" size={48} />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Zahlung erfolgreich!</h1>
        <p className="text-gray-600 mb-6">
          Vielen Dank für Ihre Buchung. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
        </p>

        {course && (
          <div className="bg-gray-50 rounded-lg p-5 text-left mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{course.name}</h2>
            {course.business?.name && (
              <p className="text-sm text-gray-500 mb-4">{course.business.name}</p>
            )}

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-gray-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="text-gray-400 shrink-0" />
                <span>
                  {course.timeFrom} – {course.timeTo}
                </span>
              </div>
              {course.business?.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span>{course.business.address}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Bezahlt</span>
              <span className="text-lg font-bold text-gray-900">{formattedPrice}</span>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-8">
          Ihre Buchung wird gerade verarbeitet. Falls Sie den Kurs nicht in Ihrer Übersicht sehen,
          warten Sie bitte einen Moment und laden die Seite neu.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/courses/myCourses">
            <Button className="w-full sm:w-auto">Meine Kurse ansehen</Button>
          </Link>
          {businessSlug && (
            <Link href={`/business/${businessSlug}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                Weitere Kurse ansehen
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
