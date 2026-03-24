/**
 * EmployeeListItem - Mitarbeiter-Karten-Komponente
 *
 * Diese Komponente zeigt einen einzelnen Mitarbeiter als Karte an.
 * Sie wird in der Mitarbeiterliste verwendet und zeigt alle wichtigen Mitarbeiterinformationen
 * inklusive Rollen, Standorte, Onboarding-Status und Bearbeitungsoption.
 */

import { Pen, Trash2, Mail, MapPin, Shield, Lock } from "lucide-react";

/**
 * Props für die EmployeeListItem Komponente
 */
interface EmployeeListItemProps {
  employeeId: string; // ID des Mitarbeiters
  employeeName: string; // Name des Mitarbeiters (oder E-Mail wenn Name nicht vorhanden)
  email: string; // E-Mail-Adresse
  roles: string[]; // Rollen des Mitarbeiters
  locations: string[]; // Standorte
  permissions: {
    employees: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    courses: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    rooms: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  } | null; // Administrationsrechte
  status: string; // Status ("draft" oder "published")
  isOnboarded: boolean; // Ob der Mitarbeiter das Onboarding abgeschlossen hat
  onEdit?: () => void; // Callback-Funktion beim Klick auf Bearbeiten-Button
  onDelete?: () => void; // Callback-Funktion beim Klick auf Löschen-Button
  showDeleteIcon?: boolean; // Ob das Löschen-Icon angezeigt werden soll
}

/**
 * Mitarbeiter-Karten-Komponente
 * Zeigt Mitarbeiterinformationen in einem visuell ansprechenden Karten-Layout
 */
const EmployeeListItem: React.FC<EmployeeListItemProps> = ({
  employeeName,
  email,
  roles,
  locations,
  permissions,
  status,
  isOnboarded,
  onEdit,
  onDelete,
  showDeleteIcon,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4 relative">
      {/* Status Badge */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <span
            className={`w-fit text-xs font-semibold px-2 py-1 rounded ${
              status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
            }`}
          >
            {status === "draft" ? "Entwurf" : "Veröffentlicht"}
          </span>
          <span
            className={`w-fit text-xs font-semibold px-2 py-1 rounded ${
              isOnboarded ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {isOnboarded ? "Onboarded" : "Ausstehend"}
          </span>
        </div>
      </div>

      {/* Name und E-Mail */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{employeeName}</h2>
        <div className="flex items-center gap-2 text-gray-500 mt-1">
          <Mail size={16} />
          <p className="text-sm">{email}</p>
        </div>
      </div>

      {/* Rollen */}
      {roles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Shield size={16} />
            <span className="text-sm font-medium">Rollen</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role, index) => (
              <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Standorte */}
      {locations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MapPin size={16} />
            <span className="text-sm font-medium">Standorte</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.map((location, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {location}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Administrationsrechte */}
      {permissions &&
        (() => {
          const LABELS: Record<string, string> = {
            "employees.view": "Mitarbeiter ansehen",
            "employees.create": "Mitarbeiter erstellen",
            "employees.edit": "Mitarbeiter bearbeiten",
            "employees.delete": "Mitarbeiter löschen",
            "courses.view": "Kurse ansehen",
            "courses.create": "Kurse erstellen",
            "courses.edit": "Kurse bearbeiten",
            "courses.delete": "Kurse löschen",
            "rooms.view": "Räume ansehen",
            "rooms.create": "Räume erstellen",
            "rooms.edit": "Räume bearbeiten",
            "rooms.delete": "Räume löschen",
          };
          const active = (
            Object.entries(permissions) as [string, Record<string, boolean>][]
          ).flatMap(([res, actions]) =>
            (Object.entries(actions) as [string, boolean][])
              .filter(([, v]) => v)
              .map(([action]) => `${res}.${action}`)
          );
          if (active.length === 0) return null;
          return (
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Lock size={16} />
                <span className="text-sm font-medium">Administrationsrechte</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {active.map((key) => (
                  <span
                    key={key}
                    className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full"
                  >
                    {LABELS[key] ?? key}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

      {/* Action Buttons */}
      <div className="flex justify-end items-center pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          {showDeleteIcon && onDelete && (
            <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-100 transition">
              <Trash2 size={20} className="text-red-600" />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="p-2 rounded-md hover:bg-gray-100 transition">
              <Pen size={20} className="text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeListItem;
