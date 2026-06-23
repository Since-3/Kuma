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
import { createCourse, updateCourse, getMyBusinesses } from "../../actions/course-actions";
import { getMyRooms } from "@/src/modules/rooms/actions/room-actions";
import { getMyTrainers } from "@/src/modules/employee/actions/employee-actions";
import { toast } from "sonner";
import { Course } from "../../types/course.types";
import { Trash2, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import DeleteDialog from "@/src/components/layout/DeleteDialog";
import { useDeleteCourse } from "../../hooks/useDeleteCourse";

const LEVELS = [
  { value: "any", label: "Jedes Niveau" },
  { value: "beginner", label: "Anfänger" },
  { value: "advanced", label: "Fortgeschrittene" },
  { value: "pro", label: "Profi" },
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
  customSports?: Array<{ value: string; label: string }>;
}

const CourseCreateView = ({
  mode = "create",
  courseId,
  initialData,
  customSports = [],
}: CourseCreateViewProps = {}) => {
  const router = useRouter();
  const isEdit = mode === "edit" && !!initialData;

  const [courseName, setCourseName] = useState(isEdit ? initialData!.name || "" : "");
  const [courseDate, setCourseDate] = useState(() => {
    if (isEdit && initialData!.date) {
      const d = new Date(initialData!.date);
      return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-");
    }
    return "";
  });
  const [timeFrom, setTimeFrom] = useState(isEdit ? initialData!.timeFrom || "" : "");
  const [timeTo, setTimeTo] = useState(isEdit ? initialData!.timeTo || "" : "");
  const [selectedSports, setSelectedSports] = useState<string[]>(
    isEdit ? initialData!.sport || [] : []
  );
  const [sports, setSports] = useState<Array<{ value: string; label: string }>>(() => {
    if (isEdit) {
      const existingValues = new Set(customSports.map((s) => s.value));
      const extra = (initialData!.sport || [])
        .filter((s) => !existingValues.has(s))
        .map((s) => ({ value: s, label: s }));
      return [...customSports, ...extra];
    }
    return customSports;
  });
  const [newlyCreatedSports, setNewlyCreatedSports] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(isEdit ? initialData!.level || "" : "");
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>(
    isEdit ? initialData!.trainers || [] : []
  );
  const [selectedRoom, setSelectedRoom] = useState(isEdit ? initialData!.room || "" : "");
  const [description, setDescription] = useState(isEdit ? initialData!.description || "" : "");
  const [maxParticipants, setMaxParticipants] = useState(
    isEdit ? initialData!.maxParticipants?.toString() || "" : ""
  );
  const [isStandingOrder, setIsStandingOrder] = useState(
    isEdit ? initialData!.isStandingOrder || false : false
  );
  const [selectedFrequency, setSelectedFrequency] = useState(
    isEdit ? initialData!.frequency || "" : ""
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    isEdit ? initialData!.weekdays || [] : []
  );
  const [price, setPrice] = useState(isEdit ? initialData!.price?.toString() || "" : "");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [trainers, setTrainers] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    isEdit ? (initialData!.businessId ?? "") : ""
  );
  const [businesses, setBusinesses] = useState<Array<{ value: string; label: string }>>([]);
  const [coverImage, setCoverImage] = useState<string | null>(
    isEdit ? (initialData!.coverImage ?? null) : null
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    courseToDelete,
    setCourseToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useDeleteCourse({
    onSuccess: () => router.push("/courses"),
  });

  // Load businesses from database
  useEffect(() => {
    const loadBusinesses = async () => {
      const result = await getMyBusinesses();
      if (result.success) {
        const opts = result.businesses.map((b) => ({ value: b.id, label: b.name }));
        setBusinesses(opts);
        if (opts.length === 1) setSelectedBusinessId(opts[0].value);
      } else {
        toast.error("Fehler beim Laden der Standorte. Bitte laden Sie die Seite neu.");
      }
    };
    loadBusinesses();
  }, []);

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

  // Load trainers from database
  useEffect(() => {
    const loadTrainers = async () => {
      setIsLoadingTrainers(true);
      const result = await getMyTrainers();
      if (result.success) {
        setTrainers(result.trainers);
      }
      setIsLoadingTrainers(false);
    };
    loadTrainers();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/course-image", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCoverImage(json.publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Hochladen");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!courseName.trim()) newErrors.name = "Kursname ist erforderlich";
    if (selectedSports.length === 0) newErrors.sport = "Mindestens eine Sportart ist erforderlich";
    if (!courseDate) newErrors.date = "Datum ist erforderlich";
    if (!timeFrom) newErrors.timeFrom = "Anfangszeit ist erforderlich";
    if (!timeTo) newErrors.timeTo = "Endzeit ist erforderlich";

    // Validate that timeFrom is before timeTo
    if (timeFrom && timeTo && timeFrom >= timeTo) {
      newErrors.timeTo = "Endzeit muss nach der Anfangszeit liegen";
    }

    if (!selectedRoom) newErrors.room = "Raum ist erforderlich";

    const maxPart = parseInt(maxParticipants);
    if (!maxParticipants || isNaN(maxPart) || maxPart < 1) {
      newErrors.maxParticipants = "Mindestens 1 Teilnehmer erforderlich";
    } else if (maxPart > 100) {
      newErrors.maxParticipants = "Maximal 100 Teilnehmer erlaubt";
    }

    const priceValue = parseFloat(price);
    if (!price.trim()) {
      newErrors.price = "Preis ist erforderlich";
    } else if (isNaN(priceValue) || priceValue < 0) {
      newErrors.price = "Preis muss eine gültige positive Zahl sein";
    } else if (priceValue > 9999.99) {
      newErrors.price = "Preis darf maximal 9.999,99 € betragen";
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

  const validateDraft = () => {
    const newErrors: Record<string, string> = {};
    if (!courseName.trim()) newErrors.name = "Kursname ist erforderlich";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (status === "published" && !validateForm()) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus");
      return;
    }
    if (status === "draft" && !validateDraft()) {
      toast.error("Bitte geben Sie mindestens einen Kursnamen ein");
      return;
    }

    setIsSubmitting(true);

    try {
      const courseData = {
        name: courseName,
        sport: selectedSports,
        level: selectedLevel,
        date: courseDate,
        timeFrom: timeFrom,
        timeTo: timeTo,
        trainers: selectedTrainers.length > 0 ? selectedTrainers : undefined,
        room: selectedRoom,
        description,
        coverImage: coverImage ?? undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        price: price ? parseFloat(price) : undefined,
        isStandingOrder,
        frequency: selectedFrequency || undefined,
        weekdays: selectedWeekdays.length > 0 ? selectedWeekdays : undefined,
        businessId: selectedBusinessId || undefined,
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
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === "edit" ? "Kurs bearbeiten" : "Kurs anlegen"}
          </h1>
          <p className="text-xl mt-2">
            {mode === "edit"
              ? "Ändern Sie die Kursdetails und speichern Sie Ihre Änderungen"
              : "Alle Kurse können nach dem Speichern angepasst oder gelöscht werden"}
          </p>
        </div>
        {mode === "edit" && (
          <Button variant="destructive" onClick={() => handleDeleteClick(courseId!, courseName)}>
            <Trash2 className="mb-1" /> Löschen
          </Button>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-4 max-w-xl">
        {businesses.length > 1 && (
          <GenericDropdown
            label="Standort"
            selected={selectedBusinessId}
            onSelect={setSelectedBusinessId}
            options={businesses}
            placeholder="Standort auswählen"
          />
        )}
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

        <MultiSelectDropdown
          label="Sportart"
          labelButton="Neue Sportart anlegen"
          selected={selectedSports}
          onSelect={setSelectedSports}
          options={sports}
          allowCreate={true}
          onCreateOption={(newSport) => {
            setSports([...sports, newSport]);
            setNewlyCreatedSports([...newlyCreatedSports, newSport.value]);
          }}
          onDeleteOption={(valueToDelete) => {
            setSports(sports.filter((s) => s.value !== valueToDelete));
            setNewlyCreatedSports(newlyCreatedSports.filter((v) => v !== valueToDelete));
            setSelectedSports(selectedSports.filter((v) => v !== valueToDelete));
          }}
          deletableValues={newlyCreatedSports}
          error={errors.sport}
        />

        <GenericDropdown
          label="Niveau"
          selected={selectedLevel}
          onSelect={setSelectedLevel}
          options={LEVELS}
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

        <div>
          <InputComponent
            isLabel
            label="Preis (€)"
            type="text"
            id="course-create-price"
            value={
              isPriceFocused
                ? priceDisplay
                : price
                  ? parseFloat(price).toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              // Remove all non-numeric characters except comma and dot
              const cleanValue = value.replace(/[^\d,\.]/g, "");
              // Replace comma with dot for internal storage
              const normalizedValue = cleanValue.replace(",", ".");

              setPriceDisplay(value);
              // Allow empty string, numbers with optional decimal point and max 2 decimal places
              if (normalizedValue === "" || /^\d*\.?\d{0,2}$/.test(normalizedValue)) {
                setPrice(normalizedValue);
              }
            }}
            onFocus={() => {
              setIsPriceFocused(true);
              setPriceDisplay(price.replace(".", ","));
            }}
            onBlur={() => {
              setIsPriceFocused(false);
            }}
            placeholder="0,00"
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        {!isLoadingTrainers && trainers.length > 0 && (
          <div>
            <MultiSelectDropdown
              label="Trainer"
              selected={selectedTrainers}
              onSelect={setSelectedTrainers}
              options={trainers}
              error={errors.trainers}
            />
          </div>
        )}

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

        {/* Kursbild */}
        <div>
          <p className="text-lg font-bold mb-2 mt-2">Kursbild (optional)</p>
          {coverImage ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
              <Image src={coverImage} alt="Kursbild" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
              {isUploadingImage ? (
                <span className="text-sm text-gray-500">Wird hochgeladen…</span>
              ) : (
                <>
                  <ImagePlus size={24} className="text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">Bild auswählen (max. 5 MB)</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingImage}
                onChange={handleImageUpload}
              />
            </label>
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
          className="mt-6 mb-4 w-fit cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSubmit("draft")}
          disabled={isSubmitting}
        >
          {mode === "edit" ? "Als Entwurf speichern" : "Entwurf speichern"}
        </button>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setCourseToDelete(null);
        }}
        itemName={courseToDelete?.name}
        topicName="Kurs"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CourseCreateView;
