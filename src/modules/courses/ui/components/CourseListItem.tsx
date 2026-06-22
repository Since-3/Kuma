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
import Image from "next/image";

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
  price: number; // Preis in Euro
  level: string; // Level
  trainers: string[];
  trainersMap?: Record<string, { label: string; pbSrc?: string }>;
  onEdit?: () => void; // Callback-Funktion beim Klick auf Bearbeiten-Button
  onDelete?: () => void; // Callback-Funktion beim Klick auf Löschen-Button
  status?: string; // Status des Kurses ("draft" oder "published")
  isPast?: boolean; // Ob der Kurs in der Vergangenheit liegt
  showDeleteIcon?: boolean; // Ob das Löschen-Icon angezeigt werden soll
  coverImage?: string; // Optionales Cover-Bild
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
  price,
  level,
  trainers,
  trainersMap = {},
  onEdit,
  onDelete,
  status,
  isPast,
  showDeleteIcon,
  coverImage,
}) => {
  // Prüfen, ob der Kurs voll belegt ist (für visuelle Hervorhebung)
  const isFull = currentParticipants >= maxParticipants;

  const levelConfig: Record<string, { label: string; bg: string; text: string }> = {
    any: { label: "Jedes Niveau", bg: "bg-gray-200", text: "text-gray-700" },
    beginner: { label: "Anfänger", bg: "bg-blue-200", text: "text-blue-700" },
    advanced: { label: "Fortgeschrittene", bg: "bg-orange-200", text: "text-orange-700" },
    pro: { label: "Profi", bg: "bg-red-200", text: "text-red-700" },
  };

  const currentLevel = levelConfig[level] || levelConfig.any;

  // Funktion zum Kopieren des Buchungslinks
  const handleCopyLink = async () => {
    if (!courseId) return;

    const bookingUrl = `${window.location.origin}/courses/book/${courseId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bookingUrl);
      } else {
        const el = document.createElement("textarea");
        el.value = bookingUrl;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        try {
          el.select();
          const ok = document.execCommand("copy");
          if (!ok) throw new Error("execCommand copy failed");
        } finally {
          document.body.removeChild(el);
        }
      }
      toast.success("Link wurde in die Zwischenablage kopiert");
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";

    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`border border-white/60 bg-white/55 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md hover:bg-white/70 transition flex flex-col relative overflow-hidden ${
        isPast ? "opacity-60" : ""
      }`}
    >
      {coverImage && (
        <div className="relative w-full h-36 shrink-0">
          <Image src={coverImage} alt={courseName} fill className="object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center w-full">
          {trainers.map((trainerId, index) => {
            const trainerInfo = trainersMap[trainerId];
            const displayName = trainerInfo?.label ?? "Ehemaliger Trainer";
            const avatarSrc = trainerInfo?.pbSrc;
            return (
              <AbstractTooltip key={`${trainerId}-${index}`} tooltipText={displayName}>
                <div
                  className={`relative ${index !== 0 ? "-ml-3" : ""}`}
                  style={{ zIndex: trainers.length - index }}
                >
                  <Avatar className="rounded-full border-2 border-white">
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </div>
              </AbstractTooltip>
            );
          })}
          {/* Time */}
          <div className="w-full flex justify-end">
            <p className="text-gray-500 text-lg">
              {timeFrom} - {timeTo}
            </p>
          </div>
        </div>

        {/* Course Name */}
        <h2 className="text-xl font-black text-gray-900 leading-tight">{courseName}</h2>

        <div className="flex items-center justify-between w-full">
          {/* Participant Number */}
          <span
            className={`text-sm ${isFull ? "text-red-500 font-semibold" : "text-gray-400 font-light"}`}
          >
            {currentParticipants}/{maxParticipants} Teilnehmer
          </span>

          {/* Price */}
          <span className="text-lg font-black text-gray-900">
            {price.toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>

        {/* Participant Bar */}
        <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isFull ? "bg-red-400" : "bg-blue"}`}
            style={{
              width: `${maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between w-full">
          <span
            className={`w-fit text-xs font-semibold px-2 py-1 rounded-lg ${currentLevel.bg} ${currentLevel.text}`}
          >
            {currentLevel.label}
          </span>
          {/* Room */}
          <p className="text-xs text-gray-400 font-light">{room}</p>
        </div>

        <div className="h-px bg-white/50" />

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
              <button onClick={onDelete} className="p-2 rounded-md hover:bg-red-500/10 transition">
                <Trash2 size={20} className="text-red-600" />
              </button>
            )}
            {onEdit && (
              <button onClick={onEdit} className="p-2 rounded-md hover:bg-white/50 transition">
                <Pen size={20} className="text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseListItem;
