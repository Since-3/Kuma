import { requireManagerOrPermission } from "@/src/lib/auth/getUser";
import EmployeeCreateView from "@/src/modules/employee/ui/views/employee-create-view";
import { getMyEmployeeRoles } from "@/src/modules/employee/actions/employee-actions";

const EmployeeCreate = async () => {
  await requireManagerOrPermission("canCreateEmployees");

  // Lade alle bereits verwendeten custom Rollen
  const rolesResult = await getMyEmployeeRoles();
  const customRoles = rolesResult.success ? rolesResult.roles : [];

  return <EmployeeCreateView customRoles={customRoles} />;
};

export default EmployeeCreate;
