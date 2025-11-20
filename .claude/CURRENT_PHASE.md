# Current Phase: Phase 1 - 기본 인프라 및 인증 (Week 1-2)

**목표**: Next.js 15 + Supabase + Vercel 기반 프로젝트 인프라 구축 및 랜딩 페이지 구현

**전체 진행 상황**: Phase 1 / 9 Phases

---

## 📋 Phase 1 ISSUE 목록

### ✅ ISSUE-00: 프로젝트 초기 설정 및 인프라 구축

**상태**: ✅ 완료 (2025-11-20)
**목표**: Next.js + Supabase + Vercel 기반 개발 환경 구축

**작업 내용**:

1. ✅ Next.js 15 프로젝트 초기화 (App Router, TypeScript, Tailwind)
2. ✅ Supabase 프로젝트 생성 및 연결 (PostgreSQL 17.6)
   - Database, Auth, Storage 활성화
   - 환경변수 설정 (`.env.local`)
3. ✅ Prisma ORM v6 설정
   - `schema.prisma` 작성
   - `prisma.config.ts` 설정 (dotenv 통합)
   - Prisma Client 생성 완료
4. ✅ Vercel 배포 파이프라인 구성
   - `vercel.json` 설정 완료
   - GitHub 연동 준비 완료
5. ✅ 공공데이터포털 API 키 준비
   - `.env.local`에 설정 완료
6. ✅ 기본 폴더 구조 생성:
   - `/app`, `/components`, `/lib`, `/tests`, `/hooks`
   - `/styles`, `/utils`, `/types`, `/prisma`, `/public`
7. ✅ ESLint + Prettier + Husky + lint-staged 설정
   - pre-commit 훅 동작 확인

**생성된 파일**:

- `src/lib/supabase.ts` - Supabase 클라이언트
- `src/lib/prisma.ts` - Prisma 클라이언트 (singleton 패턴)
- `prisma/schema.prisma` - 데이터베이스 스키마
- `prisma.config.ts` - Prisma 설정
- `vercel.json` - Vercel 배포 설정
- `.prettierrc`, `.prettierignore` - Prettier 설정
- `eslint.config.mjs` - ESLint 설정
- `.lintstagedrc.json` - lint-staged 설정
- `.husky/pre-commit` - Git pre-commit 훅

**완료 조건**:

- [x] Supabase 연결 성공 (PostgreSQL 17.6 확인)
- [x] Prisma Client 생성 완료
- [x] Git 저장소 설정 완료
- [x] 코드 품질 도구 설정 완료 (pre-commit 훅 동작)
- [ ] Vercel 배포 (로컬 환경 완료, 배포 대기)
- [ ] 공공데이터포털 API 키 발급 (준비 완료, 발급 대기)

**실제 소요 기간**: 5일
**난이도**: 중
**의존성**: 없음

---

### 📋 ISSUE-01: 랜딩 페이지 구현

**상태**: 🔄 준비 완료 (시작 대기 중)
**목표**: 초대 기반 서비스 안내 및 사용자 유입을 위한 랜딩 페이지 구현
**의존성**: ✅ ISSUE-00 완료

**작업 내용**:

1. **11개 섹션 구현** (PRD.md 6.6.5 기반):
   - Hero 섹션 (그래디언트 배경, 메인 CTA)
   - Problem 섹션 (3가지 문제점 카드)
   - Solution 섹션 (3단계 프로세스 다이어그램)
   - Key Features 섹션 (6개 기능 카드, 3열×2행)
   - Impact/Value 섹션 (3개 효과 카드)
   - Social Proof 섹션 (파트너 로고 캐러셀 + 후기 3개)
   - **Invitation-based Service 섹션** (이메일 등록 폼 - 핵심)
   - Success Stories 섹션 (2-3개 사례 카드)
   - FAQ 섹션 (5-7개 질문, 아코디언 형식)
   - Final CTA 섹션 (파란색 그래디언트 배경)
   - Footer (네비게이션 + SNS 링크)

2. 랜딩 컴포넌트 작성:
   - `/components/landing/HeroSection.tsx`
   - `/components/landing/ProblemSection.tsx`
   - `/components/landing/SolutionSection.tsx`
   - `/components/landing/FeaturesSection.tsx`
   - `/components/landing/ImpactSection.tsx`
   - `/components/landing/SocialProofSection.tsx`
   - `/components/landing/InvitationForm.tsx` (핵심: 이메일 + 회사명 + 이름)
   - `/components/landing/SuccessStories.tsx`
   - `/components/landing/FAQSection.tsx`
   - `/components/landing/Footer.tsx`

3. 메인 페이지 작성:
   - `/app/page.tsx` (메인 랜딩 페이지)
   - 풀 스크린 스크롤 기반 섹션형 레이아웃
   - 스크롤 애니메이션 (Fade In + Slide Up, 각 섹션 300ms)
   - 반응형 디자인 (데스크톱 우선, 태블릿/모바일 대응)

4. 초대 신청 API 구현:
   - `POST /api/invitation/apply`
   - 입력 데이터: 이메일, 회사명, 이름
   - Zod 스키마 검증
   - Supabase Invitation 테이블에 저장
   - 이메일 알림 (선택사항)
   - 성공 응답: 토스트 메시지 표시

5. Prisma 스키마 작성 (Invitation 모델):

   ```prisma
   model Invitation {
     id          String   @id @default(uuid())
     email       String   @unique
     companyName String?
     name        String
     status      String   @default("pending") // pending, approved, rejected
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@index([email])
     @@index([status])
   }
   ```

6. 디자인 시스템 적용 (PRD.md 6.6.2-6.6.4):
   - **색상**: Primary Blue (#0052CC), Primary Dark (#1F2937), White (#FFFFFF)
   - **타이포그래피**: Pretendard, Noto Sans KR (H1: 36px, H2: 28px, H3: 20px, Body: 14px)
   - **아이콘**: Lucide 아이콘 사용 (이모지 사용 안 함)
   - **애니메이션**: Framer Motion 또는 CSS Transitions

7. 벤치마크 참고:
   - **커넥트웍스** (works.connect24.kr): 필터 UX, 통계 표시, 카드 기반 리스트
   - **허블** (hubble.co.kr): 미니멀 디자인, 브랜드 신뢰도, 3단계 프로세스 시각화

**완료 조건**:

- [ ] 11개 섹션 모두 구현 완료
- [ ] 초대 신청 폼 동작 확인 (이메일 등록 → DB 저장 → 성공 메시지)
- [ ] Lighthouse Performance 90+ 점수
- [ ] 모바일 반응형 동작 확인 (767px 이하)
- [ ] 스크롤 애니메이션 부드러운 동작 확인

**예상 기간**: 5일
**난이도**: 중
**의존성**: ISSUE-00
**병렬 가능**: ISSUE-02 (인증 시스템)과 동시 진행 가능

---

### 📋 ISSUE-02: 인증 시스템 구현

**상태**: 대기
**목표**: Supabase Auth + NextAuth.js 통합 인증 시스템 구축

**작업 내용**:

1. NextAuth.js 설치 및 설정
   ```bash
   npm install next-auth @auth/prisma-adapter
   ```
2. `/app/api/auth/[...nextauth]/route.ts` 작성
   - Supabase Adapter 연동
   - Session Strategy 설정
3. 로그인/회원가입 페이지 컴포넌트 작성
   - `/components/auth/LoginForm.tsx`
   - `/components/auth/SignupForm.tsx`
4. 인증 미들웨어 작성
   - `/middleware.ts` (보호된 라우트 처리)
5. Session Provider 설정
6. 로그아웃 기능 구현

**완료 조건**:

- [ ] 회원가입 → 로그인 → 보호된 페이지 접근 흐름 테스트 성공
- [ ] Session 유지 확인

**예상 기간**: 7일
**난이도**: 중
**의존성**: ISSUE-00

---

## 📌 다음 Phase 미리보기

**Phase 2: 고객 관리 기능 (Week 3-4)**

- ISSUE-03: 고객 데이터 모델 및 API 구현
- ISSUE-04: 고객 관리 UI 컴포넌트 개발
- ISSUE-05: 엑셀 파일 업로드 기능

---

## 🎯 현재 작업 시작하기

**✅ ISSUE-00 완료!**

다음 작업을 시작하려면:

1. **"ISSUE-01 시작해줘"** - 랜딩 페이지 구현 시작
2. **"랜딩 페이지 구현 진행해줘"** - 동일

또는 Phase를 변경하려면:

1. "다음 Phase로 이동해줘" (Phase 2로 이동)
2. "Phase 3 보여줘" (Phase 3 내용 로드)
