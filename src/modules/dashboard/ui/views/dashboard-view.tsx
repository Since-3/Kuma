import { LogoutButton } from "@/src/components/layout/LogoutButton";
import { isManager, isEmployee, requireAuthWithData, isUser } from "@/src/lib/auth/getUser";

const DashboardView = async () => {
  const userData = await requireAuthWithData();

  const displayName = isManager(userData)
    ? `${userData.firstName} ${userData.lastName}`
    : isEmployee(userData)
      ? `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim() || userData.email
      : userData.name || userData.email;

  return (
    <div className="space-y-6">
      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Willkommen zurück!</h1>
        <p className="text-gray-600">Schön, dich wiederzusehen, {displayName}</p>
        {isManager(userData) && (
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            Manager
          </span>
        )}
        {isEmployee(userData) && (
          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Mitarbeiter
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Profil</h2>
          <p className="text-gray-600 text-sm">Verwalte deine persönlichen Daten</p>
        </div>

        {isManager(userData) ? (
          <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Meine Businesses</h2>
            <p className="text-gray-600 text-sm">
              {userData.businesses.length}{" "}
              {userData.businesses.length === 1 ? "Business" : "Businesses"}
            </p>
          </div>
        ) : isEmployee(userData) ? (
          <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Meine Berechtigungen</h2>
            {(() => {
              const p = userData.permissions;
              const RESOURCE_LABELS: Record<string, string> = {
                employees: "Mitarbeiter",
                courses: "Kurse",
                rooms: "Räume",
              };
              const ACTION_LABELS: Record<string, string> = {
                view: "ansehen",
                create: "erstellen",
                edit: "bearbeiten",
                delete: "löschen",
              };
              const rows = (Object.entries(p) as [string, Record<string, boolean>][])
                .map(([res, actions]) => {
                  const active = Object.entries(actions)
                    .filter(([, v]) => v)
                    .map(([a]) => ACTION_LABELS[a] ?? a);
                  return active.length > 0
                    ? `${RESOURCE_LABELS[res] ?? res}: ${active.join(", ")}`
                    : null;
                })
                .filter(Boolean);
              return rows.length > 0 ? (
                <ul className="text-gray-600 text-sm space-y-1 mt-2">
                  {rows.map((row) => (
                    <li key={row}>• {row}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm mt-2">Keine erweiterten Berechtigungen</p>
              );
            })()}
          </div>
        ) : (
          <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Trainings</h2>
            <p className="text-gray-600 text-sm">Deine gebuchten Trainingseinheiten</p>
          </div>
        )}

        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Einstellungen</h2>
          <p className="text-gray-600 text-sm">Passe deine Einstellungen an</p>
        </div>
      </div>

      {isUser(userData) && (
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Benutzerdaten</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Geburtsdatum</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData.birthday ? new Date(userData.birthday).toLocaleDateString("de-DE") : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Wohnort</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData.plz && userData.city ? `${userData.plz} ${userData.city}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Geschlecht</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.gender || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Registriert seit</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString("de-DE")
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {isManager(userData) && (
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Manager-Daten</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Vorname</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.firstName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nachname</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefon</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.tel || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Registriert seit</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString("de-DE")
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {isManager(userData) && userData.businesses.length > 0 && (
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Meine Businesses</h2>
          <div className="space-y-4">
            {userData.businesses.map((business) => (
              <div key={business.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{business.address}</p>
                <p className="text-sm text-gray-600">{business.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEmployee(userData) && (
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Mitarbeiter-Daten</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Vorname</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.firstName || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nachname</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.lastName || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Qualifikation</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData.qualification || "—"}</dd>
            </div>
          </dl>
        </div>
      )}

      <LogoutButton />
    </div>
  );
};

export default DashboardView;
