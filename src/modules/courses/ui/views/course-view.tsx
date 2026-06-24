"use client";

import { Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import CourseListView from "./course-list-view";

type Course = {
  id: string;
  name: string;
  sport: string[];
  level: string;
  date: Date;
  timeFrom: string;
  timeTo: string;
  trainers: string[];
  room: string;
  description: string;
  maxParticipants: number;
  price: number;
  isStandingOrder: boolean;
  frequency: string | null;
  weekdays: string[];
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  coverImage: string | null;
  _count?: { bookings: number };
};

interface CourseViewProps {
  initialCourses: Course[];
  initialDateFrom: Date;
  initialDateTo: Date;
  roomsMap: Record<string, string>;
  trainersMap: Record<string, { label: string; pbSrc?: string }>;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const CourseView = ({
  initialCourses,
  initialDateFrom,
  initialDateTo,
  roomsMap,
  trainersMap,
  canCreate,
  canEdit,
  canDelete,
}: CourseViewProps) => {
  const router = useRouter();

  return (
    <div>
      <div className="w-full flex flex-col items-left p-2 md:flex-row md:justify-between md:items-center">
        <h1 className="text-4xl font-bold">Kurse</h1>
        <div className="flex flex-col gap-4 mt-2 md:flex-row md:mt-0">
          {canCreate && (
            <Button
              onClick={() => router.push("/courses/create")}
              className="hidden sm:flex text-sm tracking-wide font-normal"
            >
              Kurs anlegen
            </Button>
          )}
        </div>
      </div>
      <Suspense>
        <CourseListView
          initialCourses={initialCourses}
          initialDateFrom={initialDateFrom}
          initialDateTo={initialDateTo}
          roomsMap={roomsMap}
          trainersMap={trainersMap}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </Suspense>
    </div>
  );
};

export default CourseView;
