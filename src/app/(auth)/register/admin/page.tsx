import { requireGuest } from "@/src/lib/auth/getUser";
import RegisterAdminView from "@/src/modules/auth/ui/views/register-admin-view";

export default async function RegisterAdmin() {
  await requireGuest();
  return <RegisterAdminView />;
}
