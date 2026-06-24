"use client";
import { useState } from "react";
import { deleteCourse } from "../actions/course-actions";
import { toast } from "sonner";

interface UseDeleteCourseOptions {
  onSuccess?: () => void;
}

export function useDeleteCourse({ onSuccess }: UseDeleteCourseOptions = {}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string, name: string) => {
    setCourseToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    const result = await deleteCourse(courseToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      setCourseToDelete(null);
      onSuccess?.();
    } else {
      setCourseToDelete(null);
      toast.error(result.error || "Fehler beim Löschen des Kurses");
    }
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    courseToDelete,
    setCourseToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
  };
}
