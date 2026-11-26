-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'image/webp',
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_imageId_width_key" ON "MediaVariant"("imageId", "width");
