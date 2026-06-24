"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import { resendOnboardingEmail } from "../../actions/employee-actions";
import EmployeeListItem from "../components/EmployeeListItem";
import { toast } from "sonner";
import DeleteDialog from "@/src/components/layout/DeleteDialog";
import { useDeleteEmployee } from "../../hooks/useDeleteEmployee";
import Link from "next/link";

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

interface EmployeeListViewProps {
  employees: Employee[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const EmployeeListView = ({ employees, canCreate, canEdit, canDelete }: EmployeeListViewProps) => {
  const router = useRouter();
  const [deleteMode, setDeleteMode] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    employeeToDelete,
    setEmployeeToDelete,
    isDeleting,
    activeCourseCount,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useDeleteEmployee({
    onSuccess: () => router.refresh(),
  });

  const handleResendEmail = async (employeeId: string) => {
    setResendingId(employeeId);
    try {
      const result = await resendOnboardingEmail(employeeId);
      if (result.success) {
        toast.success("Onboarding-Mail wurde erneut versendet");
      } else {
        toast.error(result.error || "Fehler beim Versenden der E-Mail");
      }
    } catch {
      toast.error("Fehler beim Versenden der E-Mail");
    } finally {
      setResendingId(null);
    }
  };

  const getEmployeeName = (employee: Employee) => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employee.email;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex w-full justify-end mr-2 gap-2">
          {canDelete && (
            <Button
              variant={deleteMode ? "destructive" : "outline"}
              onClick={() => setDeleteMode(!deleteMode)}
              className="flex items-center gap-2"
            >
              {deleteMode ? "Abbrechen" : "Mitarbeiter löschen"}
            </Button>
          )}
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl">
          <p className="text-xl text-gray-600">Keine Mitarbeiter vorhanden</p>
          {canCreate && (
            <>
              <p className="text-gray-500 mt-2">Erstellen Sie Ihren ersten Mitarbeiter!</p>
              <Button onClick={() => router.push("/employee/create")} className="mt-4">
                Mitarbeiter anlegen
              </Button>
            </>
          )}
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
                  employees: { view: boolean; create: boolean; edit: boolean; delete: boolean };
                  courses: { view: boolean; create: boolean; edit: boolean; delete: boolean };
                  rooms: { view: boolean; create: boolean; edit: boolean; delete: boolean };
                } | null
              }
              status={employee.status || "draft"}
              isOnboarded={employee.isOnboarded}
              showDeleteIcon={deleteMode && canDelete}
              onDelete={
                canDelete
                  ? () => handleDeleteClick(employee.id, getEmployeeName(employee))
                  : undefined
              }
              onEdit={canEdit ? () => router.push(`/employee/edit/${employee.id}`) : undefined}
              onResendEmail={canEdit ? () => handleResendEmail(employee.id) : undefined}
              isResendingEmail={resendingId === employee.id}
            />
          ))}
        </div>
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setEmployeeToDelete(null);
        }}
        itemName={employeeToDelete?.name}
        topicName="Mitarbeiter"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        warningContent={
          activeCourseCount > 0 && employeeToDelete ? (
            <p>
              Dieser Trainer ist noch in{" "}
              <strong>
                {activeCourseCount} aktiven Kurs{activeCourseCount !== 1 ? "en" : ""}
              </strong>{" "}
              eingetragen.{" "}
              <Link
                href={`/courses?trainer=${employeeToDelete.id}`}
                className="underline font-semibold"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Kurse anzeigen
              </Link>
            </p>
          ) : undefined
        }
      />
    </div>
  );
};

export default EmployeeListView;
