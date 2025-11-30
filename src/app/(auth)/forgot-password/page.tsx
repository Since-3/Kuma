import { requireGuest } from "@/src/lib/auth/getUser";
import ForgotPasswordView from "@/src/modules/auth/ui/views/forgot-password-view";

export default async function ForgotPasswordPage() {
  await requireGuest();
  return <ForgotPasswordView />;
}
