/**
 * CourseListItem - Kurs-Karten-Komponente
 *
 * Diese Komponente zeigt einen einzelnen Kurs als Karte an.
 * Sie wird in der Kursliste verwendet und zeigt alle wichtigen Kursinformationen
 * inklusive Teilnehmerzahl, Status und Bearbeitungsoption.
 */

import { Pen } from "lucide-react";

/**
 * Props für die CourseListItem Komponente
 */
interface CourseListItemProps {
  courseName: string; // Name des Kurses
  room: string; // Raum, in dem der Kurs stattfindet
  time: string; // Uhrzeit des Kurses (z.B. "14:00")
  currentParticipants: number; // Aktuelle Anzahl der Teilnehmer
  maxParticipants: number; // Maximale Anzahl der Teilnehmer
  trainerName: string; // Name(n) des/der Trainer
  onEdit?: () => void; // Callback-Funktion beim Klick auf Bearbeiten-Button
  status?: string; // Status des Kurses ("draft" oder "published")
  isPast?: boolean; // Ob der Kurs in der Vergangenheit liegt
}

/**
 * Kurs-Karten-Komponente
 * Zeigt Kursinformationen in einem visuell ansprechenden Karten-Layout
 */
const CourseListItem: React.FC<CourseListItemProps> = ({
  courseName,
  room,
  time,
  currentParticipants,
  maxParticipants,
  trainerName,
  onEdit,
  status,
  isPast,
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
          {room} • {time}
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
        {onEdit && (
          <button onClick={onEdit} className="p-2 rounded-md hover:bg-gray-100 transition">
            <Pen size={20} className="text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseListItem;
