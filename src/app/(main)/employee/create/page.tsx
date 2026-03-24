import { requireManagerOrPermission, isEmployee } from "@/src/lib/auth/getUser";
import EmployeeCreateView from "@/src/modules/employee/ui/views/employee-create-view";
import { getMyEmployeeRoles } from "@/src/modules/employee/actions/employee-actions";

const EmployeeCreate = async () => {
  const userData = await requireManagerOrPermission((p) => p.employees.create);

  // Lade alle bereits verwendeten custom Rollen
  const rolesResult = await getMyEmployeeRoles();
  const customRoles = rolesResult.success ? rolesResult.roles : [];

  // Employees können nur Rechte vergeben, die sie selbst besitzen
  const callerPermissions = isEmployee(userData) ? userData.permissions : null;

  return <EmployeeCreateView customRoles={customRoles} callerPermissions={callerPermissions} />;
};

export default EmployeeCreate;
