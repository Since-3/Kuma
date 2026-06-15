"use client";

import { type ReactNode, useState, useTransition } from "react";
import InputComponent from "@/src/components/layout/InputComponent";
import { Button } from "@/src/components/ui/button";
import { updateBusinessInfo } from "../../actions/business-settings-actions";
import { updateProfileInfo } from "../../actions/personal-settings-actions";
import { toast } from "sonner";

export type BusinessSettingsFormProps = {
  businessId: string;
  name: string;
  address: string;
  email: string;
  title: string;
  ustId: string | null;
  banking: string | null;
  managerTel: string | null;
};

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const BusinessSettingsForm = ({
  businessId,
  name,
  address: initialAddress,
  email: initialEmail,
  title: initialTitle,
  ustId: initialUstId,
  banking: initialBanking,
  managerTel: initialTel,
}: BusinessSettingsFormProps) => {
  const [pending, startTransition] = useTransition();

  const [address, setAddress] = useState(initialAddress);
  const [email, setEmail] = useState(initialEmail);
  const [title, setTitle] = useState(initialTitle);
  const [ustId, setUstId] = useState(initialUstId ?? "");
  const [banking, setBanking] = useState(initialBanking ?? "");
  const [tel, setTel] = useState(initialTel ?? "");

  const handleBusinessSave = () => {
    startTransition(async () => {
      try {
        const result = await updateBusinessInfo({
          businessId,
          address,
          email,
          title,
          ustId,
          banking,
        });
        if (result.success) {
          toast.success("Business-Daten erfolgreich gespeichert.");
        } else {
          toast.error(result.error ?? "Fehler beim Speichern.");
        }
      } catch {
        toast.error("Fehler beim Speichern.");
      }
    });
  };

  const handleTelSave = () => {
    startTransition(async () => {
      try {
        const result = await updateProfileInfo({ tel });
        if (result.success) {
          toast.success("Geschäftsnummer erfolgreich gespeichert.");
        } else {
          toast.error(result.error ?? "Fehler beim Speichern.");
        }
      } catch {
        toast.error("Fehler beim Speichern.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Read-only Unternehmensname */}
      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
          Unternehmensname
        </p>
        <p className="text-xl font-bold text-gray-900">{name}</p>
        <p className="text-xs text-gray-400 mt-1">
          Der Unternehmensname kann nach der Registrierung nicht mehr geändert werden.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Allgemeine Informationen" subtitle="Titel und Adresse deines Unternehmens">
          <div className="space-y-4">
            <InputComponent
              label="Titel / Kurzname"
              type="text"
              id="businessTitle"
              isLabel
              placeholder="Kurzbezeichnung"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <InputComponent
              label="Adresse"
              type="text"
              id="businessAddress"
              isLabel
              placeholder="Musterstraße 1, 12345 Musterstadt"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="pt-1">
            <Button onClick={handleBusinessSave} disabled={pending} size="sm" className="w-fit">
              Speichern
            </Button>
          </div>
        </Card>

        <Card title="Kontakt & Rechtliches" subtitle="E-Mail, USt-IdNr. und Bankverbindung">
          <div className="space-y-4">
            <InputComponent
              label="Geschäfts-E-Mail"
              type="email"
              id="businessEmail"
              isLabel
              placeholder="info@unternehmen.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputComponent
              label="USt-IdNr. (optional)"
              type="text"
              id="businessUstId"
              isLabel
              placeholder="DE123456789"
              value={ustId}
              onChange={(e) => setUstId(e.target.value)}
            />
            <InputComponent
              label="Bankverbindung (optional)"
              type="text"
              id="businessBanking"
              isLabel
              placeholder="IBAN / Kontoinhaber"
              value={banking}
              onChange={(e) => setBanking(e.target.value)}
            />
          </div>
          <div className="pt-1">
            <Button onClick={handleBusinessSave} disabled={pending} size="sm" className="w-fit">
              Speichern
            </Button>
          </div>
        </Card>

        <Card title="Geschäftsnummer" subtitle="Telefonnummer des Unternehmens">
          <InputComponent
            label="Telefonnummer"
            type="tel"
            id="managerTel"
            isLabel
            placeholder="+49 000 000000"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
          />
          <div className="pt-1">
            <Button
              onClick={handleTelSave}
              disabled={pending || tel === (initialTel ?? "")}
              size="sm"
              className="w-fit"
            >
              Speichern
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSettingsForm;
