import { LogoutButton } from "@/src/components/layout/LogoutButton";
import { requireAuthWithData } from "@/src/lib/auth/getUser";

export default async function DashboardPage() {
  const userData = await requireAuthWithData();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Willkommen zurück!</h1>
        <p className="text-gray-600">
          Schön, dich wiederzusehen, {userData?.name || userData.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Profil</h2>
          <p className="text-gray-600 text-sm">Verwalte deine persönlichen Daten</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Trainings</h2>
          <p className="text-gray-600 text-sm">Deine gebuchten Trainingseinheiten</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Einstellungen</h2>
          <p className="text-gray-600 text-sm">Passe deine Einstellungen an</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Benutzerdaten</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{userData?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
            <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Geburtsdatum</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {userData?.birthday ? new Date(userData.birthday).toLocaleDateString("de-DE") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Wohnort</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {userData?.plz && userData?.city ? `${userData.plz} ${userData.city}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Geschlecht</dt>
            <dd className="mt-1 text-sm text-gray-900">{userData?.gender || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Registriert seit</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("de-DE") : "—"}
            </dd>
          </div>
        </dl>
      </div>
      <LogoutButton />
    </div>
  );
}
