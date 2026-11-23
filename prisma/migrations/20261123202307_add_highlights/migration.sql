-- CreateEnum
CREATE TYPE "VideoCategory" AS ENUM ('match', 'goals', 'recaps', 'training', 'behind', 'interviews');

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" "VideoCategory" NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "youtubeId" TEXT,
    "thumbnailId" TEXT,
    "thumbnailAuto" BOOLEAN NOT NULL DEFAULT false,
    "kicker" TEXT,
    "badge" TEXT,
    "duration" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spotlight" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "matchSlug" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Highlight_published_date_idx" ON "Highlight"("published", "date");
