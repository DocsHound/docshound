/*
  Warnings:

  - Changed the type of `latestModified` on the `ConfCloudIndexLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ConfCloudIndexLog" DROP COLUMN "latestModified",
ADD COLUMN     "latestModified" TIMESTAMP(3) NOT NULL;
