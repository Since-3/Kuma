"use client";

import { useRouter } from "next/navigation";
import RoomsListItem from "../components/RoomsListItem";
import DeleteDialog from "@/src/components/layout/DeleteDialog";
import { useDeleteRoom } from "../../hooks/useDeleteRoom";

type Room = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

interface RoomsListViewProps {
  rooms: Room[];
  deleteMode: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const RoomsListView = ({ rooms, deleteMode, canEdit, canDelete }: RoomsListViewProps) => {
  const router = useRouter();

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    roomToDelete,
    setRoomToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useDeleteRoom({
    onSuccess: () => router.refresh(),
  });

  const handleEditClick = (id: string) => {
    router.push(`/rooms/edit/${id}`);
  };

  return (
    <div className="mt-6">
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
              onEdit={canEdit ? () => handleEditClick(room.id) : undefined}
              onDelete={canDelete ? () => handleDeleteClick(room.id, room.name) : undefined}
              showDeleteIcon={deleteMode && canDelete}
            />
          ))}
        </div>
      )}

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
