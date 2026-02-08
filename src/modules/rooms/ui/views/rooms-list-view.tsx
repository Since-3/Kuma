"use client";
import { useEffect, useState } from "react";
import { getMyRooms, deleteRoom } from "../../actions/room-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import RoomsListItem from "../components/RoomsListItem";
import DeleteDialog from "@/src/components/layout/DeleteDialog";

type Room = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

interface RoomsListViewProps {
  deleteMode: boolean;
}

const RoomsListView = ({ deleteMode }: RoomsListViewProps) => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load rooms
  const loadRooms = async () => {
    const result = await getMyRooms();
    if (result.success) {
      setRooms(result.rooms);
    } else {
      toast.error(result.error || "Fehler beim Laden der Räume");
    }
  };

  // Initial load
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      await loadRooms();
      setIsLoading(false);
    };
    fetchRooms();
  }, []);

  // Handle delete click
  const handleDeleteClick = (id: string, name: string) => {
    setRoomToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;

    setIsDeleting(true);
    const result = await deleteRoom(roomToDelete.id);

    if (result.success) {
      toast.success(result.message);
      // Remove the deleted room from the list
      setRooms((prev) => prev.filter((room) => room.id !== roomToDelete.id));
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
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

  // Handle edit click
  const handleEditClick = (id: string) => {
    router.push(`/rooms/edit/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Räume werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Rooms List */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Keine Räume gefunden</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-center">
          {rooms.map((room) => (
            <RoomsListItem
              key={room.id}
              roomName={room.name}
              onEdit={() => handleEditClick(room.id)}
              onDelete={() => handleDeleteClick(room.id, room.name)}
              showDeleteIcon={deleteMode}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setRoomToDelete(null);
        }}
        itemName={roomToDelete?.name}
        topicName="Raum"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RoomsListView;
