-- Migration: add_standing_order_instances
-- Adds endDate, weekdayTimings, and parentCourseId (self-relation) to Course

ALTER TABLE "Course"
  ADD COLUMN "weekdayTimings" JSONB,
  ADD COLUMN "endDate" TIMESTAMP(3),
  ADD COLUMN "parentCourseId" TEXT;

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_parentCourseId_fkey"
  FOREIGN KEY ("parentCourseId")
  REFERENCES "Course"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE INDEX "Course_parentCourseId_idx" ON "Course"("parentCourseId");
CREATE INDEX "Course_parentCourseId_date_idx" ON "Course"("parentCourseId", "date");
