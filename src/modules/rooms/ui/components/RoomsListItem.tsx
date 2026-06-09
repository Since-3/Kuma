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
    <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-xl p-5 shadow-sm hover:shadow-md hover:bg-white/70 transition flex flex-col gap-4 w-full max-w-xs justify-self-center">
      <div className="w-full flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl text-gray-900">{roomName}</h2>
        </div>
        <div className="flex gap-2">
          {showDeleteIcon && (
            <button
              aria-label={`Raum ${roomName} löschen`}
              onClick={onDelete}
              className="p-2 rounded-md hover:bg-red-500/10 transition"
            >
              <Trash2 size={20} className="text-red-600" />
            </button>
          )}
          {onEdit && (
            <button
              aria-label={`Raum ${roomName} bearbeiten`}
              onClick={onEdit}
              className="p-2 rounded-md hover:bg-white/50 transition"
            >
              <Pen size={20} className="text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsListItem;
