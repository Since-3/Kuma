import { requireGuest } from "@/src/lib/auth/getUser";
import LoginView from "@/src/modules/auth/ui/views/login-view";

export default async function LoginPage() {
  await requireGuest();
  return <LoginView />;
}
