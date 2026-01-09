import { requireManager } from "@/src/lib/auth/getUser";
import EmployeeCreateView from "@/src/modules/employee/ui/views/employee-create-view";

const EmployeeCreate = async () => {
  await requireManager();
  return <EmployeeCreateView />;
};

export default EmployeeCreate;
