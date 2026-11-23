-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('goalkeeper', 'defender', 'winger', 'pivot');

-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('captain', 'vice_captain');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('right', 'left', 'both');

-- CreateEnum
CREATE TYPE "StaffGroup" AS ENUM ('technical', 'management');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "squad" "Squad" NOT NULL,
    "number" INTEGER,
    "position" "PlayerPosition" NOT NULL,
    "role" "PlayerRole",
    "foot" "PreferredFoot",
    "appearances" INTEGER,
    "goals" INTEGER,
    "cleanSheets" INTEGER,
    "saves" INTEGER,
    "photoId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kicker" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "group" "StaffGroup" NOT NULL DEFAULT 'technical',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "photoId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Player_squad_published_idx" ON "Player"("squad", "published");

-- CreateIndex
CREATE INDEX "StaffMember_group_published_sortOrder_idx" ON "StaffMember"("group", "published", "sortOrder");
