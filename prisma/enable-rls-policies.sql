-- ================================================
-- Row Level Security (RLS) 정책 설정
-- ================================================
-- 실행 방법: Supabase Dashboard → SQL Editor → 이 파일 내용 복사 후 실행
-- ================================================

-- 1. 모든 테이블에 RLS 활성화
-- ================================================

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "matching_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_metadata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. Customer 테이블 정책 (사용자는 자기 데이터만 접근)
-- ================================================

-- SELECT: 사용자는 자신의 고객만 조회
CREATE POLICY "Users can view own customers"
ON "customers"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

-- INSERT: 사용자는 자신의 고객만 생성
CREATE POLICY "Users can insert own customers"
ON "customers"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

-- UPDATE: 사용자는 자신의 고객만 수정
CREATE POLICY "Users can update own customers"
ON "customers"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- DELETE: 사용자는 자신의 고객만 삭제
CREATE POLICY "Users can delete own customers"
ON "customers"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- ================================================
-- 3. Program 테이블 정책 (모든 사용자 읽기만 가능)
-- ================================================

-- SELECT: 모든 인증된 사용자가 프로그램 조회 가능
CREATE POLICY "Authenticated users can view programs"
ON "programs"
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: 서비스 역할만 가능 (정책 없음 = API에서만 수정)
-- 서비스 역할(service_role)은 RLS를 우회하므로 별도 정책 불필요

-- ================================================
-- 4. CustomerProgram 테이블 정책 (관심목록)
-- ================================================

-- SELECT: 사용자는 자신의 관심목록만 조회
CREATE POLICY "Users can view own watchlist"
ON "customer_programs"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "customers"
    WHERE "customers"."id" = "customer_programs"."customerId"
    AND "customers"."userId" = auth.uid()::text
  )
);

-- INSERT: 사용자는 자신의 고객에만 추가
CREATE POLICY "Users can insert own watchlist"
ON "customer_programs"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "customers"
    WHERE "customers"."id" = "customer_programs"."customerId"
    AND "customers"."userId" = auth.uid()::text
  )
);

-- DELETE: 사용자는 자신의 관심목록만 삭제
CREATE POLICY "Users can delete own watchlist"
ON "customer_programs"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "customers"
    WHERE "customers"."id" = "customer_programs"."customerId"
    AND "customers"."userId" = auth.uid()::text
  )
);

-- ================================================
-- 5. MatchingResult 테이블 정책
-- ================================================

-- SELECT: 사용자는 자신의 매칭 결과만 조회
CREATE POLICY "Users can view own matching results"
ON "matching_results"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "customers"
    WHERE "customers"."id" = "matching_results"."customerId"
    AND "customers"."userId" = auth.uid()::text
  )
);

-- INSERT/UPDATE/DELETE: API에서만 (서비스 역할)

-- ================================================
-- 6. SyncMetadata 테이블 정책 (읽기만 허용)
-- ================================================

-- SELECT: 인증된 사용자만 조회 가능
CREATE POLICY "Authenticated users can view sync metadata"
ON "sync_metadata"
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: 서비스 역할만 (정책 없음)

-- ================================================
-- 7. Invitation 테이블 정책 (초대 신청)
-- ================================================

-- SELECT: 누구나 자신의 초대 신청 조회 가능 (email 기준)
CREATE POLICY "Users can view own invitations"
ON "invitations"
FOR SELECT
TO authenticated
USING (auth.jwt()->>'email' = email);

-- INSERT: 인증되지 않은 사용자도 초대 신청 가능 (회원가입 전)
CREATE POLICY "Anyone can insert invitations"
ON "invitations"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: 관리자만 (서비스 역할)
-- DELETE: 관리자만 (서비스 역할)

-- ================================================
-- 완료!
-- ================================================
-- 적용 후 확인:
-- 1. Supabase Dashboard → Table Editor → 각 테이블 → "RLS enabled" 표시 확인
-- 2. 프론트엔드에서 다른 사용자 데이터 접근 시도 → 차단되어야 함
-- 3. API 라우트는 Service Role Key 사용 → RLS 우회
-- ================================================
