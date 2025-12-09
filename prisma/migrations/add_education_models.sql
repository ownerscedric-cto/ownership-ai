-- Migration: add_education_models
-- Created: 2025-01-21
-- Description: Add EducationVideo, KnowHow, Resource tables for Phase 5

-- 교육 비디오 콘텐츠 (Phase 5: VOD 및 교육 콘텐츠)
CREATE TABLE IF NOT EXISTS "education_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "videoType" TEXT NOT NULL DEFAULT 'youtube',
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_videos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "education_videos_category_idx" ON "education_videos"("category");
CREATE INDEX IF NOT EXISTS "education_videos_videoType_idx" ON "education_videos"("videoType");
CREATE INDEX IF NOT EXISTS "education_videos_createdAt_idx" ON "education_videos"("createdAt" DESC);

-- 노하우 아카이브 (Phase 5: VOD 및 교육 콘텐츠)
CREATE TABLE IF NOT EXISTS "knowhow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowhow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "knowhow_category_idx" ON "knowhow"("category");
CREATE INDEX IF NOT EXISTS "knowhow_createdAt_idx" ON "knowhow"("createdAt" DESC);

-- 자료실 - 템플릿, 체크리스트, 참고 문서 (Phase 5: VOD 및 교육 콘텐츠)
CREATE TABLE IF NOT EXISTS "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "resources_type_idx" ON "resources"("type");
CREATE INDEX IF NOT EXISTS "resources_createdAt_idx" ON "resources"("createdAt" DESC);
