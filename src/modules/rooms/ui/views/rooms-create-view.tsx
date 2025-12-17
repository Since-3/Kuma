"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InputComponent from "@/src/components/layout/InputComponent";
import { Button } from "@/src/components/ui/button";
import { createRoom, updateRoom } from "../../actions/room-actions";
import { toast } from "sonner";
import { Room } from "../../types/room.types";

interface RoomsCreateViewProps {
  mode?: "create" | "edit";
  roomId?: string;
  initialData?: Room;
}

const RoomsCreateView = ({ mode = "create", roomId, initialData }: RoomsCreateViewProps = {}) => {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data when in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setRoomName(initialData.name || "");
    }
  }, [mode, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!roomName.trim()) newErrors.name = "Raumname ist erforderlich";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus");
      return;
    }

    setIsSubmitting(true);

    try {
      const roomData = {
        name: roomName,
      };

      if (mode === "edit" && !roomId) {
        throw new Error("Missing roomId in edit mode");
      }

      const result =
        mode === "edit" ? await updateRoom(roomId!, roomData) : await createRoom(roomData);

      if (result.success) {
        toast.success(result.message);
        router.push("/rooms");
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
      <h1 className="text-3xl font-bold">{mode === "edit" ? "Raum bearbeiten" : "Raum anlegen"}</h1>
      <p className="text-xl mt-2">
        {mode === "edit"
          ? "Ändern Sie den Raumnamen und speichern Sie Ihre Änderungen"
          : "Alle Räume können nach dem Speichern angepasst oder gelöscht werden"}
      </p>
      <div className="mt-6 flex flex-col gap-4 max-w-xl">
        <div>
          <InputComponent
            isLabel
            label="Name"
            type="text"
            id="room-create-name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Wird gespeichert..."
              : mode === "edit"
                ? "Änderungen speichern"
                : "Raum erstellen"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/rooms")} disabled={isSubmitting}>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomsCreateView;
