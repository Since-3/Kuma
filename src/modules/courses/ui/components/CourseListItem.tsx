/**
 * CourseListItem - Kurs-Karten-Komponente
 *
 * Diese Komponente zeigt einen einzelnen Kurs als Karte an.
 * Sie wird in der Kursliste verwendet und zeigt alle wichtigen Kursinformationen
 * inklusive Teilnehmerzahl, Status und Bearbeitungsoption.
 */

import AbstractTooltip from "@/src/components/layout/AbstractTooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Pen, Trash2, Link } from "lucide-react";
import { toast } from "sonner";

/**
 * Props für die CourseListItem Komponente
 */
interface CourseListItemProps {
  courseId?: string; // ID des Kurses für den Buchungslink
  courseName: string; // Name des Kurses
  room: string; // Raum, in dem der Kurs stattfindet
  timeFrom: string; // Uhrzeit am Start des Kurses
  timeTo: string; // Uhrzeit am Ende des Kurses
  currentParticipants: number; // Aktuelle Anzahl der Teilnehmer
  maxParticipants: number; // Maximale Anzahl der Teilnehmer
  trainers: string[];
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
  courseId,
  courseName,
  room,
  timeFrom,
  timeTo,
  currentParticipants,
  maxParticipants,
  trainers,
  onEdit,
  onDelete,
  status,
  isPast,
  showDeleteIcon,
}) => {
  // Prüfen, ob der Kurs voll belegt ist (für visuelle Hervorhebung)
  const isFull = currentParticipants >= maxParticipants;

  // Funktion zum Kopieren des Buchungslinks
  const handleCopyLink = () => {
    if (!courseId) return;

    const bookingUrl = `${window.location.origin}/courses/book/${courseId}`;
    navigator.clipboard.writeText(bookingUrl);
    toast.success("Link wurde in die Zwischenablage kopiert");
  };

  const getInitials = (name: string) => {
    if (!name) return "";

    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4 relative ${
        isPast ? "opacity-60 bg-gray-50" : ""
      }`}
    >
      <div className="flex items-center w-full">
        {/*TODO: Avatar */}
        {trainers.map((trainer, index) => (
          <AbstractTooltip key={trainer} tooltipText={trainer}>
            <div
              className={`relative ${index !== 0 ? "-ml-3" : ""}`}
              style={{ zIndex: trainers.length - index }}
            >
              <Avatar className="rounded-full border-2 border-white">
                <AvatarImage src="https://github.com/shadcn.png" alt={trainer} />
                <AvatarFallback>{getInitials(trainer)}</AvatarFallback>
              </Avatar>
            </div>
          </AbstractTooltip>
        ))}
        {/* Time */}
        <div className="w-full flex justify-end">
          <p className="text-gray-500 text-lg">
            {timeFrom} - {timeTo}
          </p>
        </div>
      </div>

      {/* Course Name */}
      <h2 className="text-xl font-semibold text-gray-900">{courseName}</h2>

      <div className="flex items-center justify-between w-full">
        {/* Participant Number */}
        <span className={isFull ? "text-red-600 font-semibold" : "text-gray-800"}>
          {currentParticipants}/{maxParticipants} Teilnehmer
        </span>

        {/*TODO: Price */}
        <h2 className="text-lg">15 €</h2>
      </div>

      {/* Participant Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${isFull ? "bg-red-500" : "bg-blue"}`}
          style={{ width: `${(currentParticipants / maxParticipants) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-full">
        {/*TODO: Level Label */}
        <span className={`w-fit top-3 left-3 text-xs  px-2 py-1 round bg-yellow rounded-lg`}>
          Fortgeschritten
        </span>
        {/* Room */}
        <p className="text-gray-500">{room}</p>
      </div>

      <hr />

      <div className="flex items-center justify-between w-full">
        {/* Status */}
        {status && (
          <span
            className={`w-fit top-3 left-3 text-xs font-semibold px-2 py-1 rounded ${
              status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
            }`}
          >
            {status === "draft" ? "Entwurf" : "Veröffentlicht"}
          </span>
        )}
        {/* Actions */}
        <div className="flex gap-2">
          {courseId && status === "published" && (
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-md hover:bg-blue-100 transition"
              title="Buchungslink kopieren"
            >
              <Link size={20} className="text-blue-600" />
            </button>
          )}
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
