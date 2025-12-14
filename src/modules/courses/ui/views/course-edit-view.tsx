"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCourseById } from "../../actions/course-actions";
import { toast } from "sonner";
import CourseCreateView from "./course-create-view";
import { Course } from "../../types/course.types";

interface CourseEditViewProps {
  courseId: string;
}

const CourseEditView = ({ courseId }: CourseEditViewProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [courseData, setCourseData] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      const result = await getCourseById(courseId);

      if (result.success && result.course) {
        setCourseData(result.course);
      } else {
        toast.error(result.error || "Fehler beim Laden des Kurses");
        router.push("/courses/myCourses");
      }
      setIsLoading(false);
    };

    fetchCourse();
  }, [courseId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Kurs wird geladen...</p>
      </div>
    );
  }

  if (!courseData) {
    return null;
  }

  return <CourseCreateView mode="edit" courseId={courseId} initialData={courseData} />;
};

export default CourseEditView;
