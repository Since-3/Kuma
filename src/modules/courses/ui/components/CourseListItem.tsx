/**
 * CourseListItem - Kurs-Karten-Komponente
 *
 * Diese Komponente zeigt einen einzelnen Kurs als Karte an.
 * Sie wird in der Kursliste verwendet und zeigt alle wichtigen Kursinformationen
 * inklusive Teilnehmerzahl, Status und Bearbeitungsoption.
 */

import { Pen, Trash2 } from "lucide-react";

/**
 * Props für die CourseListItem Komponente
 */
interface CourseListItemProps {
  courseName: string; // Name des Kurses
  room: string; // Raum, in dem der Kurs stattfindet
  timeFrom: string; // Uhrzeit am Start des Kurses
  timeTo: string; // Uhrzeit am Ende des Kurses
  currentParticipants: number; // Aktuelle Anzahl der Teilnehmer
  maxParticipants: number; // Maximale Anzahl der Teilnehmer
  trainerName: string; // Name(n) des/der Trainer
  onEdit?: () => void; // Callback-Funktion beim Klick auf Bearbeiten-Button
  onDelete?: () => void; // Callback-Funktion beim Klick auf Löschen-Button
  status?: string; // Status des Kurses ("draft" oder "published")
  isPast?: boolean; // Ob der Kurs in der Vergangenheit liegt
  showDeleteIcon?: boolean; // Ob das Löschen-Icon angezeigt werden soll
}

/**
 * Kurs-Karten-Komponente
 * Zeigt Kursinformationen in einem visuell ansprechenden Karten-Layout
 */
const CourseListItem: React.FC<CourseListItemProps> = ({
  courseName,
  room,
  timeFrom,
  timeTo,
  currentParticipants,
  maxParticipants,
  trainerName,
  onEdit,
  onDelete,
  status,
  isPast,
  showDeleteIcon,
}) => {
  // Prüfen, ob der Kurs voll belegt ist (für visuelle Hervorhebung)
  const isFull = currentParticipants >= maxParticipants;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4 relative ${
        isPast ? "opacity-60 bg-gray-50" : ""
      }`}
    >
      {status && (
        <span
          className={`w-fit top-3 left-3 text-xs font-semibold px-2 py-1 rounded ${
            status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
          }`}
        >
          {status === "draft" ? "Entwurf" : "Veröffentlicht"}
        </span>
      )}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{courseName}</h2>
        <p className="text-gray-500">
          {room} • {timeFrom} - {timeTo}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Teilnehmer</span>
          <span className={isFull ? "text-red-600 font-semibold" : "text-gray-800"}>
            {currentParticipants}/{maxParticipants}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isFull ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${(currentParticipants / maxParticipants) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <p className="text-gray-700">{trainerName}</p>
        <div className="flex gap-2">
          {showDeleteIcon && onDelete && (
            <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-100 transition">
              <Trash2 size={20} className="text-red-600" />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="p-2 rounded-md hover:bg-gray-100 transition">
              <Pen size={20} className="text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseListItem;
