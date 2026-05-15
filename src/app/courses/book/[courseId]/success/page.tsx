import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CourseBookingSuccessPage({ params }: SuccessPageProps) {
  const { courseId } = await params;

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

        <p className="text-sm text-gray-500 mb-8">
          Ihre Buchung wird gerade verarbeitet. Falls Sie den Kurs nicht in Ihrer Übersicht sehen,
          warten Sie bitte einen Moment und laden die Seite neu.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/courses/myCourses">
            <Button className="w-full sm:w-auto">Meine Kurse ansehen</Button>
          </Link>
          <Link href={`/courses/book/${courseId}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              Zurück zum Kurs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
