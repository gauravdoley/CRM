/*
  Warnings:

  - Added the required column `createdById` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Made the column `assignedToId` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_assignedToId_fkey";

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "createdById" TEXT NOT NULL,
ALTER COLUMN "assignedToId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "name" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
