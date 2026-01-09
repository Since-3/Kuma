import { requireManager } from "@/src/lib/auth/getUser";
import EmployeeView from "@/src/modules/employee/ui/views/employee-view";

const Employee = async () => {
  await requireManager();
  return <EmployeeView />;
};

export default Employee;
