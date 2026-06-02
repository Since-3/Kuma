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
  const bookings = result.success ? result.bookings : [];

  return <MeineKurseView bookings={bookings} />;
};

export default MeineKursePage;
