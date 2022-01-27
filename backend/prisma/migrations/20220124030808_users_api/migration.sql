-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "role" "AppRole" NOT NULL DEFAULT E'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalApiCredential" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptionIV" TEXT NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,

    CONSTRAINT "GlobalApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalApiCredential_provider_key" ON "GlobalApiCredential"("provider");
