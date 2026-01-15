"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InputComponent from "@/src/components/layout/InputComponent";
import GenericDropdown from "@/src/components/layout/GenericDropdown";
import MultiSelectDropdown from "@/src/components/layout/MultiSelectDropdown";
import RichTextEditor from "@/src/components/layout/RichTextEditor";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import { createCourse, updateCourse } from "../../actions/course-actions";
import { getMyRooms } from "@/src/modules/rooms/actions/room-actions";
import { toast } from "sonner";
import { Course } from "../../types/course.types";

// Hardcoded data
const SPORTS = [
  { value: "football", label: "Fußball" },
  { value: "basketball", label: "Basketball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "tennis", label: "Tennis" },
  { value: "boxing", label: "Boxen" },
  { value: "yoga", label: "Yoga" },
];

const TRAINERS = [
  { value: "trainer1", label: "Max Mustermann" },
  { value: "trainer2", label: "Anna Schmidt" },
  { value: "trainer3", label: "Peter Weber" },
  { value: "trainer4", label: "Lisa Müller" },
];

const FREQUENCIES = [
  { value: "daily", label: "Täglich" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Alle 2 Wochen" },
  { value: "monthly", label: "Monatlich" },
  { value: "custom", label: "Individuell" },
];

const WEEKDAYS = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

interface CourseCreateViewProps {
  mode?: "create" | "edit";
  courseId?: string;
  initialData?: Course;
}

const CourseCreateView = ({
  mode = "create",
  courseId,
  initialData,
}: CourseCreateViewProps = {}) => {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [courseDate, setCourseDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [isStandingOrder, setIsStandingOrder] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Load rooms from database
  useEffect(() => {
    const loadRooms = async () => {
      const result = await getMyRooms();
      setIsLoadingRooms(true);
      if (result.success) {
        const roomOptions = result.rooms.map((room) => ({
          value: room.id,
          label: room.name,
        }));
        setRooms(roomOptions);
      } else {
        toast.error("Fehler beim Laden der Räume. Bitte laden Sie die Seite neu.");
      }
      setIsLoadingRooms(false);
    };
    loadRooms();
  }, []);

  // Load initial data when in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setCourseName(initialData.name || "");
      setSelectedSport(initialData.sport || "");

      // Format date for input field (YYYY-MM-DD)
      if (initialData.date) {
        const date = new Date(initialData.date);
        const formattedDate = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-");
        setCourseDate(formattedDate);
      }

      setTimeFrom(initialData.timeFrom || "");
      setTimeTo(initialData.timeTo || "");
      setSelectedTrainers(initialData.trainers || []);
      setSelectedRoom(initialData.room || "");
      setDescription(initialData.description || "");
      setMaxParticipants(initialData.maxParticipants?.toString() || "");
      setIsStandingOrder(initialData.isStandingOrder || false);
      setSelectedFrequency(initialData.frequency || "");
      setSelectedWeekdays(initialData.weekdays || []);
    }
  }, [mode, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!courseName.trim()) newErrors.name = "Kursname ist erforderlich";
    if (!selectedSport) newErrors.sport = "Sportart ist erforderlich";
    if (!courseDate) newErrors.date = "Datum ist erforderlich";
    if (!timeFrom) newErrors.timeFrom = "Anfangszeit ist erforderlich";
    if (!timeTo) newErrors.timeTo = "Endzeit ist erforderlich";

    // Validate that timeFrom is before timeTo
    if (timeFrom && timeTo && timeFrom >= timeTo) {
      newErrors.timeTo = "Endzeit muss nach der Anfangszeit liegen";
    }

    if (selectedTrainers.length === 0)
      newErrors.trainers = "Mindestens ein Trainer muss ausgewählt werden";
    if (!selectedRoom) newErrors.room = "Raum ist erforderlich";
    if (!description.trim()) newErrors.description = "Beschreibung ist erforderlich";

    const maxPart = parseInt(maxParticipants);
    if (!maxParticipants || isNaN(maxPart) || maxPart < 1) {
      newErrors.maxParticipants = "Mindestens 1 Teilnehmer erforderlich";
    } else if (maxPart > 100) {
      newErrors.maxParticipants = "Maximal 100 Teilnehmer erlaubt";
    }

    if (isStandingOrder) {
      if (!selectedFrequency)
        newErrors.frequency = "Häufigkeit ist erforderlich bei Daueraufträgen";
      if (selectedFrequency === "custom" && selectedWeekdays.length === 0) {
        newErrors.weekdays = "Mindestens ein Tag muss ausgewählt werden";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!validateForm()) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus");
      return;
    }

    setIsSubmitting(true);

    try {
      const courseData = {
        name: courseName,
        sport: selectedSport,
        date: courseDate,
        timeFrom: timeFrom,
        timeTo: timeTo,
        trainers: selectedTrainers,
        room: selectedRoom,
        description,
        maxParticipants: parseInt(maxParticipants),
        isStandingOrder,
        frequency: selectedFrequency || undefined,
        weekdays: selectedWeekdays.length > 0 ? selectedWeekdays : undefined,
      };

      if (mode === "edit" && !courseId) {
        throw new Error("Missing courseId in edit mode");
      }

      const result =
        mode === "edit"
          ? await updateCourse(courseId!, courseData, status)
          : await createCourse(courseData, status);

      if (result.success) {
        toast.success(result.message);
        router.push("/courses");
      } else {
        toast.error(result.error || "Ein Fehler ist aufgetreten");
        if (result.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              fieldErrors[key] = value[0];
            }
          });
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">{mode === "edit" ? "Kurs bearbeiten" : "Kurs anlegen"}</h1>
      <p className="text-xl mt-2">
        {mode === "edit"
          ? "Ändern Sie die Kursdetails und speichern Sie Ihre Änderungen"
          : "Alle Kurse können nach dem Speichern angepasst oder gelöscht werden"}
      </p>
      <div className="mt-6 flex flex-col gap-4 max-w-xl">
        <div>
          <InputComponent
            isLabel
            label="Kursnamen"
            type="text"
            id="course-create-name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <GenericDropdown
          label="Sportart"
          selected={selectedSport}
          onSelect={setSelectedSport}
          options={SPORTS}
          error={errors.sport}
        />

        <div>
          <InputComponent
            isLabel
            label="Datum"
            type="date"
            id="course-create-date"
            value={courseDate}
            onChange={(e) => setCourseDate(e.target.value)}
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        <div>
          <InputComponent
            isLabel
            label="Uhrzeit von"
            type="time"
            id="course-create-time-from"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
          />
          {errors.timeFrom && <p className="text-red-500 text-sm mt-1">{errors.timeFrom}</p>}
        </div>

        <div>
          <InputComponent
            isLabel
            label="Uhrzeit bis"
            type="time"
            id="course-create-time-to"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
          />
          {errors.timeTo && <p className="text-red-500 text-sm mt-1">{errors.timeTo}</p>}
        </div>

        <MultiSelectDropdown
          label="Trainer"
          selected={selectedTrainers}
          onSelect={setSelectedTrainers}
          options={TRAINERS}
          error={errors.trainers}
        />

        <GenericDropdown
          label="Raum"
          selected={selectedRoom}
          onSelect={setSelectedRoom}
          options={rooms}
          error={errors.room}
          disabled={isLoadingRooms}
          placeholder={isLoadingRooms ? "Räume werden geladen..." : "Raum auswählen"}
        />

        <div>
          <InputComponent
            isLabel
            label="Maximale Teilnehmerzahl"
            type="number"
            id="course-create-max-participants"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
          />
          {errors.maxParticipants && (
            <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>
          )}
        </div>

        <RichTextEditor
          label="Was man mitbringen sollte"
          value={description}
          onChange={setDescription}
          placeholder="Beschreibe, was die Teilnehmer mitbringen sollten..."
          error={errors.description}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="course-create-standing-order"
            className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
            checked={isStandingOrder}
            onCheckedChange={(checked) => {
              setIsStandingOrder(checked === true);
              if (!checked) {
                setSelectedFrequency("");
                setSelectedWeekdays([]);
              }
            }}
          />
          <Label htmlFor="course-create-standing-order" className="cursor-pointer text-lg mt-2">
            Als Dauerauftrag anlegen
          </Label>
        </div>

        {isStandingOrder && (
          <>
            <GenericDropdown
              label="Wie oft soll dieser Kurs stattfinden?"
              selected={selectedFrequency}
              onSelect={(value) => {
                setSelectedFrequency(value);
                if (value !== "custom") {
                  setSelectedWeekdays([]);
                }
              }}
              options={FREQUENCIES}
              error={errors.frequency}
            />

            {selectedFrequency === "custom" && (
              <MultiSelectDropdown
                label="An welchen Tagen soll der Kurs stattfinden?"
                selected={selectedWeekdays}
                onSelect={setSelectedWeekdays}
                options={WEEKDAYS}
                error={errors.weekdays}
              />
            )}
          </>
        )}
        <div className="flex gap-2">
          <Button onClick={() => handleSubmit("published")} disabled={isSubmitting}>
            {isSubmitting
              ? "Wird gespeichert..."
              : mode === "edit"
                ? "Änderungen speichern"
                : "Veröffentlichen"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/courses")} disabled={isSubmitting}>
            Abbrechen
          </Button>
        </div>
        <button
          className="mt-6 w-fit cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSubmit("draft")}
          disabled={isSubmitting}
        >
          {mode === "edit" ? "Als Entwurf speichern" : "Entwurf speichern"}
        </button>
      </div>
    </div>
  );
};

export default CourseCreateView;
