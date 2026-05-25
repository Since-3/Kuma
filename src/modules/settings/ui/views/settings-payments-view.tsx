"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  createConnectOnboardingLink,
  createStripeExpressDashboardLink,
  getBusinessesWithStripeStatus,
} from "@/src/modules/settings/actions/stripe-connect-actions";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, CreditCard, ExternalLink, Loader2 } from "lucide-react";

type BusinessWithStatus = {
  id: string;
  name: string;
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
};

const SettingsPaymentsView = () => {
  const [businesses, setBusinesses] = useState<BusinessWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      setIsLoading(true);
      try {
        const result = await getBusinessesWithStripeStatus();
        if (result.success) {
          setBusinesses(result.businesses);
        } else {
          toast.error(result.error || "Fehler beim Laden");
        }
      } catch {
        toast.error("Fehler beim Laden");
      } finally {
        setIsLoading(false);
      }
    };
    void loadBusinesses();
  }, []);

  const handleConnect = async (businessId: string) => {
    setPendingId(businessId);
    try {
      const result = await createConnectOnboardingLink(businessId);
      if (result.success && result.url) {
        window.location.assign(result.url);
        return;
      }
      toast.error(result.error || "Fehler beim Verbinden");
    } catch {
      toast.error("Fehler beim Verbinden");
    } finally {
      setPendingId(null);
    }
  };

  const handleOpenDashboard = async (businessId: string) => {
    setPendingId(businessId);
    try {
      const result = await createStripeExpressDashboardLink(businessId);
      if (result.success && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(result.error || "Fehler beim Öffnen des Dashboards");
      }
    } catch {
      toast.error("Fehler beim Öffnen des Dashboards");
    } finally {
      setPendingId(null);
    }
  };

  const renderStatusBadge = (status: string | null) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
          <CheckCircle2 size={12} />
          Aktiv - bereit für Zahlungen
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
          <AlertCircle size={12} />
          Onboarding nicht abgeschlossen
        </span>
      );
    }
    if (status === "restricted") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-md">
          <AlertCircle size={12} />
          Eingeschränkt - bitte prüfen
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
        Nicht verbunden
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl flex items-center gap-2 font-bold">
          <CreditCard /> Zahlungen
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Verbinde dein Stripe-Konto, damit deine Kunden für Kurse bezahlen können. Stripe übernimmt
          die sichere Zahlungsabwicklung und zahlt das Geld direkt an dich aus.
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-6 bg-white text-center">
          <p className="text-sm text-gray-500">Du hast noch keine Businesses angelegt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map((business) => {
            const isConnected = business.stripeAccountId !== null;
            const isActive = business.stripeAccountStatus === "active";
            const isPending = pendingId === business.id;

            return (
              <div
                key={business.id}
                className="border border-gray-200 rounded-xl p-5 bg-white space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{business.name}</p>
                    <div className="mt-2">{renderStatusBadge(business.stripeAccountStatus)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {!isConnected || !isActive ? (
                    <Button
                      onClick={() => handleConnect(business.id)}
                      disabled={isPending}
                      size="sm"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Weiterleitung...
                        </>
                      ) : isConnected ? (
                        "Onboarding fortsetzen"
                      ) : (
                        "Stripe-Konto verbinden"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDashboard(business.id)}
                      disabled={isPending}
                      size="sm"
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          Stripe Dashboard öffnen
                          <ExternalLink size={14} />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 text-xs text-gray-600">
        <p className="font-medium text-gray-900 mb-1">So funktioniert es:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Klicke auf &quot;Stripe-Konto verbinden&quot; - du wirst zu Stripe weitergeleitet</li>
          <li>Gib deine Geschäftsdaten und Bankverbindung bei Stripe ein</li>
          <li>Nach Abschluss kannst du Zahlungen aus Kurs-Buchungen empfangen</li>
          <li>Auszahlungen erfolgen automatisch auf dein hinterlegtes Bankkonto</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPaymentsView;
