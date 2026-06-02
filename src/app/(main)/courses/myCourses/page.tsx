import { redirect } from "next/navigation";
import { requireAuthWithData, isUser } from "@/src/lib/auth/getUser";
import { getUserBookings } from "@/src/modules/courses/actions/booking-actions";
import MeineKurseView from "@/src/modules/courses/ui/views/meine-kurse-view";

const MeineKursePage = async () => {
  const userData = await requireAuthWithData();

  if (!isUser(userData)) {
    redirect("/dashboard");
  }

  const result = await getUserBookings();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-5 w-full">
        <h1 className="text-4xl font-bold">Meine Kurse</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 backdrop-blur-sm px-6 py-5 text-sm text-red-700">
          Deine Buchungen konnten nicht geladen werden. Bitte versuche es später erneut.
        </div>
      </div>
    );
  }

  return <MeineKurseView bookings={result.bookings} />;
};

export default MeineKursePage;
