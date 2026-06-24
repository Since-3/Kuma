"use client";

import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import EmployeeListView from "./employee-list-view";

type Employee = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roles: string[];
  locations: string[];
  permissions: unknown;
  status: string | null;
  isOnboarded: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

interface EmployeeViewProps {
  employees: Employee[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const EmployeeView = ({ employees, canCreate, canEdit, canDelete }: EmployeeViewProps) => {
  const router = useRouter();

  return (
    <div>
      <div className="w-full flex flex-col items-left p-2 md:flex-row md:justify-between md:items-center">
        <h1 className="text-4xl font-bold">Deine Mitarbeiter</h1>
        <div className="flex flex-col gap-4 mt-2 md:flex-row md:mt-0">
          {canCreate && (
            <Button
              onClick={() => router.push("/employee/create")}
              className="text-sm tracking-wide font-normal"
            >
              Mitarbeiter anlegen
            </Button>
          )}
        </div>
      </div>
      <EmployeeListView
        employees={employees}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
};

export default EmployeeView;
