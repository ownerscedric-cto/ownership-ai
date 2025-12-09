-- Migration: add_education_models + RLS policies
-- Created: 2025-01-21
-- Description: Add EducationVideo, KnowHow, Resource tables for Phase 5 with RLS policies
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

-- ============================================
-- 1. 교육 비디오 콘텐츠 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS "education_videos" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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

-- ============================================
-- 2. 노하우 아카이브 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS "knowhow" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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

-- ============================================
-- 3. 자료실 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS "resources" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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

-- ============================================
-- 4. updatedAt 자동 업데이트 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. updatedAt 트리거 적용
-- ============================================
DROP TRIGGER IF EXISTS update_education_videos_updated_at ON "education_videos";
CREATE TRIGGER update_education_videos_updated_at
  BEFORE UPDATE ON "education_videos"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowhow_updated_at ON "knowhow";
CREATE TRIGGER update_knowhow_updated_at
  BEFORE UPDATE ON "knowhow"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON "resources";
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON "resources"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS (Row Level Security) 활성화
-- ============================================
ALTER TABLE "education_videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowhow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. education_videos RLS 정책
-- ============================================

-- 기존 정책 삭제 (재실행 안전성)
DROP POLICY IF EXISTS "education_videos_select_policy" ON "education_videos";
DROP POLICY IF EXISTS "education_videos_insert_policy" ON "education_videos";
DROP POLICY IF EXISTS "education_videos_update_policy" ON "education_videos";
DROP POLICY IF EXISTS "education_videos_delete_policy" ON "education_videos";

-- 모든 사용자가 조회 가능 (Public Read)
CREATE POLICY "education_videos_select_policy"
ON "education_videos"
FOR SELECT
TO public
USING (true);

-- 인증된 사용자만 생성 가능
CREATE POLICY "education_videos_insert_policy"
ON "education_videos"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 인증된 사용자만 수정 가능
CREATE POLICY "education_videos_update_policy"
ON "education_videos"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 인증된 사용자만 삭제 가능
CREATE POLICY "education_videos_delete_policy"
ON "education_videos"
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 8. knowhow RLS 정책
-- ============================================

-- 기존 정책 삭제 (재실행 안전성)
DROP POLICY IF EXISTS "knowhow_select_policy" ON "knowhow";
DROP POLICY IF EXISTS "knowhow_insert_policy" ON "knowhow";
DROP POLICY IF EXISTS "knowhow_update_policy" ON "knowhow";
DROP POLICY IF EXISTS "knowhow_delete_policy" ON "knowhow";

-- 모든 사용자가 조회 가능 (Public Read)
CREATE POLICY "knowhow_select_policy"
ON "knowhow"
FOR SELECT
TO public
USING (true);

-- 인증된 사용자만 생성 가능
CREATE POLICY "knowhow_insert_policy"
ON "knowhow"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 인증된 사용자만 수정 가능
CREATE POLICY "knowhow_update_policy"
ON "knowhow"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 인증된 사용자만 삭제 가능
CREATE POLICY "knowhow_delete_policy"
ON "knowhow"
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 9. resources RLS 정책
-- ============================================

-- 기존 정책 삭제 (재실행 안전성)
DROP POLICY IF EXISTS "resources_select_policy" ON "resources";
DROP POLICY IF EXISTS "resources_insert_policy" ON "resources";
DROP POLICY IF EXISTS "resources_update_policy" ON "resources";
DROP POLICY IF EXISTS "resources_delete_policy" ON "resources";

-- 모든 사용자가 조회 가능 (Public Read)
CREATE POLICY "resources_select_policy"
ON "resources"
FOR SELECT
TO public
USING (true);

-- 인증된 사용자만 생성 가능
CREATE POLICY "resources_insert_policy"
ON "resources"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 인증된 사용자만 수정 가능
CREATE POLICY "resources_update_policy"
ON "resources"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 인증된 사용자만 삭제 가능
CREATE POLICY "resources_delete_policy"
ON "resources"
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 완료 메시지
-- ============================================
SELECT 'Migration completed successfully!' AS status;
SELECT '✅ Tables created: education_videos, knowhow, resources' AS message;
SELECT '✅ Indexes created for category, videoType, type, createdAt' AS message;
SELECT '✅ Triggers added for automatic updatedAt' AS message;
SELECT '✅ RLS policies applied: Public Read, Authenticated Write' AS message;
