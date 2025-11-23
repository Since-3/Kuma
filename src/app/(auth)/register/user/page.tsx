import RegisterUserView from "@/src/modules/auth/ui/views/register-user-view";
import { requireGuest } from "@/src/lib/auth/getUser";

export default async function RegisterUser() {
  await requireGuest();
  return <RegisterUserView />;
}
