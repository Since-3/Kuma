import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyEmployees, deleteEmployee } from "../../actions/employee-actions";
import EmployeeListItem from "../components/EmployeeListItem";
import { toast } from "sonner";
import DeleteDialog from "@/src/components/layout/DeleteDialog";

type Employee = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roles: string[];
  locations: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permissions: any;
  status: string | null;
  isOnboarded: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const EmployeeListView = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      const result = await getMyEmployees();
      if (result.success) {
        setEmployees(result.employees);
      } else {
        toast.error(result.error || "Fehler beim Laden der Mitarbeiter");
      }
      setIsLoading(false);
    };

    loadEmployees();
  }, []);

  const requestDelete = (employeeId: string, employeeName: string) => {
    setEmployeeToDelete({ id: employeeId, name: employeeName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);

    const result = await deleteEmployee(employeeToDelete.id);

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);

    if (result.success) {
      toast.success(result.message);
      // Reload employees
      const reloadResult = await getMyEmployees();
      if (reloadResult.success) {
        setEmployees(reloadResult.employees);
      }
    } else {
      toast.error(result.error || "Fehler beim Löschen");
    }
  };

  const getEmployeeName = (employee: Employee) => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employee.email;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Mitarbeiter wird geladen</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex w-full justify-end mr-2 gap-2">
          <Button
            variant={deleteMode ? "destructive" : "outline"}
            onClick={() => setDeleteMode(!deleteMode)}
            className="flex items-center gap-2"
          >
            {deleteMode ? "Abbrechen" : "Mitarbeiter löschen"}
          </Button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600">Sie haben noch keinen Mitarbeiter erstellt</p>
          <p className="text-gray-500 mt-2">Erstellen Sie Ihren ersten Mitarbeiter!</p>
          <Button onClick={() => router.push("/employee/create")} className="mt-4">
            Mitarbeiter anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((employee) => (
            <EmployeeListItem
              key={employee.id}
              employeeId={employee.id}
              employeeName={getEmployeeName(employee)}
              email={employee.email}
              roles={employee.roles}
              locations={employee.locations}
              permissions={
                employee.permissions as {
                  canCreateCourses: boolean;
                  canCreateEmployees: boolean;
                } | null
              }
              status={employee.status || "draft"}
              isOnboarded={employee.isOnboarded}
              showDeleteIcon={deleteMode}
              onDelete={() => requestDelete(employee.id, getEmployeeName(employee))}
              onEdit={() => router.push(`/employee/edit/${employee.id}`)}
            />
          ))}
        </div>
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={employeeToDelete?.name}
        topicName="Mitarbeiter"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EmployeeListView;
