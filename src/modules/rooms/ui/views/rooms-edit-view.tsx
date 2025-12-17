"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoomById } from "../../actions/room-actions";
import { toast } from "sonner";
import RoomsCreateView from "./rooms-create-view";
import { Room } from "../../types/room.types";

interface RoomsEditViewProps {
  roomId: string;
}

const RoomsEditView = ({ roomId }: RoomsEditViewProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [roomData, setRoomData] = useState<Room | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchRoom = async () => {
      if (alive) setIsLoading(true);
      const result = await getRoomById(roomId);

      if (result.success && result.room) {
        if (alive) setRoomData(result.room);
      } else {
        toast.error(result.error || "Fehler beim Laden des Raumes");
        router.push("/rooms");
      }
      if (alive) setIsLoading(false);
    };

    fetchRoom();
    return () => {
      alive = false;
    };
  }, [roomId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Raum wird geladen...</p>
      </div>
    );
  }

  if (!roomData) {
    return null;
  }

  return <RoomsCreateView mode="edit" roomId={roomId} initialData={roomData} />;
};

export default RoomsEditView;
