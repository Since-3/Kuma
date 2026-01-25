"use client";

import InputComponent from "@/src/components/layout/InputComponent";
import MultiSelectDropdown from "@/src/components/layout/MultiSelectDropdown";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEmployee } from "../../actions/employee-actions";
import { toast } from "sonner";

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

interface EmployeeCreateViewProps {
  customRoles: Array<{ value: string; label: string }>;
}

const EmployeeCreateView = ({ customRoles }: EmployeeCreateViewProps) => {
  const router = useRouter();
  const [employeeMail, setEmplyoeeMail] = useState("");
  const [isMultipleLocation, setIsMultipleLocation] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Kombiniere Standard-Rollen mit custom Rollen (ohne Duplikate)
  const allRoleValues = new Set([
    ...INITIAL_ROLES.map((r) => r.value),
    ...customRoles.map((r) => r.value),
  ]);
  const combinedRoles = Array.from(allRoleValues).map((value) => {
    const customRole = customRoles.find((r) => r.value === value);
    const initialRole = INITIAL_ROLES.find((r) => r.value === value);
    return customRole || initialRole || { value, label: value };
  });

  const [roles, setRoles] = useState(combinedRoles);
  const [newlyCreatedRoles, setNewlyCreatedRoles] = useState<string[]>([]);
  const [isPermissionCourseCreation, setIsPermissionCourseCreation] = useState(false);
  const [isPermissionEmplyoeeCreation, setIsPermissionEmplyoeeCreation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleCreateRole = (newRole: { value: string; label: string }) => {
    setRoles([...roles, newRole]);
    setNewlyCreatedRoles([...newlyCreatedRoles, newRole.value]);
  };

  const handleDeleteRole = (valueToDelete: string) => {
    setRoles(roles.filter((role) => role.value !== valueToDelete));
    setNewlyCreatedRoles(newlyCreatedRoles.filter((v) => v !== valueToDelete));
    setSelectedRoles(selectedRoles.filter((v) => v !== valueToDelete));
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setErrors({});

    const data = {
      email: employeeMail,
      roles: selectedRoles,
      isMultipleLocation,
      locations: isMultipleLocation ? selectedLocations : [],
      permissions: {
        canCreateCourses: isPermissionCourseCreation,
        canCreateEmployees: isPermissionEmplyoeeCreation,
      },
    };

    const result = await createEmployee(data, "published");

    if (result.success) {
      toast.success(result.message);
      router.push("/employee");
    } else {
      toast.error(result.error || "Ein Fehler ist aufgetreten");
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }
    }

    setIsSubmitting(false);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setErrors({});

    const data = {
      email: employeeMail,
      roles: selectedRoles,
      isMultipleLocation,
      locations: isMultipleLocation ? selectedLocations : [],
      permissions: {
        canCreateCourses: isPermissionCourseCreation,
        canCreateEmployees: isPermissionEmplyoeeCreation,
      },
    };

    const result = await createEmployee(data, "draft");

    if (result.success) {
      toast.success(result.message);
      router.push("/employee");
    } else {
      toast.error(result.error || "Ein Fehler ist aufgetreten");
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }
    }

    setIsSubmitting(false);
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
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
        </div>

        <div>
          <MultiSelectDropdown
            label="Welche Rollen hat der Mitarbeiter?"
            selected={selectedRoles}
            onSelect={setSelectedRoles}
            options={roles}
            allowCreate={true}
            onCreateOption={handleCreateRole}
            onDeleteOption={handleDeleteRole}
            deletableValues={newlyCreatedRoles}
          />
          {errors.roles && <p className="text-red-500 text-sm mt-1">{errors.roles[0]}</p>}
        </div>

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
          <div>
            <MultiSelectDropdown
              label="An welchen Standorten ist der Trainer aktiv?"
              selected={selectedLocations}
              onSelect={setSelectedLocations}
              options={LOCATION}
            />
            {errors.locations && <p className="text-red-500 text-sm mt-1">{errors.locations[0]}</p>}
          </div>
        )}

        <div>
          <Label className="p-1 mb-2 text-blue text-lg font-semibold">
            Welche Administrationsrechte soll der Mitarbeiter erhalten
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
          <Button onClick={handlePublish} disabled={isSubmitting}>
            {isSubmitting ? "Wird veröffentlicht..." : "Veröffentlichen"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/employee")}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="mt-6 w-fit cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Wird gespeichert..." : "Entwurf speichern"}
        </button>
      </div>
    </div>
  );
};

export default EmployeeCreateView;
