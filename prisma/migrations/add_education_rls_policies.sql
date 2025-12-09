-- Migration: add_education_rls_policies
-- Created: 2025-01-21
-- Description: Add Row Level Security (RLS) policies for education tables

-- ============================================
-- 1. education_videos 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE "education_videos" ENABLE ROW LEVEL SECURITY;

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
-- 2. knowhow 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE "knowhow" ENABLE ROW LEVEL SECURITY;

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
-- 3. resources 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;

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
-- 모든 RLS 정책이 적용되었습니다.
-- - education_videos: Public Read, Authenticated Write
-- - knowhow: Public Read, Authenticated Write
-- - resources: Public Read, Authenticated Write
