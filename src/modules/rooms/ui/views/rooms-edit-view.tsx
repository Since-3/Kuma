"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
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
      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-8 space-y-6 mt-4">
        <Skeleton className="h-7 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    );
  }

  if (!roomData) {
    return null;
  }

  return <RoomsCreateView mode="edit" roomId={roomId} initialData={roomData} />;
};

export default RoomsEditView;
