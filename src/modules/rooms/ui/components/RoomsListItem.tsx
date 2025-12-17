import { Pen, Trash2 } from "lucide-react";

/**
 * Props für die RoomListItem Komponente
 */
interface RoomsListItemProps {
  roomName: string; // Name des Raumes
  onEdit?: () => void; // Callback-Funktion beim Klick auf Bearbeiten-Button
  onDelete?: () => void; // Callback-Funktion beim Klick auf Löschen-Button
  showDeleteIcon?: boolean; // Ob das Löschen-Icon angezeigt werden soll
}

const RoomsListItem: React.FC<RoomsListItemProps> = ({
  roomName,
  onEdit,
  onDelete,
  showDeleteIcon,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4 w-full max-w-xs justify-self-center">
      <div className="w-full flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl text-gray-900">{roomName}</h2>
        </div>
        <div className="flex gap-2">
          {showDeleteIcon && (
            <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-100 transition">
              <Trash2 size={20} className="text-red-600" />
            </button>
          )}
          <button onClick={onEdit} className="p-2 rounded-md hover:bg-gray-100 transition">
            <Pen size={20} className="text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomsListItem;
