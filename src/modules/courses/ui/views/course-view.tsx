"use client";

import { Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";
import CourseListView from "./course-list-view";

interface CourseViewProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const CourseView = ({ canCreate, canEdit, canDelete }: CourseViewProps) => {
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
        <CourseListView canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
      </Suspense>
    </div>
  );
};

export default CourseView;
