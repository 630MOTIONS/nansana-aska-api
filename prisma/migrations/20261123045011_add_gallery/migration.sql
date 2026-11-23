-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('match_day', 'training', 'squads', 'supporters', 'events');

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled photo',
    "caption" TEXT NOT NULL DEFAULT '',
    "category" "GalleryCategory" NOT NULL,
    "meta" TEXT,
    "wide" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryPhoto_published_createdAt_idx" ON "GalleryPhoto"("published", "createdAt");

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
