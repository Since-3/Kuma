/*
  Warnings:

  - You are about to drop the column `time` on the `Course` table. All the data in the column will be lost.
  - Added the required column `timeFrom` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeTo` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "time",
ADD COLUMN     "timeFrom" TEXT NOT NULL,
ADD COLUMN     "timeTo" TEXT NOT NULL;
