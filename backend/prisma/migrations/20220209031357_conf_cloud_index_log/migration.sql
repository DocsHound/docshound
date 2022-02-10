-- CreateTable
CREATE TABLE "ConfCloudIndexLog" (
    "id" SERIAL NOT NULL,
    "latestModified" TEXT NOT NULL,
    "nResults" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfCloudIndexLog_pkey" PRIMARY KEY ("id")
);

-- >>> BEGIN RLS/POLICY <<< 

alter table public."ConfCloudIndexLog" enable row level security;

-- >>> END RLS/POLICY <<< 