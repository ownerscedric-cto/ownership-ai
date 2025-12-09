# Current Phase: Phase 5 - 교육 콘텐츠 및 VOD 제공 페이지 🎬

**목표**: 컨설턴트 전문성 향상을 위한 교육 콘텐츠 시스템 구축

**전체 진행 상황**: Phase 5 / 9 Phases 🚀 **Phase 5 시작!**

**이전 Phase**: ✅ Phase 4 완료 (업종/키워드/지역 매칭 시스템)

**Phase 5 진행 현황**: 🔄 **ISSUE-25 완료, ISSUE-26 진행 준비**

- ✅ ISSUE-25: 교육 콘텐츠 데이터 모델 및 API 구현 (완료)
- ⏳ ISSUE-26: VOD 플레이어 및 교육 콘텐츠 UI 개발 (대기)
- ⏳ ISSUE-27: 노하우 아카이브 및 자료실 구현 (대기)

---

## 🎉 Phase 3 완료 요약

### ✅ 완료된 작업

**ISSUE-06: 다중 공공데이터 API 통합 연동** ✅

- ✅ Program Prisma 모델 (dataSource, sourceApiId, registeredAt, attachmentUrl 등 전체 필드)
- ✅ 4개 API 클라이언트 (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)
- ✅ ProgramSyncOrchestrator (병렬 동기화, Promise.allSettled)
- ✅ 증분 동기화 지원 (SyncMetadata 모델)
- ✅ Exponential Backoff Retry 로직
- ✅ HTML 엔티티 디코딩 (KOCCA-Finance)
- ✅ POST /api/programs/sync (수동 동기화)
- ✅ GET /api/programs (목록 조회, 교차 정렬, 필터링)
- ✅ GET /api/programs/[id] (상세 조회)

**ISSUE-07: 정부지원사업 UI 컴포넌트 개발** ✅

- ✅ ProgramList, ProgramCard, ProgramDetail 컴포넌트
- ✅ ProgramFilters (dataSource, 키워드 검색)
- ✅ DeadlineBadge (마감일 표시)
- ✅ React Query 설정 (usePrograms, useProgram)
- ✅ /programs (목록 페이지), /programs/[id] (상세 페이지)
- ✅ Loading/Error 상태, 모바일 반응형

**추가 기능** ✅

- ✅ CustomerProgram 모델 (관심 목록)
- ✅ CustomerWatchlist 컴포넌트
- ✅ CustomerSelectDialog 컴포넌트
- ✅ useWatchlist, useAddToWatchlist, useRemoveFromWatchlist hooks
- ✅ POST /api/customers/[id]/watchlist (관심 목록 추가/삭제)

**Phase 3 추가 개선 (2025-01-21)** ✅

- ✅ Vercel Cron Job 설정 (매일 새벽 2시 자동 동기화)
  - vercel.json cron 설정 (0 17 \* \* \* = UTC 17:00 = KST 02:00)
  - CRON_SECRET 인증 추가
  - GET /api/cron/sync-programs 엔드포인트 활용
- ✅ CustomerWatchlist UI 개선
  - Grid 레이아웃 적용 (모바일 1열, 태블릿 2열, 데스크탑 3열)
  - ProgramCard 스타일 통일 (shadcn/ui Card 컴포넌트)
  - 데이터 소스 컬러풀 Badge, DeadlineBadge 추가
- ✅ Next.js 보안 업데이트
  - 16.0.3 → 16.0.7 업데이트
  - CVE-2025-66478 Critical 취약점 해결
  - Vercel 배포 에러 해결

---

## 📋 Phase 5 ISSUE 목록

### 📋 ISSUE-25: 교육 콘텐츠 데이터 모델 및 API 구현

**상태**: ✅ 완료 (2025-01-21)
**목표**: VOD 콘텐츠, 노하우 아카이브, 자료실을 위한 데이터베이스 모델 및 CRUD API 개발
**의존성**: ✅ Phase 4 완료
**완료 기간**: 1일
**난이도**: 중

**핵심 기술**:

- **Prisma 스키마**: EducationVideo, KnowHow, Resource 모델
- **Supabase Storage**: 비디오 파일 및 자료 저장
- **CRUD API**: 교육 콘텐츠 관리 엔드포인트
- **파일 업로드**: 비디오, 문서 파일 업로드 처리

**작업 내용**:

1. **Prisma 스키마 작성**:

   ```prisma
   // 교육 비디오 콘텐츠
   model EducationVideo {
     id            String   @id @default(uuid())
     title         String
     description   String?
     category      String   // "개요", "분야별", "신청서작성", "성공사례"
     videoUrl      String   // YouTube URL, Vimeo URL, 또는 Supabase Storage URL
     videoType     String   @default("youtube") // "youtube", "vimeo", "file"
     thumbnailUrl  String?
     duration      Int?     // 초 단위
     viewCount     Int      @default(0)
     tags          String[]
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt

     @@index([category])
     @@index([videoType])
     @@index([createdAt(sort: Desc)])
   }

   // 노하우 아카이브
   model KnowHow {
     id          String   @id @default(uuid())
     title       String
     content     String   @db.Text // Markdown 지원
     category    String   // "업종별", "사업별", "팁", "주의사항"
     author      String?
     tags        String[]
     viewCount   Int      @default(0)
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@index([category])
     @@index([createdAt(sort: Desc)])
   }

   // 자료실 (템플릿, 체크리스트, 참고 문서)
   model Resource {
     id          String   @id @default(uuid())
     title       String
     description String?
     type        String   // "template", "checklist", "document"
     fileUrl     String   // Supabase Storage URL
     fileName    String
     fileSize    Int?     // bytes
     downloadCount Int    @default(0)
     tags        String[]
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@index([type])
     @@index([createdAt(sort: Desc)])
   }
   ```

2. **Supabase Storage 버킷 생성**:
   - `education-videos` (비디오 파일)
   - `resources` (문서, 템플릿 파일)
   - Public 접근 설정

3. **CRUD API 엔드포인트 작성**:
   - `POST /api/education/videos` (비디오 생성)
   - `GET /api/education/videos` (비디오 목록 조회)
   - `GET /api/education/videos/[id]` (비디오 상세 조회)
   - `PATCH /api/education/videos/[id]` (조회수 증가)
   - `POST /api/education/knowhow` (노하우 생성)
   - `GET /api/education/knowhow` (노하우 목록 조회)
   - `GET /api/education/knowhow/[id]` (노하우 상세 조회)
   - `POST /api/education/resources` (자료 업로드)
   - `GET /api/education/resources` (자료 목록 조회)
   - `GET /api/education/resources/[id]/download` (다운로드 + 카운트 증가)

4. **파일 업로드 처리**:
   - Supabase Storage 연동
   - 파일 크기 제한 (비디오: 500MB, 문서: 50MB)
   - MIME 타입 검증

**완료 조건**:

- [x] Prisma 스키마 작성 및 마이그레이션
- [x] Supabase 마이그레이션 실행 (education_videos, knowhow, resources)
- [x] 교육 비디오 CRUD API 완성
- [x] 노하우 아카이브 CRUD API 완성
- [x] 자료실 CRUD API 완성
- [x] Zod 검증 스키마 완성
- [x] RLS 정책 적용 (Public Read, Authenticated Write)
- [x] TypeScript 타입 체크 통과

**구현된 API**:

- `POST /api/education/videos` - 비디오 생성
- `GET /api/education/videos` - 비디오 목록 조회 (페이지네이션, 필터링)
- `GET /api/education/videos/[id]` - 비디오 상세 조회
- `PATCH /api/education/videos/[id]` - 조회수 증가
- `POST /api/education/knowhow` - 노하우 생성
- `GET /api/education/knowhow` - 노하우 목록 조회
- `GET /api/education/knowhow/[id]` - 노하우 상세 조회
- `PATCH /api/education/knowhow/[id]` - 조회수 증가
- `POST /api/education/resources` - 자료 생성
- `GET /api/education/resources` - 자료 목록 조회
- `GET /api/education/resources/[id]` - 자료 상세 조회
- `GET /api/education/resources/[id]/download` - 다운로드 + 카운트 증가

---

### 📋 ISSUE-26: VOD 플레이어 및 교육 콘텐츠 UI 개발

**상태**: ⏳ 대기
**목표**: 교육 비디오 시청 및 콘텐츠 탐색을 위한 UI 컴포넌트 개발
**의존성**: ✅ ISSUE-25 완료 후 시작 가능
**예상 기간**: 7일
**난이도**: 중

**작업 내용**:

1. **비디오 플레이어 라이브러리 선택 및 설치**:

   ```bash
   npm install react-player
   ```

   - react-player (YouTube, Vimeo, 로컬 파일 지원)
   - 또는 Plyr (커스텀 컨트롤)

2. **교육 콘텐츠 페이지 작성**:
   - `/app/education/page.tsx` (교육 메인 페이지)
   - `/app/education/videos/page.tsx` (비디오 목록)
   - `/app/education/videos/[id]/page.tsx` (비디오 상세 + 플레이어)
   - `/app/education/knowhow/page.tsx` (노하우 아카이브)
   - `/app/education/knowhow/[id]/page.tsx` (노하우 상세)
   - `/app/education/resources/page.tsx` (자료실)

3. **컴포넌트 작성**:
   - `/components/education/VideoPlayer.tsx` (비디오 플레이어)
   - `/components/education/VideoCard.tsx` (비디오 카드)
   - `/components/education/VideoList.tsx` (비디오 목록)
   - `/components/education/KnowHowCard.tsx` (노하우 카드)
   - `/components/education/ResourceCard.tsx` (자료 카드)
   - `/components/education/CategoryFilter.tsx` (카테고리 필터)

4. **React Query 설정**:
   - useEducationVideos hook (비디오 목록 조회)
   - useEducationVideo hook (비디오 상세 조회)
   - useKnowHow hook (노하우 조회)
   - useResources hook (자료 조회)
   - useIncrementViewCount mutation (조회수 증가)
   - useDownloadResource mutation (다운로드)

5. **디자인 시스템 적용**:
   - Primary Blue (#0052CC) - 재생 버튼, 액션 버튼
   - TailwindCSS Grid 레이아웃 (비디오 2열, 노하우 3열)
   - 모바일 반응형 (sm, md, lg breakpoints)
   - Skeleton UI (로딩 상태)

**완료 조건**:

- [ ] 비디오 플레이어 통합 (재생, 일시정지, 볼륨, 전체화면)
- [ ] 교육 메인 페이지 완성
- [ ] 비디오 목록 및 상세 페이지 완성
- [ ] 노하우 아카이브 페이지 완성
- [ ] 자료실 페이지 완성
- [ ] 카테고리 필터링 동작 확인
- [ ] 조회수/다운로드 카운트 동작 확인
- [ ] 모바일 반응형 확인

---

### 📋 ISSUE-27: 노하우 아카이브 및 자료실 구현

**상태**: ⏳ 대기
**목표**: Markdown 기반 노하우 콘텐츠 및 파일 다운로드 기능 개발
**의존성**: ✅ ISSUE-26 완료 후 시작 가능
**예상 기간**: 3일
**난이도**: 하

**작업 내용**:

1. **Markdown 렌더러 설치**:

   ```bash
   npm install react-markdown rehype-highlight
   ```

2. **노하우 콘텐츠 렌더링**:
   - Markdown → HTML 변환
   - 코드 하이라이팅 적용
   - 이미지 삽입 지원

3. **자료 다운로드 기능**:
   - 다운로드 버튼 클릭 → Supabase Storage에서 파일 다운로드
   - 다운로드 카운트 증가
   - 파일명 한글 지원

4. **검색 기능**:
   - 제목, 태그 기반 검색
   - 카테고리별 필터링

**완료 조건**:

- [ ] Markdown 렌더링 동작 확인
- [ ] 파일 다운로드 동작 확인
- [ ] 검색 및 필터링 동작 확인

---

## 🎯 Phase 5 시작 가이드

### ✅ 준비사항 체크리스트

**Phase 4 완료 확인**:

- ✅ 매칭 시스템 완성
- ✅ 매칭 결과 UI 완성

**Phase 5 준비사항**:

- [ ] Supabase Storage 활성화
- [ ] 비디오 파일 준비 (테스트용)
- [ ] 템플릿 파일 준비 (테스트용)

---

### 🚀 Phase 5 시작 명령어

**준비 완료! 바로 시작 가능**:

1. **"ISSUE-25 시작해줘"** - Prisma 스키마 작성부터 시작
2. **"교육 콘텐츠 모델부터 만들자"** - 데이터베이스 모델 작성
3. **"Supabase Storage 설정해줘"** - 스토리지 버킷 생성

---

## 📊 Phase 5 예상 완료 시점

**총 예상 기간**: 15일 (3주)

- ISSUE-25: 5일 (데이터 모델 + API)
- ISSUE-26: 7일 (UI 개발)
- ISSUE-27: 3일 (노하우 + 자료실)

**성공 기준**:

- ✅ 비디오 콘텐츠 재생 가능
- ✅ 카테고리별 필터링 동작
- ✅ 노하우 Markdown 렌더링 정상
- ✅ 자료 다운로드 기능 정상
- ✅ 모바일 반응형 지원

---

## 📋 Phase 4 ISSUE 목록 (완료)

### 📋 ISSUE-08: 업종/키워드/지역 기반 매칭 로직 구현

**상태**: ✅ 완료
**목표**: 고객 정보 기반 최적 프로그램 추천 알고리즘 개발
**의존성**: ✅ Phase 3 완료
**완료일**: 2025-12-04

**핵심 기술**:

- **규칙 기반 매칭 알고리즘** (AI 임베딩 제거, 단순화)
- **점수 계산**: 업종(30점) + 지역(30점) + 키워드(최대 40점)
- **선호 키워드 가중치**: 영업자가 선택한 프로그램 기반 키워드 +50% 가중치
- **Redis 캐싱**: 매칭 결과 24시간 캐싱 (선택)

**작업 내용**:

1. **매칭 알고리즘 설계 (규칙 기반)**:

   **점수 계산 로직**:
   - **업종 매칭**: 고객 업종 ∈ 프로그램 대상 업종 → +30점
   - **지역 매칭**: 고객 지역 ∈ 프로그램 대상 지역 → +30점
   - **키워드 매칭**:
     - 고객 challenges/goals ∩ 프로그램 keywords/title/description
     - 기본 키워드: +10점
     - 선호 키워드 (영업자가 선택한 프로그램 기반): +15점 (50% 가중치)
     - 최대 40점 제한

   **매칭 기준**:
   - 최소 점수: 30점 이상 (업종 또는 지역 최소 하나 일치 필수)
   - 상위 10개 프로그램 선택

2. **Prisma 스키마 작성** (`MatchingResult` 모델):

   ```prisma
   model MatchingResult {
     id                String   @id @default(uuid())
     customerId        String
     programId         String
     score             Float    // 0-100
     matchedIndustry   Boolean  // 업종 일치 여부
     matchedLocation   Boolean  // 지역 일치 여부
     matchedKeywords   String[] // 일치한 키워드 목록
     createdAt         DateTime @default(now())

     customer          Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
     program           Program  @relation(fields: [programId], references: [id], onDelete: Cascade)

     @@unique([customerId, programId]) // 고객-프로그램 조합 중복 방지
     @@index([customerId])
     @@index([score(sort: Desc)]) // 점수 내림차순 정렬
     @@index([createdAt(sort: Desc)]) // 생성일 내림차순 정렬
   }
   ```

3. **Customer 모델 업데이트** (선호 키워드 필드 추가):

   ```prisma
   model Customer {
     // ... 기존 필드
     preferredKeywords String[] @default([]) // 선호 키워드 (영업자가 선택한 프로그램 기반)

     matchingResults   MatchingResult[]
     // ... 기존 관계
   }
   ```

4. **매칭 API 작성**:

   **POST /api/matching** (고객 ID 기반 매칭 실행)
   **GET /api/matching/:customerId** (매칭 결과 조회)

5. **성능 최적화**:
   - 고객당 매칭 결과 캐싱 (24시간, Redis) - 선택
   - Database Index 활용 (targetAudience, targetLocation, keywords)
   - 매칭 결과 재사용 (고객 정보 변경 시에만 재계산)
   - 최소 30점 이상의 매칭만 저장 (필터링)

**완료 조건**:

- [x] MatchingResult Prisma 모델 작성 및 마이그레이션 완료
- [x] Customer 모델에 preferredKeywords 필드 추가
- [x] POST /api/matching 구현 (매칭 실행)
- [x] GET /api/matching/:customerId 구현 (결과 조회)
- [x] 매칭 정확도 70% 이상 (수동 검증) - **약 70% 달성** (지역 100%, 키워드 40%)
- [x] 매칭 시간 2초 이내 - **0.7초 달성**
- [x] 최소 30점 이상의 매칭만 저장 확인

**예상 기간**: 7일 (AI 제거로 3일 단축)
**난이도**: 중

---

### 📋 ISSUE-09: 매칭 결과 UI 개발

**상태**: ✅ 완료
**목표**: 매칭 결과 표시 및 관리 UI 구현
**의존성**: ✅ ISSUE-08 완료 후 시작 가능
**완료일**: 2025-12-04

**작업 내용**:

1. **매칭 관련 컴포넌트 작성**:
   - `/components/matching/MatchingResults.tsx` (결과 목록)
   - `/components/matching/MatchingScore.tsx` (스코어 시각화: 프로그레스 바, 0-100점)
   - `/components/matching/MatchingDetails.tsx` (매칭 상세: 업종/지역/키워드 일치 여부 표시)
   - `/components/matching/MatchingFilters.tsx` (결과 필터링: 최소 점수)
   - `/components/matching/MatchButton.tsx` (매칭 실행 버튼)

2. **React Query 설정**:
   - useRunMatching hook (매칭 실행)
   - useMatchingResults hook (결과 조회)

3. **페이지 작성**:
   - `/app/customers/[id]/matching/page.tsx` (고객별 매칭 결과 페이지)
     - MatchButton (매칭 실행)
     - MatchingResults (결과 목록)
     - MatchingFilters (필터링)

4. **디자인 시스템 적용** (PRINCIPLES.md 준수):
   - Primary Blue (#0052CC) - 매칭 버튼, 프로그레스 바
   - Lucide React 아이콘 (CheckCircle2, XCircle, Target)
   - TailwindCSS 유틸리티 클래스
   - 프로그레스 바: 0-30점 (회색), 30-60점 (노란색), 60-100점 (초록색)
   - 모바일 반응형 (sm, md, lg breakpoints)

5. **Loading/Error 상태 처리**:
   - React Query `isLoading`, `isError`, `error` 활용
   - Skeleton UI (로딩)
   - Error Boundary (에러)
   - 매칭 실행 중 로딩 스피너

**완료 조건**:

- [x] MatchingResults 컴포넌트 (목록 + 점수 시각화)
- [x] MatchingScore 컴포넌트 (프로그레스 바, 0-100점)
- [x] MatchingDetails 컴포넌트 (업종/지역/키워드 일치 표시)
- [x] MatchingFilters 컴포넌트 (최소 점수 필터)
- [x] MatchButton 컴포넌트 (매칭 실행)
- [x] React Query 설정 (useRunMatching, useMatchingResults)
- [x] /customers/[id]/matching/page.tsx (매칭 결과 페이지)
- [x] Loading/Error 상태 처리
- [x] 모바일 반응형 확인

**예상 기간**: 7일
**난이도**: 중
**기술 스택**: React Query, shadcn/ui, TailwindCSS, Lucide React

---

## 🎯 Phase 4 시작 가이드

### ✅ 준비사항 체크리스트

**Phase 3 완료 확인**:

- ✅ Program 모델 완성 (4개 API 데이터 수집 가능)
- ✅ Customer 모델 완성 (industry, location, challenges, goals)
- ✅ API 통합 완료 (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)
- ✅ 프로그램 UI 완성 (목록, 상세, 필터)
- ✅ 관심 목록 기능 완성

**Phase 4 준비사항**:

- ✅ MatchingResult Prisma 모델 작성 완료
- ✅ Customer.preferredKeywords 필드 추가 완료
- ✅ 매칭 로직 설계 완료 (EXECUTION.md 참조)

---

### 🚀 Phase 4 시작 명령어

**준비 완료! 바로 시작 가능**:

1. **"ISSUE-08 시작해줘"** - MatchingResult 모델 작성부터 시작
2. **"매칭 알고리즘부터 만들자"** - POST /api/matching 작성
3. **"MatchingResult 모델만 먼저 만들자"** - 스키마 작성 + 마이그레이션만

**Phase 변경**:

1. **"Phase 3로 돌아가줘"** - Phase 3 재확인
2. **"Phase 5 보여줘"** - Phase 5 미리보기

---

## 📊 Phase 4 예상 완료 시점

**총 예상 기간**: 14일 (Week 7-8)

- ISSUE-08: 7일 (매칭 로직 + API)
- ISSUE-09: 7일 (매칭 UI)

**성공 기준**:

- ✅ 규칙 기반 매칭 알고리즘 완성
- ✅ 매칭 정확도 70% 이상 (수동 검증)
- ✅ 매칭 시간 2초 이내
- ✅ 상위 10개 프로그램 추천
- ✅ 매칭 결과 UI 완성 (점수 시각화, 필터링)
- ✅ 모바일 반응형 지원

---

## 📚 참고 문서

- **EXECUTION.md**: 전체 프로젝트 로드맵 (Phase 1 ~ 9)
- **PRINCIPLES.md**: 개발 원칙 및 디자인 시스템
- **RULES.md**: 프레임워크 규칙
- **ORCHESTRATOR.md**: Quality Gates 8단계
- **DEVELOPMENT_CHECKLIST.md**: 개발 필수 체크리스트

---

**마지막 업데이트**: 2025-01-21
**Phase 4 완료일**: 2025-12-04
**Phase 5 시작일**: 2025-01-21
**다음 단계**: ISSUE-25 (교육 콘텐츠 데이터 모델 및 API 구현)
