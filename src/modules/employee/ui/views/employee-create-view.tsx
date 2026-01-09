"use client";

import InputComponent from "@/src/components/layout/InputComponent";
import MultiSelectDropdown from "@/src/components/layout/MultiSelectDropdown";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LOCATION = [
  { value: "hainburg", label: "Hainburg" },
  { value: "steinfurt", label: "Steinfurt" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "muenster", label: "Münster" },
];

const INITIAL_ROLES = [
  { value: "trainer", label: "Trainer" },
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
];

const EmployeeCreateView = () => {
  const router = useRouter();
  const [employeeMail, setEmplyoeeMail] = useState("");
  const [isMultipleLocation, setIsMultipleLocation] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [isPermissionCourseCreation, setIsPermissionCourseCreation] = useState(false);
  const [isPermissionEmplyoeeCreation, setIsPermissionEmplyoeeCreation] = useState(false);

  const handleCreateRole = (newRole: { value: string; label: string }) => {
    setRoles([...roles, newRole]);
  };

  const permissions = [
    {
      id: "course-creation",
      label: "Kurs anlegen",
      value: isPermissionCourseCreation,
      setValue: setIsPermissionCourseCreation,
    },
    {
      id: "employee-creation",
      label: "Trainer anlegen",
      value: isPermissionEmplyoeeCreation,
      setValue: setIsPermissionEmplyoeeCreation,
    },
  ];
  return (
    <div>
      <h1 className="text-3xl font-bold">Mitarbeiter anlegen</h1>
      <p className="text-xl mt-2">
        Alle Daten können nach dem Speichern geändert oder gelöscht werden.
      </p>
      <div className="mt-6 flex flex-col gap-4 max-w-xl">
        <div>
          <InputComponent
            isLabel
            label="E-Mail"
            type="email"
            id="employee-create-email"
            placeholder="max.mustermann@gmx.com"
            value={employeeMail}
            onChange={(e) => setEmplyoeeMail(e.target.value)}
          />
        </div>

        <MultiSelectDropdown
          label="Welche Rollen hat der Mitarbeiter?"
          selected={selectedRoles}
          onSelect={setSelectedRoles}
          options={roles}
          allowCreate={true}
          onCreateOption={handleCreateRole}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="employee-creating-multiple-location"
            className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
            checked={isMultipleLocation}
            onCheckedChange={(checked) => {
              setIsMultipleLocation(checked === true);
            }}
          />
          <Label
            htmlFor="employee-creating-multiple-location"
            className="cursor-pointer text-lg mt-2"
          >
            Für mehrere Standorte anlegen
          </Label>
        </div>

        {isMultipleLocation && (
          <>
            <MultiSelectDropdown
              label="An welchen Standorten ist der Trainer aktiv?"
              selected={selectedLocations}
              onSelect={setSelectedLocations}
              options={LOCATION}
            />
          </>
        )}

        <div>
          <Label className="p-1 mb-2 text-blue text-lg font-semibold">
            Welche Administrationsrechte soll der Trainer erhalten
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {permissions.map((p) => (
              <div key={p.id} className="grid grid-cols-[auto_1fr] items-center gap-3">
                <Checkbox
                  id={p.id}
                  className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
                  checked={p.value}
                  onCheckedChange={(checked) => p.setValue(checked === true)}
                />
                <Label htmlFor={p.id} className="cursor-pointer text-blue">
                  {p.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button>Veröffentlichen</Button>
          <Button variant="outline" onClick={() => router.push("/employee")}>
            Abbrechen
          </Button>
        </div>
        <button className="mt-6 w-fit cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
          Entwurf speichern
        </button>
      </div>
    </div>
  );
};

export default EmployeeCreateView;
