import { requireManagerOrPermission, isManager, isEmployee } from "@/src/lib/auth/getUser";
import EmployeeView from "@/src/modules/employee/ui/views/employee-view";

const Employee = async () => {
  const userData = await requireManagerOrPermission((p) => p.employees.view);
  const canCreate =
    isManager(userData) || (isEmployee(userData) && userData.permissions.employees.create);
  const canEdit =
    isManager(userData) || (isEmployee(userData) && userData.permissions.employees.edit);
  const canDelete =
    isManager(userData) || (isEmployee(userData) && userData.permissions.employees.delete);
  return <EmployeeView canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />;
};

export default Employee;
