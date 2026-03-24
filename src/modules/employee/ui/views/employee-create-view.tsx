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

const PERMISSION_GROUPS = [
  { key: "employees" as const, label: "Mitarbeiter" },
  { key: "courses" as const, label: "Kurse" },
  { key: "rooms" as const, label: "Räume" },
];

const PERMISSION_ACTIONS = [
  { key: "view" as const, label: "Ansehen" },
  { key: "create" as const, label: "Erstellen" },
  { key: "edit" as const, label: "Bearbeiten" },
  { key: "delete" as const, label: "Löschen" },
];

type PermissionsState = {
  employees: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  courses: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  rooms: { view: boolean; create: boolean; edit: boolean; delete: boolean };
};

type CallerPermissions = {
  employees: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  courses: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  rooms: { view: boolean; create: boolean; edit: boolean; delete: boolean };
} | null;

interface EmployeeCreateViewProps {
  customRoles: Array<{ value: string; label: string }>;
  callerPermissions: CallerPermissions;
}

const EmployeeCreateView = ({ customRoles, callerPermissions }: EmployeeCreateViewProps) => {
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
  const [permissionsState, setPermissionsState] = useState<PermissionsState>({
    employees: { view: false, create: false, edit: false, delete: false },
    courses: { view: false, create: false, edit: false, delete: false },
    rooms: { view: false, create: false, edit: false, delete: false },
  });
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

  const handlePermissionChange = (
    resource: keyof PermissionsState,
    action: "view" | "create" | "edit" | "delete",
    value: boolean
  ) => {
    setPermissionsState((prev) => {
      const updated = { ...prev, [resource]: { ...prev[resource], [action]: value } };
      // Andere Aktionen erfordern view
      if (action !== "view" && value) {
        updated[resource] = { ...updated[resource], view: true };
      }
      // view deaktivieren → alles deaktivieren
      if (action === "view" && !value) {
        updated[resource] = { view: false, create: false, edit: false, delete: false };
      }
      return updated;
    });
  };

  const buildData = () => ({
    email: employeeMail,
    roles: selectedRoles,
    isMultipleLocation,
    locations: isMultipleLocation ? selectedLocations : [],
    permissions: permissionsState,
  });

  const handlePublish = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await createEmployee(buildData(), "published");
      if (result.success) {
        toast.success(result.message);
        router.push("/employee");
      } else {
        toast.error(result.error || "Ein Fehler ist aufgetreten");
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await createEmployee(buildData(), "draft");
      if (result.success) {
        toast.success(result.message);
        router.push("/employee");
      } else {
        toast.error(result.error || "Ein Fehler ist aufgetreten");
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            labelButton="Neue Rolle anlegen"
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
          <Label className="p-1 mb-3 text-blue text-lg font-semibold">Administrationsrechte</Label>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-4">
            <Checkbox
              id="all-permissions"
              className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
              checked={PERMISSION_GROUPS.every((g) =>
                PERMISSION_ACTIONS.every((a) => {
                  if (callerPermissions && !callerPermissions[g.key][a.key]) return true;
                  return permissionsState[g.key][a.key];
                })
              )}
              onCheckedChange={(checked) => {
                const value = checked === true;
                setPermissionsState({
                  employees: {
                    view: value && (callerPermissions ? callerPermissions.employees.view : true),
                    create:
                      value && (callerPermissions ? callerPermissions.employees.create : true),
                    edit: value && (callerPermissions ? callerPermissions.employees.edit : true),
                    delete:
                      value && (callerPermissions ? callerPermissions.employees.delete : true),
                  },
                  courses: {
                    view: value && (callerPermissions ? callerPermissions.courses.view : true),
                    create: value && (callerPermissions ? callerPermissions.courses.create : true),
                    edit: value && (callerPermissions ? callerPermissions.courses.edit : true),
                    delete: value && (callerPermissions ? callerPermissions.courses.delete : true),
                  },
                  rooms: {
                    view: value && (callerPermissions ? callerPermissions.rooms.view : true),
                    create: value && (callerPermissions ? callerPermissions.rooms.create : true),
                    edit: value && (callerPermissions ? callerPermissions.rooms.edit : true),
                    delete: value && (callerPermissions ? callerPermissions.rooms.delete : true),
                  },
                });
              }}
            />
            <Label htmlFor="all-permissions" className="cursor-pointer text-blue font-semibold">
              Alle Berechtigungen
            </Label>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.key}>
                <p className="text-sm font-semibold text-gray-700 mb-2">{group.label}</p>
                <div className="grid grid-cols-4 gap-2">
                  {PERMISSION_ACTIONS.map((action) => {
                    const id = `${group.key}-${action.key}`;
                    const callerHas =
                      callerPermissions === null || callerPermissions[group.key][action.key];
                    return (
                      <div key={id} className="grid grid-cols-[auto_1fr] items-center gap-2">
                        <Checkbox
                          id={id}
                          className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
                          checked={permissionsState[group.key][action.key]}
                          disabled={!callerHas}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(group.key, action.key, checked === true)
                          }
                        />
                        <Label
                          htmlFor={id}
                          className={`text-blue text-sm ${callerHas ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}
                        >
                          {action.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
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
