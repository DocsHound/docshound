-- CreateTable
CREATE TABLE "SlackChannelIndexLog" (
    "channelID" TEXT NOT NULL,
    "latestTS" TEXT NOT NULL,
    "nMessages" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlackChannelIndexLog_pkey" PRIMARY KEY ("channelID","latestTS")
);

alter table "SlackChannelIndexLog" enable row level security;