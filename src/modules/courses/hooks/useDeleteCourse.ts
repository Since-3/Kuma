"use client";
import { useState } from "react";
import { deleteCourse } from "../actions/course-actions";
import { toast } from "sonner";
import type { StandingOrderScope } from "../ui/components/StandingOrderScopeDialog";

interface UseDeleteCourseOptions {
  onSuccess?: (deletedId: string) => void;
}

export function useDeleteCourse({ onSuccess }: UseDeleteCourseOptions = {}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteScope, setDeleteScope] = useState<StandingOrderScope>("this");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string, name: string, isStandingOrderRelated = false) => {
    setCourseToDelete({ id, name });
    if (isStandingOrderRelated) {
      setScopeDialogOpen(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const handleScopeConfirm = (scope: StandingOrderScope) => {
    setDeleteScope(scope);
    setScopeDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    const result = await deleteCourse(courseToDelete.id, deleteScope);
    setIsDeleting(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      const deletedId = courseToDelete.id;
      setCourseToDelete(null);
      setDeleteScope("this");
      onSuccess?.(deletedId);
    } else {
      setCourseToDelete(null);
      setDeleteScope("this");
      toast.error(result.error || "Fehler beim Löschen des Kurses");
    }
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    scopeDialogOpen,
    setScopeDialogOpen,
    courseToDelete,
    setCourseToDelete,
    isDeleting,
    handleDeleteClick,
    handleScopeConfirm,
    handleDeleteConfirm,
  };
}
