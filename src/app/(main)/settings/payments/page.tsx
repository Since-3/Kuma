import { Suspense } from "react";
import { requireManager } from "@/src/lib/auth/getUser";
import { getBusinessesWithStripeStatus } from "@/src/modules/settings/actions/stripe-connect-actions";
import SettingsPaymentsView from "@/src/modules/settings/ui/views/settings-payments-view";
import SettingsLoading from "../loading";

export default async function SettingsPaymentsPage() {
  await requireManager();
  const result = await getBusinessesWithStripeStatus();
  const businesses = result.success ? result.businesses : [];

  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPaymentsView businesses={businesses} />
    </Suspense>
  );
}
