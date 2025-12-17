"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import RoomsListView from "./rooms-list-view";

const RoomsView = () => {
  const router = useRouter();
  const [deleteMode, setDeleteMode] = useState(false);

  return (
    <div>
      <div className="w-full flex flex-col items-left p-2 md:flex-row md:justify-between md:items-center">
        <h1 className="text-4xl font-bold">Räume</h1>
        <div className="flex flex-col gap-2 mt-2 md:flex-row md:mt-0">
          <Button
            onClick={() => router.push("/rooms/create")}
            className="text-sm tracking-wide font-normal"
          >
            Raum anlegen
          </Button>
          <Button
            variant={deleteMode ? "destructive" : "outline"}
            onClick={() => setDeleteMode(!deleteMode)}
            className="text-sm tracking-wide font-normal"
          >
            {deleteMode ? "Abbrechen" : "Raum löschen"}
          </Button>
        </div>
      </div>
      <RoomsListView deleteMode={deleteMode} />
    </div>
  );
};

export default RoomsView;
