-- CreateTable
CREATE TABLE "SiteImage" (
    "key" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("key")
);
