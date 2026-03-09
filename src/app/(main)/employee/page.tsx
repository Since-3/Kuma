import { requireManagerOrPermission } from "@/src/lib/auth/getUser";
import EmployeeView from "@/src/modules/employee/ui/views/employee-view";

const Employee = async () => {
  await requireManagerOrPermission("canCreateEmployees");
  return <EmployeeView />;
};

export default Employee;
