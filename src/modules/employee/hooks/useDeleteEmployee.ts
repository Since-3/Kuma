"use client";
import { useState } from "react";
import { deleteEmployee, getActiveCoursesCountByTrainer } from "../actions/employee-actions";
import { toast } from "sonner";

interface UseDeleteEmployeeOptions {
  onSuccess?: (deletedId: string) => void;
}

export function useDeleteEmployee({ onSuccess }: UseDeleteEmployeeOptions = {}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeCourseCount, setActiveCourseCount] = useState(0);

  const handleDeleteClick = async (id: string, name: string) => {
    setEmployeeToDelete({ id, name });
    const result = await getActiveCoursesCountByTrainer(id);
    setActiveCourseCount(result.success ? result.count : 0);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    const result = await deleteEmployee(employeeToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      const deletedId = employeeToDelete.id;
      setEmployeeToDelete(null);
      setActiveCourseCount(0);
      onSuccess?.(deletedId);
    } else {
      setEmployeeToDelete(null);
      setActiveCourseCount(0);
      toast.error(result.error || "Fehler beim Löschen des Mitarbeiters");
    }
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    employeeToDelete,
    setEmployeeToDelete,
    isDeleting,
    activeCourseCount,
    handleDeleteClick,
    handleDeleteConfirm,
  };
}
