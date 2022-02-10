/*
  Warnings:

  - Added the required column `fullIndex` to the `ConfCloudIndexLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConfCloudIndexLog" ADD COLUMN     "fullIndex" BOOLEAN NOT NULL;
