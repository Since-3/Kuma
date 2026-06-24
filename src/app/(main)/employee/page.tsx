import { Suspense } from "react";
import { requireManagerOrPermission, isManager, isEmployee } from "@/src/lib/auth/getUser";
import { getMyEmployees } from "@/src/modules/employee/actions/employee-actions";
import EmployeeView from "@/src/modules/employee/ui/views/employee-view";
import EmployeeLoading from "./loading";

const Employee = async () => {
  const userData = await requireManagerOrPermission((p) => p.employees.view);
  const canCreate =
    isManager(userData) || (isEmployee(userData) && userData.permissions.employees.create);
  const canEdit =
    isManager(userData) || (isEmployee(userData) && userData.permissions.employees.edit);
  const canDelete =
    isManager(userData) || (isEmployee(userData) && userData.permissions.employees.delete);

  const result = await getMyEmployees();
  const employees = result.success ? result.employees : [];

  return (
    <Suspense fallback={<EmployeeLoading />}>
      <EmployeeView
        employees={employees}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </Suspense>
  );
};

export default Employee;
