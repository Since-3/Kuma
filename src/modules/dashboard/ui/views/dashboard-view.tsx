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
      <div className="border border-white/60 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,oklch(0.88_0.09_85/_0.25)_0%,transparent_70%)] pointer-events-none" />
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
          Dashboard
        </p>
        <h1 className="text-4xl font-black text-gray-900 mb-1">Willkommen zurück!</h1>
        <p className="text-gray-500 font-light">{displayName}</p>
        <div className="mt-4 flex gap-2">
          {isManager(userData) && (
            <span className="inline-flex items-center px-3 py-1 bg-blue/10 text-blue text-xs font-semibold rounded-full border border-blue/10">
              Manager
            </span>
          )}
          {isEmployee(userData) && (
            <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-700 text-xs font-semibold rounded-full border border-green-500/10">
              Mitarbeiter
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Profil</h2>
          <p className="text-gray-400 text-sm font-light">Verwalte deine persönlichen Daten</p>
        </div>

        {isManager(userData) ? (
          <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Meine Businesses</h2>
            <p className="text-gray-400 text-sm font-light">
              {userData.businesses.length}{" "}
              {userData.businesses.length === 1 ? "Business" : "Businesses"}
            </p>
          </div>
        ) : isEmployee(userData) ? (
          <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Meine Berechtigungen</h2>
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
            <h2 className="text-base font-semibold text-gray-900 mb-1">Trainings</h2>
            <p className="text-gray-400 text-sm font-light">Deine gebuchten Trainingseinheiten</p>
          </div>
        )}

        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Einstellungen</h2>
          <p className="text-gray-400 text-sm font-light">Passe deine Einstellungen an</p>
        </div>
      </div>

      {isUser(userData) && (
        <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Benutzerdaten</h2>
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
          <h2 className="text-base font-semibold text-gray-900 mb-4">Manager-Daten</h2>
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
          <h2 className="text-base font-semibold text-gray-900 mb-4">Meine Businesses</h2>
          <div className="space-y-4">
            {userData.businesses.map((business) => (
              <div key={business.id} className="border-l-2 border-white/60 pl-4 py-1">
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
          <h2 className="text-base font-semibold text-gray-900 mb-4">Mitarbeiter-Daten</h2>
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
