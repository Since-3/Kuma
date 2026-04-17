import { requireManagerOrPermission, isEmployee } from "@/src/lib/auth/getUser";
import EmployeeEditView from "@/src/modules/employee/ui/views/employee-edit-view";
import { getMyEmployeeRoles } from "@/src/modules/employee/actions/employee-actions";

const EmployeeEdit = async ({ params }: { params: Promise<{ id: string }> }) => {
  const userData = await requireManagerOrPermission((p) => p.employees.edit);
  const { id } = await params;

  const rolesResult = await getMyEmployeeRoles();
  const customRoles = rolesResult.success ? rolesResult.roles : [];

  const callerPermissions = isEmployee(userData) ? userData.permissions : null;

  return (
    <EmployeeEditView
      employeeId={id}
      customRoles={customRoles}
      callerPermissions={callerPermissions}
    />
  );
};

export default EmployeeEdit;
