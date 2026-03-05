"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRoom } from "../actions/room-actions";
import { toast } from "sonner";

interface UseDeleteRoomOptions {
  onSuccess?: (deletedId: string) => void;
}

export function useDeleteRoom({ onSuccess }: UseDeleteRoomOptions = {}) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string, name: string) => {
    setRoomToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;

    setIsDeleting(true);
    const result = await deleteRoom(roomToDelete.id);

    if (result.success) {
      toast.success(result.message);
      setDeleteDialogOpen(false);
      const deletedId = roomToDelete.id;
      setRoomToDelete(null);
      onSuccess?.(deletedId);
    } else if (result.hasActiveCourses) {
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      toast.error(result.error, {
        duration: 8000,
        style: { maxWidth: "680px" },
        action: {
          label: "Kurse anzeigen",
          onClick: () => router.push(`/courses?room=${encodeURIComponent(result.roomName)}`),
        },
        actionButtonStyle: {
          backgroundColor: "#F4C00C",
          color: "#1E293B",
          fontWeight: "600",
          padding: "8px 14px",
          borderRadius: "6px",
        },
      });
    } else {
      toast.error(result.error || "Fehler beim Löschen des Raumes");
    }
    setIsDeleting(false);
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    roomToDelete,
    setRoomToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
  };
}
