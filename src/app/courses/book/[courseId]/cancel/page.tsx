import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { XCircle } from "lucide-react";

interface CancelPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseBookingCancelPage({ params }: CancelPageProps) {
  const { courseId } = await params;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-50 rounded-full p-4">
            <XCircle className="text-amber-600" size={48} />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Buchung abgebrochen</h1>
        <p className="text-gray-600 mb-6">
          Die Zahlung wurde abgebrochen. Es wurde nichts berechnet.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/courses/book/${courseId}`}>
            <Button className="w-full sm:w-auto">Erneut versuchen</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
