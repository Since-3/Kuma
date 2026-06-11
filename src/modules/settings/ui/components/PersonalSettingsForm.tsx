"use client";

import { useState, useTransition } from "react";
import ImageUploadComponent from "@/src/components/layout/ImageUploadComponent";
import InputComponent from "@/src/components/layout/InputComponent";
import DropdownComponent from "@/src/components/layout/DropdownComponent";
import AddressAutocompleteComponent, {
  ParsedAddress,
} from "@/src/components/layout/AddressAutocompleteComponent";
import { Button } from "@/src/components/ui/button";
import {
  updateProfileInfo,
  updateAddress,
  updateEmail,
  updatePassword,
  updateAvatar,
} from "../../actions/personal-settings-actions";
import { toast } from "sonner";

export type PersonalSettingsProps = {
  role: "user" | "manager" | "employee";
  id: string;
  email: string;
  pbSrc: string | null;
  firstName?: string | null;
  lastName?: string | null;
  tel?: string | null;
  name?: string | null;
  gender?: string | null;
  street?: string | null;
  plz?: string | null;
  city?: string | null;
};

// ── Shared card shell ────────────────────────────────────────────────────────
function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
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

// ── Main component ───────────────────────────────────────────────────────────
const PersonalSettingsForm = ({
  role,
  email: initialEmail,
  pbSrc,
  firstName: initialFirstName,
  lastName: initialLastName,
  tel: initialTel,
  name: initialName,
  gender: initialGender,
  street: initialStreet,
  plz: initialPlz,
  city: initialCity,
}: PersonalSettingsProps) => {
  const [pending, startTransition] = useTransition();

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(pbSrc);

  // Profile info
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [tel, setTel] = useState(initialTel ?? "");
  const [gender, setGender] = useState(initialGender ?? "");

  // Address
  const [street, setStreet] = useState(initialStreet ?? "");
  const [plz, setPlz] = useState(initialPlz ?? "");
  const [city, setCity] = useState(initialCity ?? "");

  // Email
  const [email, setEmail] = useState(initialEmail);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAvatarSave = () => {
    if (!avatarFile) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const result = await updateAvatar(fd);
      if (result.success) {
        toast.success("Profilbild erfolgreich gespeichert.");
        setAvatarFile(null);
      } else {
        toast.error(result.error ?? "Fehler beim Hochladen.");
      }
    });
  };

  const handleProfileSave = () => {
    startTransition(async () => {
      const result = await updateProfileInfo({ firstName, lastName, name, tel, gender });
      if (result.success) {
        toast.success("Profildaten erfolgreich gespeichert.");
      } else {
        toast.error(result.error ?? "Fehler beim Speichern.");
      }
    });
  };

  const handleAddressSave = () => {
    startTransition(async () => {
      const result = await updateAddress({ street, plz, city });
      if (result.success) {
        toast.success("Adresse erfolgreich gespeichert.");
      } else {
        toast.error(result.error ?? "Fehler beim Speichern.");
      }
    });
  };

  const handleEmailSave = () => {
    startTransition(async () => {
      const result = await updateEmail(email);
      if (result.success) {
        toast.success("Bestätigungslink wurde an deine neue E-Mail-Adresse gesendet.");
      } else {
        toast.error(result.error ?? "Fehler beim Speichern.");
      }
    });
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success("Passwort erfolgreich geändert.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error ?? "Fehler beim Speichern.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Hero: Profilbild ─────────────────────────────────────────────
          Full-width card with centred avatar, accent gradient like dashboard */}
      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,oklch(0.88_0.09_85/_0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Profilbild
          </p>
          <ImageUploadComponent
            value={avatarFile}
            preview={avatarPreview}
            onChange={(file, preview) => {
              setAvatarFile(file);
              setAvatarPreview(preview);
            }}
          />
          <Button
            onClick={handleAvatarSave}
            disabled={!avatarFile || pending}
            size="sm"
            variant="outline"
            className="bg-white/60 border-white/60 backdrop-blur-sm"
          >
            Profilbild speichern
          </Button>
        </div>
      </div>

      {/* ── 2-column grid on lg+, single column on mobile ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Persönliche Daten ───────────────────────────────────────── */}
        <Card title="Persönliche Daten" subtitle="Vor- und Nachname, Telefon, Geschlecht">
          <div className="space-y-4">
            {role === "user" ? (
              <InputComponent
                label="Name"
                type="text"
                id="name"
                isLabel
                placeholder="Vollständiger Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <InputComponent
                  label="Vorname"
                  type="text"
                  id="firstName"
                  isLabel
                  placeholder="Vorname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <InputComponent
                  label="Nachname"
                  type="text"
                  id="lastName"
                  isLabel
                  placeholder="Nachname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            )}

            {(role === "user" || role === "manager") && (
              <InputComponent
                label="Telefonnummer"
                type="tel"
                id="tel"
                isLabel
                placeholder="+49 000 000000"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
              />
            )}

            {role === "user" && (
              <DropdownComponent label="Geschlecht" selected={gender} onSelect={setGender} />
            )}
          </div>

          <div className="pt-1">
            <Button onClick={handleProfileSave} disabled={pending} size="sm" className="w-fit">
              Speichern
            </Button>
          </div>
        </Card>

        {/* ── E-Mail ──────────────────────────────────────────────────── */}
        <Card title="E-Mail-Adresse" subtitle="Änderungen erfordern eine Bestätigung per E-Mail">
          <InputComponent
            label="E-Mail"
            type="email"
            id="email"
            isLabel
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="pt-1">
            <Button
              onClick={handleEmailSave}
              disabled={pending || email === initialEmail}
              size="sm"
              className="w-fit"
            >
              Speichern
            </Button>
          </div>
        </Card>

        {/* ── Adresse (nur reguläre Nutzer) ────────────────────────────
            Spans both columns on large screens so the 3-field layout
            has room to breathe. */}
        {role === "user" && (
          <div className="lg:col-span-2">
            <Card title="Adresse" subtitle="Straße, PLZ und Wohnort">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <AddressAutocompleteComponent
                    streetValue={street}
                    plzValue={plz}
                    placeValue={city}
                    onStreetChange={setStreet}
                    onPlzChange={setPlz}
                    onPlaceChange={setCity}
                    onSelect={(parsed: ParsedAddress) => {
                      setStreet(parsed.street);
                      setPlz(parsed.plz);
                      setCity(parsed.place);
                    }}
                    idPrefix="settings-address"
                  />
                </div>
              </div>
              <div className="pt-1">
                <Button onClick={handleAddressSave} disabled={pending} size="sm" className="w-fit">
                  Speichern
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ── Passwort ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card title="Passwort ändern" subtitle="Mindestens 8 Zeichen">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputComponent
                label="Aktuelles Passwort"
                type="password"
                id="currentPassword"
                isLabel
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <InputComponent
                label="Neues Passwort"
                type="password"
                id="newPassword"
                isLabel
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <InputComponent
                label="Passwort bestätigen"
                type="password"
                id="confirmPassword"
                isLabel
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="pt-1">
              <Button
                onClick={handlePasswordSave}
                disabled={pending || !currentPassword || !newPassword || !confirmPassword}
                size="sm"
                className="w-fit"
              >
                Passwort ändern
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalSettingsForm;
