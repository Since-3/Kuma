import { requireAuthWithData, isManager, isEmployee, isUser } from "@/src/lib/auth/getUser";
import PersonalSettingsForm, { PersonalSettingsProps } from "../components/PersonalSettingsForm";

const SettingsPersonalPageView = async () => {
  const userData = await requireAuthWithData();

  let props: PersonalSettingsProps;

  if (isManager(userData)) {
    props = {
      role: "manager",
      id: userData.id,
      email: userData.email,
      pbSrc: userData.pbSrc,
      firstName: userData.firstName,
      lastName: userData.lastName,
      tel: userData.tel,
    };
  } else if (isEmployee(userData)) {
    props = {
      role: "employee",
      id: userData.id,
      email: userData.email,
      pbSrc: userData.pbSrc,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };
  } else if (isUser(userData)) {
    props = {
      role: "user",
      id: userData.id,
      email: userData.email,
      pbSrc: userData.pbSrc,
      name: userData.name,
      tel: userData.tel,
      gender: userData.gender,
      street: userData.street,
      plz: userData.plz,
      city: userData.city,
    };
  } else {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Persönliche Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verwalte deine persönlichen Daten und Zugangsdaten
        </p>
      </div>
      <PersonalSettingsForm {...props} />
    </div>
  );
};

export default SettingsPersonalPageView;
