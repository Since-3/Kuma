"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployeeById } from "../../actions/employee-actions";
import { toast } from "sonner";
import EmployeeCreateView from "./employee-create-view";

interface EmployeeEditViewProps {
  employeeId: string;
  customRoles: Array<{ value: string; label: string }>;
  callerPermissions: {
    employees: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    courses: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    rooms: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  } | null;
}

type EmployeeData = {
  id: string;
  email: string;
  roles: string[];
  locations: string[];
  permissions: unknown;
  status: string | null;
  isOnboarded: boolean;
};

const EmployeeEditView = ({
  employeeId,
  customRoles,
  callerPermissions,
}: EmployeeEditViewProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchEmployee = async () => {
      if (alive) setIsLoading(true);
      const result = await getEmployeeById(employeeId);

      if (result.success && result.employee) {
        if (alive) setEmployeeData(result.employee as EmployeeData);
      } else {
        toast.error(result.error || "Fehler beim Laden des Mitarbeiters");
        router.push("/employee");
      }
      if (alive) setIsLoading(false);
    };

    fetchEmployee();
    return () => {
      alive = false;
    };
  }, [employeeId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Mitarbeiter wird geladen...</p>
      </div>
    );
  }

  if (!employeeData) {
    return null;
  }

  return (
    <EmployeeCreateView
      mode="edit"
      employeeId={employeeId}
      initialData={employeeData}
      customRoles={customRoles}
      callerPermissions={callerPermissions}
    />
  );
};

export default EmployeeEditView;
