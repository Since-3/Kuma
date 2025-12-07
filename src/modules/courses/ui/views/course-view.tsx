"use client";

import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";

const CourseView = () => {
  const router = useRouter();

  return (
    <div>
      <div className="w-full flex items-center justify-between p-2">
        <h1 className="text-4xl font-bold">Kurse</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => router.push("/courses/create")}
            className="text-sm tracking-wide font-normal"
          >
            Kurs anlegen
          </Button>
          <Button variant="outline" className="text-sm tracking-wide font-normal">
            Kurs löschen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
