"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getCourseById } from "../../actions/course-actions";
import { toast } from "sonner";
import CourseCreateView from "./course-create-view";
import { Course } from "../../types/course.types";

interface CourseEditViewProps {
  courseId: string;
  customSports: Array<{ value: string; label: string }>;
}

const CourseEditView = ({ courseId, customSports }: CourseEditViewProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [courseData, setCourseData] = useState<Course | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchCourse = async () => {
      if (alive) setIsLoading(true);
      const result = await getCourseById(courseId);

      if (result.success && result.course) {
        if (alive) setCourseData(result.course);
      } else {
        toast.error(result.error || "Fehler beim Laden des Kurses");
        router.push("/courses");
      }
      if (alive) setIsLoading(false);
    };

    fetchCourse();
    return () => {
      alive = false;
    };
  }, [courseId, router]);

  if (isLoading) {
    return (
      <div className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-2xl shadow-sm p-8 space-y-6 mt-4">
        <Skeleton className="h-7 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    );
  }

  if (!courseData) {
    return null;
  }

  return (
    <CourseCreateView
      mode="edit"
      courseId={courseId}
      initialData={courseData}
      customSports={customSports}
    />
  );
};

export default CourseEditView;
