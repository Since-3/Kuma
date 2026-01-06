-- CreateTable
CREATE TABLE "CourseBooking" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseBooking_courseId_idx" ON "CourseBooking"("courseId");

-- CreateIndex
CREATE INDEX "CourseBooking_userId_idx" ON "CourseBooking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseBooking_courseId_userId_key" ON "CourseBooking"("courseId", "userId");

-- AddForeignKey
ALTER TABLE "CourseBooking" ADD CONSTRAINT "CourseBooking_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseBooking" ADD CONSTRAINT "CourseBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
