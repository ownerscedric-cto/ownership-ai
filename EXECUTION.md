# 컨설턴트 관리 플랫폼 실행 계획 (Execution Plan)

**버전**: v1.7
**최종 업데이트**: 2025-11-21
**프로젝트 기간**: 14주 (약 3.5개월)
**현재 상태**: Phase 1 완료 (3/3 이슈) ✅

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택 및 아키텍처](#기술-스택-및-아키텍처)
3. [개발 원칙](#개발-원칙)
4. [이슈 목록 (25개)](#이슈-목록)
5. [주요 변경 사항 히스토리](#주요-변경-사항-히스토리)
6. [타임라인](#타임라인)

---

## 프로젝트 개요

**목표**: 1인 컨설턴트가 고객 정보를 효율적으로 관리하고, 업종/키워드/지역 기반으로 정부지원사업을 매칭하여 고객에게 추천하는 SaaS 플랫폼 개발

**핵심 기능**:

1. 고객 정보 관리 (CRM)
2. 정부지원사업 데이터 수집 및 관리
3. 업종/키워드/지역 기반 매칭 시스템
4. 자동화된 고객 커뮤니케이션
5. 대시보드 및 분석 기능
6. 관리자 기능

**타겟 사용자**: 1인 컨설턴트

---

## 기술 스택 및 아키텍처

### 전체 기술 스택

| 카테고리             | Beta (Supabase + Vercel)                      | 향후 마이그레이션 고려       |
| -------------------- | --------------------------------------------- | ---------------------------- |
| **Frontend**         | React 18 + TypeScript + Next.js 15 App Router | 동일 유지                    |
| **Backend**          | Next.js 15 API Routes + Server Actions        | Next.js API Routes (유지)    |
| **Database**         | Supabase PostgreSQL + Prisma ORM              | AWS RDS / GCP Cloud SQL      |
| **Authentication**   | Supabase Auth + NextAuth.js                   | NextAuth.js + 자체 DB        |
| **Storage**          | Supabase Storage                              | AWS S3 / GCP Cloud Storage   |
| **Hosting**          | Vercel (Serverless Functions)                 | AWS / GCP / 자체 서버        |
| **검색 엔진**        | PostgreSQL Full-Text Search                   | 동일 유지 또는 Elasticsearch |
| **외부 API**         | 다중 공공데이터 API (중기부, K-startup)       | 향후 지자체 API 추가 가능    |
| **State Management** | Zustand (클라이언트), React Query (서버)      | 동일 유지                    |
| **UI Framework**     | TailwindCSS + shadcn/ui                       | 동일 유지                    |
| **Monitoring**       | Vercel Analytics + Sentry                     | Datadog / NewRelic           |

### 아키텍처 설계 원칙

#### 1. 컴포넌트 모듈화 원칙

**모든 UI는 재사용 가능한 컴포넌트로 분리**

```
/components
├── common/              # 공통 컴포넌트
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   └── Spinner.tsx
├── layout/              # 레이아웃 컴포넌트
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   └── DashboardLayout.tsx
├── customers/           # 고객 관리 관련 컴포넌트
│   ├── CustomerCard.tsx
│   ├── CustomerForm.tsx
│   ├── CustomerList.tsx
│   ├── CustomerDetail.tsx
│   └── CustomerFilters.tsx
├── programs/            # 정부지원사업 관련 컴포넌트
│   ├── ProgramCard.tsx
│   ├── ProgramList.tsx
│   ├── ProgramDetail.tsx
│   └── ProgramFilters.tsx
├── matching/            # AI 매칭 관련 컴포넌트
│   ├── MatchingResults.tsx
│   ├── MatchingScore.tsx
│   ├── MatchingFilters.tsx
│   └── MatchingHistory.tsx
├── dashboard/           # 대시보드 관련 컴포넌트
│   ├── StatsCard.tsx
│   ├── Chart.tsx
│   ├── RecentActivity.tsx
│   └── QuickActions.tsx
└── communication/       # 커뮤니케이션 관련 컴포넌트
    ├── EmailTemplate.tsx
    ├── MessagePreview.tsx
    └── NotificationBell.tsx
```

**컴포넌트 설계 규칙**:

- 단일 책임 원칙: 하나의 컴포넌트는 하나의 역할만 수행
- Props 타입 정의: TypeScript interface로 명확히 정의
- Compound Component 패턴 활용 (예: `<Table>`, `<Table.Header>`, `<Table.Row>`)
- Controlled/Uncontrolled 컴포넌트 구분
- Composition over Inheritance

#### 2. API 기반 개발 원칙

**모든 데이터 핸들링은 API 엔드포인트로 작성**

```
/app/api
├── customers/
│   ├── route.ts              # GET /api/customers, POST /api/customers
│   ├── [id]/
│   │   ├── route.ts          # GET, PUT, DELETE /api/customers/[id]
│   │   └── matching/
│   │       └── route.ts      # POST /api/customers/[id]/matching
│   └── bulk/
│       └── route.ts          # POST /api/customers/bulk (엑셀 업로드)
├── programs/
│   ├── route.ts              # GET /api/programs
│   ├── [id]/
│   │   └── route.ts          # GET /api/programs/[id]
│   ├── sync/
│   │   └── route.ts          # POST /api/programs/sync (공공데이터 동기화)
│   └── search/
│       └── route.ts          # POST /api/programs/search (벡터 검색)
├── matching/
│   ├── route.ts              # POST /api/matching (매칭 실행)
│   └── history/
│       └── route.ts          # GET /api/matching/history
├── communication/
│   ├── email/
│   │   └── route.ts          # POST /api/communication/email
│   └── templates/
│       └── route.ts          # GET, POST /api/communication/templates
├── auth/
│   └── [...nextauth]/
│       └── route.ts          # NextAuth.js 인증 라우트
├── analytics/
│   └── route.ts              # GET /api/analytics (대시보드 데이터)
└── admin/
    ├── users/
    │   └── route.ts          # 관리자 사용자 관리
    └── settings/
        └── route.ts          # 관리자 설정
```

**API 설계 규칙**:

- RESTful 설계 원칙 준수
- HTTP 메소드 적절히 사용 (GET, POST, PUT, DELETE, PATCH)
- 응답 형식 표준화:

  ```typescript
  // 성공 응답
  {
    success: true,
    data: {...},
    metadata?: { total, page, limit }
  }

  // 에러 응답
  {
    success: false,
    error: {
      code: "ERROR_CODE",
      message: "사용자 친화적 메시지",
      details?: {...}
    }
  }
  ```

- 에러 핸들링 통일: try-catch + 표준 에러 응답
- 인증/인가 미들웨어 적용
- Request Validation (Zod 활용)
- Rate Limiting 적용

#### 3. 마이그레이션 준비 원칙

**추상화 계층을 통한 Provider 독립성 확보**

**데이터베이스 추상화 (Prisma ORM)**:

```typescript
// /lib/db/index.ts
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();

// 마이그레이션 시 Provider만 변경
// Supabase → AWS RDS
// DATABASE_URL 환경변수만 변경하면 됨
```

**인증 추상화 (NextAuth.js)**:

```typescript
// /lib/auth/config.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // Beta: Supabase Auth
    // 마이그레이션: Credentials Provider로 전환 가능
  ],
};
```

**스토리지 추상화**:

```typescript
// /lib/storage/index.ts
export interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  delete(url: string): Promise<void>;
  getSignedUrl(path: string): Promise<string>;
}

// Beta: Supabase Storage
export class SupabaseStorage implements StorageProvider {
  async upload(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('bucket')
      .upload(path, file);
    if (error) throw error;
    return data.path;
  }
  // ...
}

// 마이그레이션: S3 Storage
export class S3Storage implements StorageProvider {
  async upload(file: File, path: string): Promise<string> {
    const command = new PutObjectCommand({ ... });
    await s3Client.send(command);
    return `s3://${bucket}/${path}`;
  }
  // ...
}

// 환경변수로 Provider 선택
export const storage: StorageProvider =
  process.env.STORAGE_PROVIDER === 's3'
    ? new S3Storage()
    : new SupabaseStorage();
```

**환경 설정 추상화**:

```typescript
// /lib/config.ts
export const config = {
  database: {
    provider: process.env.DB_PROVIDER || 'supabase',
    url: process.env.DATABASE_URL,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'supabase',
    bucket: process.env.STORAGE_BUCKET,
  },
  auth: {
    provider: process.env.AUTH_PROVIDER || 'supabase',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY,
  },
};
```

#### 4. 모바일 최적화 원칙

**주 사용자: 컨설턴트 (외근/영업 중 모바일 사용 빈도 높음)**

**반응형 전략**:

- **데스크톱 우선 (Desktop-First)**: 복잡한 입력/관리 화면
- **모바일 최적화 (Mobile-Optimized)**: 조회/확인/간단한 액션

**모바일 우선 화면 (Mobile-First)**:

```
컨설턴트의 외근/영업 시나리오:
1. 고객 조회/검색
   - 고객사 방문 전 정보 빠른 확인
   - 검색, 필터링, 카드 리스트

2. 매칭 결과 확인
   - 실시간 알림 → 즉시 모바일에서 확인
   - 매칭 점수, 추천 프로그램 목록

3. 프로그램 상세 조회
   - 고객사 미팅 중 프로그램 정보 제공
   - 상세 내용, 지원 조건, 마감일

4. 간단한 메모/상태 업데이트
   - 현장에서 즉시 메모 입력
   - 고객 상태 변경 (진행중 → 완료 등)
```

**데스크톱 우선 화면 (Desktop-First + Responsive)**:

```
사무실 업무:
1. 고객 등록/수정
   - 많은 필드 (업종, 지역, 매출, 직원수 등)
   - 복잡한 폼 레이아웃

2. 매칭 실행 설정
   - 복잡한 필터/옵션 설정
   - 벡터 검색 파라미터 조정

3. 대시보드/통계
   - 차트, 테이블, 복잡한 데이터 시각화
   - 넓은 화면에서 한눈에 확인

4. 커뮤니케이션 관리
   - 이메일 작성, 템플릿 편집
   - 대량 발송, 히스토리 관리
```

**TailwindCSS Breakpoint 전략**:

```typescript
// Mobile: < 768px (sm 미만)
// Tablet: 768px - 1024px (md - lg)
// Desktop: 1024px+ (lg+)

// 예시 1: 모바일 우선 화면 (고객 카드 리스트)
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* 모바일: 1열, 태블릿: 2열, 데스크톱: 3열 */}
  </div>
</div>

// 예시 2: 데스크톱 우선 화면 (복잡한 테이블)
<div className="hidden lg:block"> {/* 데스크톱 전용 풀버전 */}
  <ComplexTable />
</div>
<div className="lg:hidden"> {/* 모바일 간소화 버전 */}
  <SimpleCardList />
</div>
```

**모바일 UX 최적화**:

- **터치 영역**: 최소 44x44px (버튼, 링크, 아이콘)
- **폰트 크기**: 최소 16px (모바일 자동 줌 방지)
- **네비게이션**: Bottom Tab Bar (주요 화면 빠른 접근)
  - 홈, 고객, 프로그램, 매칭, 내정보
- **스와이프 제스처**:
  - 카드 좌우 스와이프 (삭제, 수정)
  - Pull-to-Refresh (목록 새로고침)
- **로딩 상태**: Skeleton UI (네트워크 지연 대응)
- **오프라인 대응**: Service Worker (기본 캐싱)

**성능 최적화**:

```typescript
// 1. 이미지 최적화
import Image from 'next/image';
<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="Logo"
  loading="lazy"
/>

// 2. 폰트 최적화
import { Pretendard } from 'next/font/google';
const pretendard = Pretendard({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pretendard'
});

// 3. 동적 임포트 (라우트 코드 스플리팅)
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});

// 4. React Query 캐싱
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    staleTime: 1000 * 60 * 60, // 1시간 캐싱
  });
};
```

**모바일 완료 조건**:

- Lighthouse Mobile Performance 90+ 점수
- 모바일 주요 화면 터치 인터랙션 테스트 완료
- 테스트 디바이스:
  - iPhone SE (375px) - 최소 너비
  - iPhone 14 Pro (393px) - 표준
  - iPad (768px) - 태블릿
- Core Web Vitals 충족:
  - LCP (Largest Contentful Paint) < 2.5초
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1

#### 5. 테스트 가능한 구조

**API 우선 개발의 장점**:

- API 엔드포인트별 독립 테스트 가능
- Postman/Insomnia로 수시로 데이터 검증
- Jest + Supertest로 자동화 테스트 작성 용이

**테스트 전략**:

```typescript
// /tests/api/customers.test.ts
describe('POST /api/customers', () => {
  it('should create a new customer', async () => {
    const response = await request(app)
      .post('/api/customers')
      .send({ name: '테스트 고객', industry: 'IT' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('테스트 고객');
  });

  it('should validate required fields', async () => {
    const response = await request(app).post('/api/customers').send({ name: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

---

## 개발 원칙

### 1. 컴포넌트 개발 원칙

- ✅ **재사용성 우선**: 중복 코드 최소화, 공통 컴포넌트 라이브러리 구축
- ✅ **타입 안전성**: TypeScript interface/type 명확히 정의
- ✅ **Props Drilling 방지**: Context API 또는 Zustand 활용
- ✅ **접근성 (A11y)**: ARIA 속성, 키보드 네비게이션 지원
- ✅ **성능 최적화**: React.memo, useMemo, useCallback 적절히 활용
- ✅ **에러 바운더리**: 컴포넌트 레벨 에러 처리

### 2. API 개발 원칙

- ✅ **RESTful 설계**: 표준 HTTP 메소드 활용
- ✅ **응답 형식 통일**: 모든 API 동일한 응답 구조
- ✅ **에러 핸들링**: 명확한 에러 코드 및 메시지
- ✅ **Request Validation**: Zod 스키마로 입력 검증
- ✅ **인증/인가**: 모든 보호 엔드포인트에 미들웨어 적용
- ✅ **Rate Limiting**: 외부 API 호출 제한 (특히 공공데이터포털, OpenAI)
- ✅ **로깅**: 모든 API 호출 로그 기록 (에러, 성능 메트릭)
- ✅ **문서화**: OpenAPI(Swagger) 스펙 자동 생성

### 3. 데이터 관리 원칙

- ✅ **Server State vs Client State 분리**:
  - Server State: React Query로 관리 (캐싱, 자동 재검증)
  - Client State: Zustand로 관리 (UI 상태, 사용자 설정)
- ✅ **Optimistic Updates**: 사용자 경험 향상을 위한 낙관적 업데이트
- ✅ **Stale-While-Revalidate**: 오래된 데이터 표시 후 백그라운드 갱신
- ✅ **Infinite Scroll**: 대량 데이터는 무한 스크롤 또는 페이지네이션

### 4. 코드 품질 원칙

- ✅ **ESLint + Prettier**: 코드 스타일 통일
- ✅ **Husky + Lint-Staged**: 커밋 전 자동 검증
- ✅ **TypeScript Strict Mode**: 타입 안전성 극대화
- ✅ **함수형 프로그래밍**: 순수 함수, 불변성 유지
- ✅ **주석 최소화**: 자명한 코드 작성, 필요시에만 주석

---

## 이슈 목록

### Phase 1: 기본 인프라 및 인증 (Week 1-2) ✅ 완료

#### ISSUE-00: 프로젝트 초기 설정 및 인프라 구축 ✅

- **상태**: ✅ 완료 (2025-11-20)
- **목표**: Next.js + Supabase + Vercel 기반 개발 환경 구축
- **작업 내용**:
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

- **생성된 파일**:
  - `src/lib/supabase.ts` - Supabase 클라이언트
  - `src/lib/prisma.ts` - Prisma 클라이언트 (singleton 패턴)
  - `prisma/schema.prisma` - 데이터베이스 스키마
  - `prisma.config.ts` - Prisma 설정
  - `vercel.json` - Vercel 배포 설정
  - `.prettierrc`, `.prettierignore` - Prettier 설정
  - `eslint.config.mjs` - ESLint 설정
  - `.lintstagedrc.json` - lint-staged 설정
  - `.husky/pre-commit` - Git pre-commit 훅

- **완료 조건**:
  - [x] Supabase 연결 성공 (PostgreSQL 17.6 확인)
  - [x] Prisma Client 생성 완료
  - [x] Git 저장소 설정 완료
  - [x] 코드 품질 도구 설정 완료 (pre-commit 훅 동작)
  - [ ] Vercel 배포 (로컬 환경 완료, 배포 대기)
  - [ ] 공공데이터포털 API 키 발급 (준비 완료, 발급 대기)

- **실제 소요 기간**: 5일
- **난이도**: 중
- **의존성**: 없음

---

#### ISSUE-01: 랜딩 페이지 구현 ✅

- **상태**: ✅ 완료 (2025-11-21)
- **목표**: 초대 기반 서비스 안내 및 사용자 유입을 위한 랜딩 페이지 구현
- **의존성**: ✅ ISSUE-00 완료

- **작업 내용**:
  1. ✅ **10개 섹션 구현** (PRD.md 6.6.5 기반):
     - ✅ Hero 섹션 (그래디언트 배경, 메인 CTA, 골드 강조)
     - ✅ Problem 섹션 (3가지 문제점 카드)
     - ✅ Solution 섹션 (3단계 프로세스 다이어그램)
     - ✅ Key Features 섹션 (6개 기능 카드, 3열×2행)
     - ✅ Impact/Value 섹션 (3개 효과 카드)
     - ✅ Social Proof 섹션 (후기 3개 + 신뢰 지표)
     - ✅ **Invitation-based Service 섹션** (이메일 등록 폼 - 핵심)
     - ✅ FAQ 섹션 (7개 질문, 아코디언 형식)
     - ✅ Final CTA 섹션 (파란색 그래디언트 배경, 골드 강조)
     - ✅ Footer (네비게이션, 골드 로고)
     - ~~Success Stories 섹션~~ (Social Proof로 통합)

  2. ✅ 랜딩 컴포넌트 작성:
     - ✅ `/components/landing/HeroSection.tsx`
     - ✅ `/components/landing/ProblemSection.tsx`
     - ✅ `/components/landing/SolutionSection.tsx`
     - ✅ `/components/landing/FeaturesSection.tsx`
     - ✅ `/components/landing/ImpactSection.tsx`
     - ✅ `/components/landing/SocialProofSection.tsx`
     - ✅ `/components/landing/InvitationForm.tsx` (핵심: 이메일 + 회사명 + 이름)
     - ✅ `/components/landing/FAQSection.tsx`
     - ✅ `/components/landing/FinalCTASection.tsx`
     - ✅ `/components/landing/Footer.tsx`

  3. ✅ 메인 페이지 작성:
     - ✅ `/app/page.tsx` (메인 랜딩 페이지)
     - ✅ 풀 스크린 스크롤 기반 섹션형 레이아웃
     - ✅ 스크롤 애니메이션 (Fade In + Slide Up, Framer Motion)
     - ✅ 반응형 디자인 (데스크톱 우선, 태블릿/모바일 대응)

  4. ✅ 초대 신청 API 구현:
     - ✅ `POST /api/invitation/apply`
     - ✅ 입력 데이터: 이메일, 회사명, 이름
     - ✅ Zod 스키마 검증 (`/lib/validations/invitation.ts`)
     - ✅ Supabase Invitation 테이블에 저장
     - ✅ 중복 이메일 체크
     - ✅ 성공/실패 응답 처리

  5. ✅ Supabase 데이터베이스 테이블 (이미 생성됨):
     - ✅ `invitations` 테이블
     - ✅ 컬럼: id, email, companyName, name, status, createdAt, updatedAt

  6. ✅ 디자인 시스템 적용 (PRD.md 6.6.2-6.6.4):
     - ✅ **색상**: Primary Blue (#0052CC), Primary Dark (#1F2937), White (#FFFFFF), Gold Highlight (#FBBF24)
     - ✅ **타이포그래피**: 시스템 폰트 스택 (Tailwind 기본)
     - ✅ **아이콘**: Lucide React 아이콘 사용
     - ✅ **애니메이션**: Framer Motion 적용
     - ✅ **WCAG AA 대비율** 준수 (색상 강조 개선)

  7. ✅ 스타일링 개선:
     - ✅ 섹션별 교차 배경색 (white/gray 패턴)
     - ✅ 골드 강조색 적용 (파란 배경 위 텍스트 가시성 향상)
     - ✅ FinalCTASection 버튼 가시성 수정

- **생성된 파일**:
  - `/src/lib/validations/invitation.ts` - Zod 검증 스키마
  - `/src/app/api/invitation/apply/route.ts` - 초대 신청 API 엔드포인트

- **완료 조건**:
  - [x] 10개 섹션 모두 구현 완료 (UI)
  - [x] 초대 신청 폼 동작 확인 (이메일 등록 → DB 저장 → 성공 메시지)
  - [ ] Lighthouse Performance 90+ 점수 (선택사항, 추후 최적화)
  - [ ] 모바일 반응형 동작 확인 (767px 이하, 추후 테스트)
  - [x] 스크롤 애니메이션 부드러운 동작 확인

- **실제 소요 기간**: 6일
- **난이도**: 중
- **의존성**: ISSUE-00

---

#### ISSUE-02: 인증 시스템 구현 ✅

- **상태**: ✅ 완료 (2025-11-21)
- **목표**: Supabase Auth 기반 이메일 인증 통합 인증 시스템 구축
- **의존성**: ✅ ISSUE-00 완료

- **작업 내용**:
  1. ✅ **Supabase Auth 패키지 설치**

     ```bash
     npm install @supabase/ssr @supabase/auth-helpers-nextjs
     ```

  2. ✅ **Supabase 클라이언트 설정** (SSR 지원)
     - ✅ `/lib/supabase/client.ts` - 브라우저 클라이언트 (Client Components)
     - ✅ `/lib/supabase/server.ts` - 서버 클라이언트 (Server Components, API Routes)
     - ✅ `/lib/supabase/middleware.ts` - 세션 관리 및 자동 갱신

  3. ✅ **로그인/회원가입 페이지 구현**
     - ✅ `/app/auth/login/page.tsx` - 로그인 페이지
     - ✅ `/app/auth/signup/page.tsx` - 회원가입 페이지
     - ✅ `/components/auth/LoginForm.tsx` - 이메일/비밀번호 로그인 폼
     - ✅ `/components/auth/SignupForm.tsx` - 회원가입 폼 (이메일 인증 포함)

  4. ✅ **이메일 인증 플로우 구현**
     - ✅ 회원가입 시 이메일 확인 메일 발송
     - ✅ `/app/auth/callback/route.ts` - 이메일 인증 콜백 처리
     - ✅ 세션 생성 및 대시보드 리다이렉트
     - ✅ 미인증 사용자 로그인 차단 및 안내 메시지

  5. ✅ **인증 미들웨어 구현**
     - ✅ `/middleware.ts` - Supabase 세션 기반 보호
     - ✅ 인증되지 않은 사용자 → `/auth/login` 리다이렉트
     - ✅ 정적 파일 및 공개 경로 제외 처리

  6. ✅ **대시보드 페이지 구현**
     - ✅ `/app/dashboard/page.tsx` - 보호된 대시보드
     - ✅ 실시간 세션 모니터링 (`onAuthStateChange`)
     - ✅ 사용자 정보 표시 (이름, 이메일, 회사명)
     - ✅ 로그아웃 기능 구현

  7. ✅ **NextAuth.js 제거 및 마이그레이션**
     - ✅ `next-auth`, `bcryptjs`, `@auth/supabase-adapter` 패키지 제거
     - ✅ NextAuth 관련 파일 삭제 (`auth.ts`, `providers.tsx`, `next-auth.d.ts`)
     - ✅ 기존 로그인/회원가입 로직 → Supabase Auth 마이그레이션
     - ✅ 커스텀 API 엔드포인트 제거 (`/api/auth/signup`)

  8. ✅ **사용자 데이터 저장 방식**
     - ✅ `user_metadata` 활용 (이름, 회사명 저장)
     - ✅ Supabase Auth 기본 사용자 테이블 사용
     - ✅ 커스텀 `users` 테이블 제거 (Auth 통합)

- **생성된 파일**:
  - `/src/lib/supabase/client.ts` - 브라우저 클라이언트
  - `/src/lib/supabase/server.ts` - 서버 클라이언트
  - `/src/lib/supabase/middleware.ts` - 세션 관리
  - `/src/app/auth/callback/route.ts` - 이메일 인증 콜백

- **수정된 파일**:
  - `/src/components/auth/SignupForm.tsx` - Supabase Auth 마이그레이션
  - `/src/components/auth/LoginForm.tsx` - Supabase Auth 마이그레이션
  - `/src/middleware.ts` - Supabase 세션 기반으로 재작성
  - `/src/app/layout.tsx` - SessionProvider 제거
  - `/src/app/dashboard/page.tsx` - Supabase Auth 마이그레이션

- **삭제된 파일**:
  - `/src/lib/auth.ts` - NextAuth 설정
  - `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API
  - `/src/app/api/auth/signup/route.ts` - 커스텀 회원가입 API
  - `/src/types/next-auth.d.ts` - NextAuth 타입
  - `/src/lib/validations/auth.ts` - 인증 검증 스키마
  - `/src/app/providers.tsx` - SessionProvider

- **완료 조건**:
  - [x] 회원가입 → 이메일 인증 → 로그인 → 대시보드 접근 흐름 성공
  - [x] 이메일 미인증 사용자 로그인 차단 확인
  - [x] 세션 자동 갱신 및 유지 확인 (쿠키 기반)
  - [x] 로그아웃 후 보호된 페이지 접근 차단 확인
  - [x] 실시간 세션 변경 감지 (`onAuthStateChange`)
  - [x] 빌드 에러 없음 (NextAuth 완전 제거)

- **실제 소요 기간**: 6시간
- **난이도**: 중
- **기술 스택**: Supabase Auth, @supabase/ssr, Next.js 15 App Router

---

### 🎉 Phase 1 완료 요약

**Phase 1의 모든 ISSUE가 완료되었습니다!**

**완료된 작업**:

- ✅ 프로젝트 초기 설정 및 인프라 구축 (ISSUE-00)
- ✅ 랜딩 페이지 구현 (ISSUE-01) - 10개 섹션, 초대 신청 폼
- ✅ 인증 시스템 구현 (ISSUE-02) - Supabase Auth, 이메일 인증

**Phase 1 성과**:

- Next.js 15 + Supabase + Vercel 기반 인프라 완료
- 이메일 인증 기반 안전한 회원가입/로그인 시스템
- 초대 기반 서비스 랜딩 페이지 완료
- 실시간 세션 관리 및 보호된 대시보드 구현

**전체 진행 상황**: Phase 1 완료 (3/3 이슈) → Phase 2 시작 준비

---

### Phase 2: 고객 관리 기능 (Week 3-4)

#### ISSUE-03: 고객 데이터 모델 및 API 구현

- **목표**: 고객(Customer) 데이터 CRUD API 완성
- **작업 내용**:
  1. Prisma 스키마 작성 (`Customer` 모델)

     ```prisma
     model Customer {
       id              String   @id @default(uuid())
       userId          String   // 컨설턴트 ID (외래키)
       name            String
       industry        String?
       companySize     String?
       location        String?
       budget          Int?
       challenges      String[]
       goals           String[]
       preferredKeywords String[] @default([])  // 영업자가 선택한 프로그램 기반 학습된 키워드
       contactEmail    String?
       contactPhone    String?
       notes           String?
       createdAt       DateTime @default(now())
       updatedAt       DateTime @updatedAt

       user            User     @relation(fields: [userId], references: [id])
       matchingResults MatchingResult[]
     }
     ```

  2. API 엔드포인트 작성:
     - `POST /api/customers` (고객 생성)
     - `GET /api/customers` (고객 목록 조회, 필터링/정렬)
     - `GET /api/customers/[id]` (고객 상세 조회)
     - `PUT /api/customers/[id]` (고객 정보 수정)
     - `DELETE /api/customers/[id]` (고객 삭제)
  3. Request Validation (Zod 스키마)

     ```typescript
     // /lib/validations/customer.ts
     import { z } from 'zod';

     export const createCustomerSchema = z.object({
       name: z.string().min(1),
       industry: z.string().optional(),
       // ...
     });
     ```

  4. Postman/Insomnia로 API 테스트
  5. Jest로 단위 테스트 작성

- **완료 조건**:
  - 모든 CRUD API 동작 확인
  - 테스트 커버리지 80% 이상
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-02

---

#### ISSUE-04: 고객 관리 UI 컴포넌트 개발

- **목표**: 고객 목록, 상세, 등록/수정 UI 구현
- **작업 내용**:
  1. 공통 컴포넌트 작성:
     - `/components/common/Button.tsx`
     - `/components/common/Input.tsx`
     - `/components/common/Modal.tsx`
     - `/components/common/Table.tsx`
  2. 고객 관련 컴포넌트 작성:
     - `/components/customers/CustomerList.tsx` (목록 + 필터링)
     - `/components/customers/CustomerCard.tsx` (카드 형태)
     - `/components/customers/CustomerForm.tsx` (등록/수정 폼)
     - `/components/customers/CustomerDetail.tsx` (상세 정보)
     - `/components/customers/CustomerFilters.tsx` (필터 UI)
  3. React Query 설정:
     ```typescript
     // /lib/queries/customers.ts
     export const useCustomers = filters => {
       return useQuery({
         queryKey: ['customers', filters],
         queryFn: () => fetchCustomers(filters),
       });
     };
     ```
  4. 페이지 작성:
     - `/app/customers/page.tsx` (목록)
     - `/app/customers/[id]/page.tsx` (상세)
     - `/app/customers/new/page.tsx` (등록)
  5. Loading/Error 상태 처리
  6. Optimistic Updates 구현
- **완료 조건**:
  - 고객 목록 조회, 등록, 수정, 삭제 UI 동작 확인
  - 필터링/정렬 기능 동작 확인
- **예상 기간**: 7일
- **난이도**: 중
- **의존성**: ISSUE-03

---

#### ISSUE-05: 엑셀 파일 업로드 기능

- **목표**: 고객 데이터 일괄 등록 기능 구현
- **작업 내용**:
  1. 엑셀 파싱 라이브러리 설치 (`xlsx`)
     ```bash
     npm install xlsx
     ```
  2. API 작성:
     - `POST /api/customers/bulk` (엑셀 파일 업로드 처리)
     - 검증 로직 (중복, 필수 필드)
     - 트랜잭션 처리 (부분 실패 시 롤백)
  3. 업로드 UI 컴포넌트:
     - `/components/customers/BulkUpload.tsx`
     - 드래그앤드롭 지원
     - 진행률 표시
     - 에러 결과 표시 (어떤 행에서 실패했는지)
  4. 엑셀 템플릿 다운로드 기능
- **완료 조건**:
  - 100개 이상의 고객 데이터 일괄 등록 성공
  - 에러 처리 확인 (잘못된 데이터 감지)
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-03

---

### Phase 3: 정부지원사업 데이터 수집 (Week 5-6)

#### ISSUE-06: 다중 공공데이터 API 통합 연동 (중기부 + K-startup) (⚠️ 고위험)

- **목표**: 2개 API 통합 수집 및 저장 자동화 (중기부, K-startup)
- **작업 내용**:
  1. Prisma 스키마 작성 (`Program` 모델)

     ```prisma
     model Program {
       id              String   @id @default(uuid())

       // 다중 API 대응 필드 (NEW)
       dataSource      String   // "중기부", "K-startup"
       sourceApiId     String   // 각 API에서 제공하는 원본 ID

       // 기본 정보
       title           String
       description     String?  // 프로그램 설명
       category        String?
       targetAudience  String[] // 대상 업종
       targetLocation  String[] // 대상 지역
       keywords        String[] // 키워드 배열
       budgetRange     String?
       deadline        DateTime?
       sourceUrl       String?
       rawData         Json     // 원본 데이터 보관 (API별 차이 흡수)

       // 동기화 메타데이터 (NEW)
       lastSyncedAt    DateTime @default(now()) @updatedAt
       syncStatus      String   @default("active") // "active", "outdated", "deleted"

       createdAt       DateTime @default(now())
       updatedAt       DateTime @updatedAt

       matchingResults MatchingResult[]

       // 복합 인덱스 (검색 성능 향상)
       @@unique([dataSource, sourceApiId]) // 중복 방지
       @@index([category])
       @@index([targetAudience])
       @@index([targetLocation])
       @@index([deadline])
       @@index([dataSource]) // API별 필터링
       @@index([lastSyncedAt]) // 동기화 추적
     }
     ```

  2. API 클라이언트 작성 (어댑터 패턴):

     ```typescript
     // /lib/apis/base-api-client.ts
     export interface IProgramAPIClient {
       fetchPrograms(params: SyncParams): Promise<RawProgramData[]>;
       extractKeywords(raw: any): string[];
       parseLocation(raw: any): string[];
       getDataSource(): string; // "중기부", "K-startup"
     }

     // /lib/apis/msme-api-client.ts (중기부 - 기존 코드 활용)
     export class MSMEAPIClient implements IProgramAPIClient {
       private apiKey: string;
       private baseUrl: string;

       getDataSource() {
         return '중기부';
       }

       async fetchPrograms(params) {
         // Rate limiting 적용
         // Retry logic (Exponential backoff)
         // 기존 중기부 API 코드 활용
       }

       extractKeywords(program: any): string[] {
         // 프로그램 제목 및 설명에서 키워드 추출
       }

       parseLocation(program: any): string[] {
         // API 응답에서 지역 정보 추출
       }
     }

     // /lib/apis/kstartup-api-client.ts (K-startup - 기존 코드 활용)
     export class KStartupAPIClient implements IProgramAPIClient {
       private apiKey: string;
       private baseUrl: string;

       getDataSource() {
         return 'K-startup';
       }

       async fetchPrograms(params) {
         // 기존 K-startup API 코드 활용
       }

       extractKeywords(program: any): string[] {
         /* ... */
       }
       parseLocation(program: any): string[] {
         /* ... */
       }
     }
     ```

  3. 통합 동기화 오케스트레이터 작성:

     ```typescript
     // /lib/sync/program-sync-orchestrator.ts
     export class ProgramSyncOrchestrator {
       private clients: IProgramAPIClient[] = [new MSMEAPIClient(), new KStartupAPIClient()];

       async syncAll() {
         // Promise.allSettled로 병렬 동기화
         const results = await Promise.allSettled(
           this.clients.map(client => this.syncFromClient(client))
         );
         return { total, succeeded, failed };
       }

       private async syncFromClient(client: IProgramAPIClient) {
         const rawData = await client.fetchPrograms({
           /* params */
         });

         for (const raw of rawData) {
           await db.program.upsert({
             where: {
               dataSource_sourceApiId: {
                 dataSource: client.getDataSource(),
                 sourceApiId: raw.id,
               },
             },
             update: {
               /* 필드 업데이트 */
             },
             create: {
               /* 새로 생성 */
             },
           });
         }
       }
     }
     ```

     - `POST /api/programs/sync` (수동 동기화 트리거)
     - 중복 방지: `@@unique([dataSource, sourceApiId])`
     - 변경 감지 (새로운 데이터만 저장)
     - **키워드 및 지역 정보 자동 추출**

  4. **프로그램 조회 API 구현** (저장된 데이터 접근):

     ```typescript
     // /app/api/programs/route.ts (목록 조회)
     export async function GET(request: Request) {
       const { searchParams } = new URL(request.url);

       // 필터 파라미터 추출
       const category = searchParams.get('category');
       const industry = searchParams.get('industry');
       const location = searchParams.get('location');
       const dataSource = searchParams.get('dataSource'); // "중기부", "K-startup"
       const page = parseInt(searchParams.get('page') || '1');
       const limit = parseInt(searchParams.get('limit') || '20');

       // 동적 필터 조건 생성
       const where: any = {
         syncStatus: 'active', // 활성화된 프로그램만
       };

       if (category) where.category = category;
       if (industry) where.targetAudience = { has: industry };
       if (location) where.targetLocation = { has: location };
       if (dataSource) where.dataSource = dataSource;

       // 페이지네이션
       const skip = (page - 1) * limit;

       // 데이터 조회
       const [programs, total] = await Promise.all([
         db.program.findMany({
           where,
           skip,
           take: limit,
           orderBy: { deadline: 'asc' }, // 마감일 빠른 순
           select: {
             id: true,
             title: true,
             description: true,
             category: true,
             targetAudience: true,
             targetLocation: true,
             keywords: true,
             budgetRange: true,
             deadline: true,
             sourceUrl: true,
             dataSource: true,
             createdAt: true,
           },
         }),
         db.program.count({ where }),
       ]);

       return Response.json({
         success: true,
         data: programs,
         pagination: {
           page,
           limit,
           total,
           totalPages: Math.ceil(total / limit),
         },
       });
     }
     ```

     ```typescript
     // /app/api/programs/[id]/route.ts (상세 조회)
     export async function GET(request: Request, { params }: { params: { id: string } }) {
       const program = await db.program.findUnique({
         where: { id: params.id },
         include: {
           matchingResults: {
             take: 5,
             orderBy: { score: 'desc' },
             include: {
               customer: {
                 select: {
                   id: true,
                   name: true,
                   industry: true,
                   location: true,
                 },
               },
             },
           },
         },
       });

       if (!program) {
         return Response.json({ success: false, error: 'Program not found' }, { status: 404 });
       }

       return Response.json({
         success: true,
         data: program,
       });
     }
     ```

  5. Vercel Cron Job 설정 (`/app/api/cron/sync-programs/route.ts`)

     ```typescript
     // 매일 새벽 2시 자동 동기화
     import { ProgramSyncOrchestrator } from '@/lib/sync/program-sync-orchestrator';

     export async function GET(request: Request) {
       // Vercel Cron Secret 검증
       const authHeader = request.headers.get('authorization');
       if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
         return new Response('Unauthorized', { status: 401 });
       }

       try {
         const orchestrator = new ProgramSyncOrchestrator();
         const result = await orchestrator.syncAll();
         console.log('[Sync Success]', result);
         return Response.json({ success: true, ...result });
       } catch (error) {
         console.error('[Sync Error]', error);
         return Response.json({ success: false, error: error.message }, { status: 500 });
       }
     }
     ```

     - `vercel.json` 설정:
       ```json
       {
         "crons": [
           {
             "path": "/api/cron/sync-programs",
             "schedule": "0 2 * * *"
           }
         ]
       }
       ```

  6. 에러 처리 및 로깅
     - API 호출 실패 시 재시도 (Exponential Backoff)
     - Sentry 연동 (에러 추적)
     - **API별 독립 실행** (하나 실패해도 나머지 계속)
  7. Rate Limiting 구현 (Upstash Redis 활용)
  8. Redis 캐싱 전략:
     - 프로그램 목록 캐싱 (1시간)
     - 증분 동기화 (lastSyncedAt 기준)

- **완료 조건**:
  - **2개 API 연동 성공** (중기부, K-startup)
  - **각 API별 최소 50개 이상 데이터 수집** (총 100개 이상)
  - **모든 프로그램에 업종, 지역, 키워드 정보 포함**
  - 일일 자동 동기화 동작 확인 (Cron Job)
  - API Rate Limit 에러 없음
  - **병렬 동기화 동작 확인** (Promise.allSettled)
- **예상 기간**: 10일
- **난이도**: 고 (⚠️ 외부 API 의존성, Rate Limit 리스크)
- **의존성**: ISSUE-00
- **리스크**:
  - 중기부/K-startup API 응답 속도 느림 가능성
  - **API별 응답 형식 차이**
  - API 구조 변경 가능성
  - Rate Limit 초과 가능성
  - **동기화 시간 증가** (2개 API 순차 처리 시)
- **완화 전략**:
  - Redis 캐싱 (1시간)
  - Exponential Backoff Retry
  - **병렬 동기화** (Promise.allSettled)
  - **어댑터 패턴** (API별 차이 흡수)
  - **`rawData` JSON 필드** (원본 데이터 보관)
  - 점진적 동기화 (페이지 단위)
  - **증분 동기화** (lastSyncedAt 기준)

---

#### ISSUE-07: 정부지원사업 UI 컴포넌트 개발

- **목표**: 프로그램 목록, 상세, 검색 UI 구현
- **작업 내용**:
  1. 프로그램 관련 컴포넌트 작성:
     - `/components/programs/ProgramList.tsx` (목록 + 필터링)
     - `/components/programs/ProgramCard.tsx` (카드 형태)
     - `/components/programs/ProgramDetail.tsx` (상세 정보)
     - `/components/programs/ProgramFilters.tsx` (**업종/지역/마감일 필터**)
     - `/components/programs/ProgramSearch.tsx` (**키워드 검색 UI**)
  2. React Query 설정:
     ```typescript
     // /lib/queries/programs.ts
     export const usePrograms = filters => {
       return useQuery({
         queryKey: ['programs', filters],
         queryFn: () => fetchPrograms(filters),
         staleTime: 1000 * 60 * 60, // 1시간 캐싱
       });
     };
     ```
  3. 페이지 작성:
     - `/app/programs/page.tsx` (목록)
     - `/app/programs/[id]/page.tsx` (상세)
  4. **실시간 검색/필터링 API 구현** (`GET /api/programs` 확장)

     ```typescript
     // /app/api/programs/route.ts (실시간 검색 기능 추가)
     export async function GET(request: Request) {
       const { searchParams } = new URL(request.url);

       // 검색/필터 파라미터 추출
       const keyword = searchParams.get('keyword'); // 제목/키워드 검색
       const category = searchParams.get('category'); // 카테고리
       const industry = searchParams.get('industry'); // 대상 업종
       const location = searchParams.get('location'); // 대상 지역
       const dataSource = searchParams.get('dataSource'); // "중기부", "K-startup"
       const deadlineStatus = searchParams.get('deadlineStatus'); // "active", "closing_soon", "closed"
       const startDate = searchParams.get('startDate'); // 생성일 시작
       const endDate = searchParams.get('endDate'); // 생성일 종료
       const sortBy = searchParams.get('sortBy') || 'deadline'; // deadline, createdAt, title
       const sortOrder = searchParams.get('sortOrder') || 'asc'; // asc, desc
       const page = parseInt(searchParams.get('page') || '1');
       const limit = parseInt(searchParams.get('limit') || '20');

       // 동적 필터 조건 생성
       const where: any = {
         syncStatus: 'active', // 활성화된 프로그램만
       };

       // 1. 제목/키워드 실시간 검색 (PostgreSQL Full-Text Search)
       if (keyword) {
         where.OR = [
           { title: { contains: keyword, mode: 'insensitive' } }, // 제목 포함 검색
           { description: { contains: keyword, mode: 'insensitive' } }, // 설명 포함 검색
           { keywords: { hasSome: keyword.split(' ') } }, // 키워드 배열 검색
         ];
       }

       // 2. 카테고리 필터
       if (category) where.category = category;

       // 3. 업종 필터
       if (industry) where.targetAudience = { has: industry };

       // 4. 지역 필터
       if (location) where.targetLocation = { has: location };

       // 5. 데이터 출처 필터 (중기부, K-startup)
       if (dataSource) where.dataSource = dataSource;

       // 6. 마감 여부 필터
       if (deadlineStatus) {
         const now = new Date();
         const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

         if (deadlineStatus === 'active') {
           // 진행중 (마감일이 현재보다 미래)
           where.deadline = { gte: now };
         } else if (deadlineStatus === 'closing_soon') {
           // 마감 임박 (7일 이내)
           where.deadline = {
             gte: now,
             lte: sevenDaysLater,
           };
         } else if (deadlineStatus === 'closed') {
           // 마감 완료
           where.deadline = { lt: now };
         }
       }

       // 7. 일자별 필터 (생성일 범위)
       if (startDate || endDate) {
         where.createdAt = {};
         if (startDate) where.createdAt.gte = new Date(startDate);
         if (endDate) where.createdAt.lte = new Date(endDate);
       }

       // 페이지네이션
       const skip = (page - 1) * limit;

       // 정렬 조건
       const orderBy: any = {};
       if (sortBy === 'deadline') {
         orderBy.deadline = sortOrder;
       } else if (sortBy === 'createdAt') {
         orderBy.createdAt = sortOrder;
       } else if (sortBy === 'title') {
         orderBy.title = sortOrder;
       }

       // 데이터 조회
       const [programs, total] = await Promise.all([
         db.program.findMany({
           where,
           skip,
           take: limit,
           orderBy,
           select: {
             id: true,
             title: true,
             description: true,
             category: true,
             targetAudience: true,
             targetLocation: true,
             keywords: true,
             budgetRange: true,
             deadline: true,
             sourceUrl: true,
             dataSource: true,
             createdAt: true,
           },
         }),
         db.program.count({ where }),
       ]);

       return Response.json({
         success: true,
         data: programs,
         pagination: {
           page,
           limit,
           total,
           totalPages: Math.ceil(total / limit),
         },
         filters: {
           keyword,
           category,
           industry,
           location,
           dataSource,
           deadlineStatus,
           startDate,
           endDate,
           sortBy,
           sortOrder,
         },
       });
     }
     ```

  5. **실시간 검색 UI 컴포넌트** (`ProgramFilters.tsx` 확장)

     ```typescript
     // /components/programs/ProgramFilters.tsx
     'use client';

     import { useState, useEffect } from 'react';
     import { useRouter, useSearchParams } from 'next/navigation';
     import { useDebounce } from '@/hooks/useDebounce';
     import { Input } from '@/components/ui/input';
     import { Select } from '@/components/ui/select';
     import { Button } from '@/components/ui/button';
     import { Calendar } from '@/components/ui/calendar';

     export function ProgramFilters() {
       const router = useRouter();
       const searchParams = useSearchParams();

       // 필터 상태
       const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
       const [category, setCategory] = useState(searchParams.get('category') || '');
       const [industry, setIndustry] = useState(searchParams.get('industry') || '');
       const [location, setLocation] = useState(searchParams.get('location') || '');
       const [dataSource, setDataSource] = useState(searchParams.get('dataSource') || '');
       const [deadlineStatus, setDeadlineStatus] = useState(searchParams.get('deadlineStatus') || '');
       const [startDate, setStartDate] = useState<Date | null>(null);
       const [endDate, setEndDate] = useState<Date | null>(null);
       const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'deadline');
       const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'asc');

       // 실시간 검색 (300ms 디바운싱)
       const debouncedKeyword = useDebounce(keyword, 300);

       // URL 업데이트 (실시간 검색)
       useEffect(() => {
         const params = new URLSearchParams();

         if (debouncedKeyword) params.set('keyword', debouncedKeyword);
         if (category) params.set('category', category);
         if (industry) params.set('industry', industry);
         if (location) params.set('location', location);
         if (dataSource) params.set('dataSource', dataSource);
         if (deadlineStatus) params.set('deadlineStatus', deadlineStatus);
         if (startDate) params.set('startDate', startDate.toISOString());
         if (endDate) params.set('endDate', endDate.toISOString());
         if (sortBy) params.set('sortBy', sortBy);
         if (sortOrder) params.set('sortOrder', sortOrder);

         router.push(`/programs?${params.toString()}`);
       }, [debouncedKeyword, category, industry, location, dataSource, deadlineStatus, startDate, endDate, sortBy, sortOrder]);

       // 필터 초기화
       const handleReset = () => {
         setKeyword('');
         setCategory('');
         setIndustry('');
         setLocation('');
         setDataSource('');
         setDeadlineStatus('');
         setStartDate(null);
         setEndDate(null);
         setSortBy('deadline');
         setSortOrder('asc');
         router.push('/programs');
       };

       return (
         <div className="space-y-4 p-4 bg-white rounded-lg shadow">
           {/* 실시간 검색 (제목/키워드) */}
           <div>
             <label className="block text-sm font-medium mb-2">제목/키워드 검색</label>
             <Input
               type="text"
               placeholder="프로그램 제목 또는 키워드 입력..."
               value={keyword}
               onChange={(e) => setKeyword(e.target.value)}
               className="w-full"
             />
             {keyword && (
               <p className="text-xs text-gray-500 mt-1">
                 검색 중... (300ms 후 자동 검색)
               </p>
             )}
           </div>

           {/* 카테고리 필터 */}
           <div>
             <label className="block text-sm font-medium mb-2">카테고리</label>
             <Select value={category} onValueChange={setCategory}>
               <option value="">전체</option>
               <option value="창업지원">창업지원</option>
               <option value="R&D지원">R&D지원</option>
               <option value="수출지원">수출지원</option>
               <option value="인력지원">인력지원</option>
               <option value="금융지원">금융지원</option>
             </Select>
           </div>

           {/* 업종 필터 */}
           <div>
             <label className="block text-sm font-medium mb-2">대상 업종</label>
             <Select value={industry} onValueChange={setIndustry}>
               <option value="">전체</option>
               <option value="제조업">제조업</option>
               <option value="IT/소프트웨어">IT/소프트웨어</option>
               <option value="서비스업">서비스업</option>
               <option value="유통업">유통업</option>
               <option value="건설업">건설업</option>
             </Select>
           </div>

           {/* 지역 필터 */}
           <div>
             <label className="block text-sm font-medium mb-2">대상 지역</label>
             <Select value={location} onValueChange={setLocation}>
               <option value="">전체</option>
               <option value="서울">서울</option>
               <option value="경기">경기</option>
               <option value="인천">인천</option>
               <option value="부산">부산</option>
               <option value="대구">대구</option>
               <option value="광주">광주</option>
               <option value="대전">대전</option>
               <option value="울산">울산</option>
               <option value="세종">세종</option>
             </Select>
           </div>

           {/* 데이터 출처 필터 */}
           <div>
             <label className="block text-sm font-medium mb-2">데이터 출처</label>
             <Select value={dataSource} onValueChange={setDataSource}>
               <option value="">전체</option>
               <option value="중기부">중기부</option>
               <option value="K-startup">K-startup</option>
             </Select>
           </div>

           {/* 마감 여부 필터 */}
           <div>
             <label className="block text-sm font-medium mb-2">마감 여부</label>
             <Select value={deadlineStatus} onValueChange={setDeadlineStatus}>
               <option value="">전체</option>
               <option value="active">진행중</option>
               <option value="closing_soon">마감 임박 (7일 이내)</option>
               <option value="closed">마감 완료</option>
             </Select>
           </div>

           {/* 일자별 필터 */}
           <div>
             <label className="block text-sm font-medium mb-2">생성일 범위</label>
             <div className="flex gap-2">
               <Calendar
                 selected={startDate}
                 onSelect={setStartDate}
                 placeholder="시작일"
               />
               <span className="self-center">~</span>
               <Calendar
                 selected={endDate}
                 onSelect={setEndDate}
                 placeholder="종료일"
               />
             </div>
           </div>

           {/* 정렬 옵션 */}
           <div>
             <label className="block text-sm font-medium mb-2">정렬</label>
             <div className="flex gap-2">
               <Select value={sortBy} onValueChange={setSortBy} className="flex-1">
                 <option value="deadline">마감일</option>
                 <option value="createdAt">생성일</option>
                 <option value="title">제목</option>
               </Select>
               <Select value={sortOrder} onValueChange={setSortOrder} className="w-24">
                 <option value="asc">오름차순</option>
                 <option value="desc">내림차순</option>
               </Select>
             </div>
           </div>

           {/* 필터 초기화 버튼 */}
           <Button onClick={handleReset} variant="outline" className="w-full">
             필터 초기화
           </Button>
         </div>
       );
     }
     ```

  6. **디바운스 Hook 구현**

     ```typescript
     // /hooks/useDebounce.ts
     import { useState, useEffect } from 'react';

     export function useDebounce<T>(value: T, delay: number): T {
       const [debouncedValue, setDebouncedValue] = useState<T>(value);

       useEffect(() => {
         const handler = setTimeout(() => {
           setDebouncedValue(value);
         }, delay);

         return () => {
           clearTimeout(handler);
         };
       }, [value, delay]);

       return debouncedValue;
     }
     ```

  7. **React Query 실시간 검색 통합**

     ```typescript
     // /lib/queries/programs.ts
     import { useQuery } from '@tanstack/react-query';
     import { useSearchParams } from 'next/navigation';

     export const usePrograms = () => {
       const searchParams = useSearchParams();

       // URL 쿼리 파라미터를 queryKey로 사용 (실시간 검색)
       const filters = {
         keyword: searchParams.get('keyword') || undefined,
         category: searchParams.get('category') || undefined,
         industry: searchParams.get('industry') || undefined,
         location: searchParams.get('location') || undefined,
         dataSource: searchParams.get('dataSource') || undefined,
         deadlineStatus: searchParams.get('deadlineStatus') || undefined,
         startDate: searchParams.get('startDate') || undefined,
         endDate: searchParams.get('endDate') || undefined,
         sortBy: searchParams.get('sortBy') || 'deadline',
         sortOrder: searchParams.get('sortOrder') || 'asc',
         page: searchParams.get('page') || '1',
         limit: searchParams.get('limit') || '20',
       };

       return useQuery({
         queryKey: ['programs', filters], // 필터 변경 시 자동 재요청
         queryFn: async () => {
           const params = new URLSearchParams(
             Object.entries(filters).filter(([_, v]) => v !== undefined) as [string, string][]
           );
           const response = await fetch(`/api/programs?${params.toString()}`);
           if (!response.ok) throw new Error('Failed to fetch programs');
           return response.json();
         },
         staleTime: 1000 * 60 * 5, // 5분 캐싱 (실시간 검색 시 짧게 설정)
         keepPreviousData: true, // 필터 변경 시 이전 데이터 유지 (UX 개선)
       });
     };
     ```

  8. 무한 스크롤 구현 (React Query Infinite Query)

- **완료 조건**:
  - 프로그램 목록 조회 동작 확인
  - **실시간 검색/필터링 기능 완전 동작**:
    - ✅ 제목/키워드 검색 (300ms 디바운싱)
    - ✅ 카테고리 필터
    - ✅ 업종 필터
    - ✅ 지역 필터
    - ✅ 데이터 출처 필터 (중기부, K-startup)
    - ✅ 마감 여부 필터 (진행중, 마감 임박, 마감 완료)
    - ✅ 일자별 필터 (생성일 범위)
    - ✅ 정렬 옵션 (마감일, 생성일, 제목 + 오름차순/내림차순)
  - 필터 초기화 버튼 동작 확인
  - 무한 스크롤 성능 검증
  - 모바일 필터 UI 최적화 확인 (Bottom Sheet 또는 Drawer)
- **예상 기간**: 7일
- **난이도**: 중
- **의존성**: ISSUE-05

---

### Phase 4: 업종/키워드/지역 매칭 시스템 (Week 7-8)

#### ISSUE-08: 업종/키워드/지역 기반 매칭 로직 구현

- **목표**: 고객 정보 기반 최적 프로그램 추천 알고리즘 개발
- **작업 내용**:
  1. 매칭 알고리즘 설계 (규칙 기반):
     - **업종 매칭**: 고객 업종과 프로그램 대상 업종 일치 여부
     - **지역 매칭**: 고객 지역과 프로그램 대상 지역 일치 여부
     - **키워드 매칭**: 고객의 challenges/goals와 프로그램 키워드 일치 개수
     - **점수 계산**: 업종(30점) + 지역(30점) + 키워드(최대 40점)
  2. 매칭 API 작성:
     - `POST /api/matching` (고객 ID 기반 매칭 실행)

     ```typescript
     // /app/api/matching/route.ts
     export async function POST(request: Request) {
       const { customerId } = await request.json();

       // 1. 고객 정보 조회
       const customer = await db.customer.findUnique({
         where: { id: customerId },
       });

       // 2. 고객 키워드 추출
       const customerKeywords = [...customer.challenges, ...customer.goals];

       // 2-1. 선호 키워드 (영업자가 선택한 프로그램 기반)
       const preferredKeywords = customer.preferredKeywords || [];

       // 3. 프로그램 검색 (업종 또는 지역 일치)
       const programs = await db.program.findMany({
         where: {
           OR: [
             { targetAudience: { has: customer.industry } },
             { targetLocation: { has: customer.location } },
             { keywords: { hasSome: customerKeywords } },
           ],
         },
       });

       // 4. 스코어링
       const scored = programs.map(program => {
         let score = 0;
         let matchedIndustry = false;
         let matchedLocation = false;
         const matchedKeywords: string[] = [];

         // 업종 일치: +30점
         if (program.targetAudience?.includes(customer.industry)) {
           score += 30;
           matchedIndustry = true;
         }

         // 지역 일치: +30점
         if (program.targetLocation?.includes(customer.location)) {
           score += 30;
           matchedLocation = true;
         }

         // 키워드 일치: 기본 +10점, 선호 키워드 +15점 (최대 40점)
         for (const keyword of customerKeywords) {
           if (
             program.keywords?.includes(keyword) ||
             program.title?.includes(keyword) ||
             program.description?.includes(keyword)
           ) {
             matchedKeywords.push(keyword);

             // 선호 키워드면 가중치 50% 추가
             const keywordScore = preferredKeywords.includes(keyword) ? 15 : 10;
             score += keywordScore;
           }
         }
         // 최대 40점 제한
         score = Math.min(score, matchedIndustry ? 30 : 0 + matchedLocation ? 30 : 0 + 40);

         return {
           programId: program.id,
           score,
           matchedIndustry,
           matchedLocation,
           matchedKeywords,
         };
       });

       // 5. 상위 10개 선택 (최소 30점 이상)
       const topMatches = scored
         .filter(m => m.score >= 30)
         .sort((a, b) => b.score - a.score)
         .slice(0, 10);

       // 6. 매칭 결과 저장
       await db.matchingResult.createMany({
         data: topMatches.map(match => ({
           customerId,
           ...match,
         })),
       });

       return Response.json({ success: true, matches: topMatches });
     }
     ```

  3. Prisma 스키마 작성 (`MatchingResult` 모델)

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

       customer          Customer @relation(fields: [customerId], references: [id])
       program           Program  @relation(fields: [programId], references: [id])

       @@index([customerId])
       @@index([score])
     }
     ```

  4. 성능 최적화:
     - 고객당 매칭 결과 캐싱 (24시간, Redis)
     - Database Index 활용 (targetAudience, targetLocation, keywords)
     - 매칭 결과 재사용 (고객 정보 변경 시에만 재계산)

- **완료 조건**:
  - 고객-프로그램 매칭 정확도 70% 이상 (수동 검증)
  - 매칭 시간 **2초 이내**
  - 최소 30점 이상의 매칭만 저장
- **예상 기간**: **7일** (AI 제거로 3일 단축)
- **난이도**: **중**
- **의존성**: ISSUE-05

---

#### ISSUE-09: 매칭 결과 UI 개발

- **목표**: 매칭 결과 표시 및 관리 UI 구현
- **작업 내용**:
  1. 매칭 관련 컴포넌트 작성:
     - `/components/matching/MatchingResults.tsx` (결과 목록)
     - `/components/matching/MatchingScore.tsx` (스코어 시각화: 프로그레스 바)
     - `/components/matching/MatchingDetails.tsx` (매칭 상세: 업종/지역/키워드 일치 여부 표시)
     - `/components/matching/MatchingFilters.tsx` (결과 필터링: 최소 점수)
     - `/components/matching/MatchingHistory.tsx` (이력 관리)
     - `/components/matching/ProgramSelection.tsx` (프로그램 선택: 체크박스 + 학습 버튼)
  2. 페이지 작성:
     - `/app/customers/[id]/matching/page.tsx` (고객별 매칭 결과)
  3. 실시간 매칭 실행 기능:
     - 버튼 클릭 시 API 호출
     - Loading 상태 표시 (스피너)
     - 결과 애니메이션 (Fade In)
  4. 매칭 결과 표시:
     - **업종 일치**: 배지 표시 (예: "<Check /> 업종 일치" - Lucide Check 아이콘 사용)
     - **지역 일치**: 배지 표시 (예: "<MapPin /> 지역 일치" - Lucide MapPin 아이콘 사용)
     - **키워드 일치**: 태그 목록 (예: "<Tag /> 창업, R&D, 수출" - Lucide Tag 아이콘 사용)
     - **점수**: 프로그레스 바 (0-100점)
  5. 매칭 결과 관리:
     - 즐겨찾기 기능
     - 노트 추가 기능
  6. **프로그램 선택 및 학습 기능** (새로 추가):
     - 매칭 결과 각 항목에 체크박스 추가
     - "선택한 프로그램으로 학습" 버튼 추가
     - 선택된 프로그램 ID 배열을 `POST /api/matching/update-preferences`로 전송
     - 학습 완료 후 토스트 메시지 표시
- **완료 조건**:
  - 매칭 실행 → 결과 표시 흐름 동작 확인
  - 스코어 및 매칭 이유 시각화 명확성 검증
- **예상 기간**: 5일 (단순화로 2일 단축)
- **난이도**: 중
- **의존성**: ISSUE-07

---

#### ISSUE-10: 매칭 알고리즘 개선 및 피드백 루프

- **목표**: 사용자 피드백 및 선택 기반 매칭 가중치 조정
- **작업 내용**:
  1. **선택 기반 학습** (새로 추가):
     - 영업자가 선택한 프로그램의 키워드를 고객 선호도에 반영
     - API 엔드포인트 작성: `POST /api/matching/update-preferences`

     ```typescript
     // /app/api/matching/update-preferences/route.ts
     export async function POST(request: Request) {
       const { customerId, selectedProgramIds } = await request.json();

       // 1. 선택된 프로그램들 조회
       const selectedPrograms = await db.program.findMany({
         where: { id: { in: selectedProgramIds } },
       });

       // 2. 공통 키워드 추출 (중복 제거)
       const allKeywords = selectedPrograms.flatMap(p => p.keywords || []);
       const uniqueKeywords = [...new Set(allKeywords)];

       // 3. 고객 정보에 선호 키워드 추가 (기존 키워드와 병합)
       await db.customer.update({
         where: { id: customerId },
         data: {
           preferredKeywords: {
             push: uniqueKeywords, // 배열에 추가
           },
         },
       });

       return Response.json({
         success: true,
         addedKeywords: uniqueKeywords,
       });
     }
     ```

     - 다음 매칭 시 선호 키워드에 가중치 부여 (+50%: 10점 → 15점)
     - 선호 키워드는 `MatchingDetails` 컴포넌트에서 별도 표시 (<Star /> Lucide Star 아이콘 사용)

  2. 피드백 수집 UI:
     - 매칭 결과에 "유용함/유용하지 않음" 버튼 추가
  3. 피드백 데이터 저장:

     ```prisma
     model MatchingFeedback {
       id              String   @id @default(uuid())
       matchingResultId String
       isHelpful       Boolean
       comment         String?
       createdAt       DateTime @default(now())

       matchingResult  MatchingResult @relation(fields: [matchingResultId], references: [id])
     }
     ```

  4. 피드백 기반 가중치 조정:
     - **업종/지역/키워드 점수 비율 조정**
     - 예: 업종 피드백 좋음 → 업종 점수 30점 → 35점
     - 피드백 통계 분석 대시보드 추가
  5. 매칭 규칙 개선:
     - 고객별 선호도 학습 (예: 특정 고객은 지역보다 업종 중시)
     - 수동 가중치 조정 기능 (관리자)

- **완료 조건**:
  - **선택 기반 학습 기능 동작 확인** (새로 추가)
  - **선호 키워드가 다음 매칭에 반영되는지 검증** (새로 추가)
  - 피드백 수집 기능 동작 확인
  - 피드백 반영 후 정확도 5% 이상 개선
- **예상 기간**: 4일 (선택 기반 학습 기능 추가로 1일 증가)
- **난이도**: 하
- **의존성**: ISSUE-08

---

### Phase 5: 커뮤니케이션 자동화 (Week 10-11)

#### ISSUE-11: 이메일 템플릿 시스템 구현

- **목표**: 커스터마이징 가능한 이메일 템플릿 관리 시스템 개발
- **작업 내용**:
  1. Prisma 스키마 작성 (`EmailTemplate` 모델)

     ```prisma
     model EmailTemplate {
       id          String   @id @default(uuid())
       userId      String
       name        String
       subject     String
       body        String   // HTML 지원
       variables   String[] // 사용 가능한 변수 (예: {{customerName}})
       createdAt   DateTime @default(now())
       updatedAt   DateTime @updatedAt

       user        User     @relation(fields: [userId], references: [id])
     }
     ```

  2. 템플릿 CRUD API:
     - `POST /api/communication/templates`
     - `GET /api/communication/templates`
     - `PUT /api/communication/templates/[id]`
     - `DELETE /api/communication/templates/[id]`
  3. 템플릿 에디터 UI:
     - `/components/communication/TemplateEditor.tsx`
     - Rich Text Editor 통합 (TipTap / Quill)
     - 변수 삽입 기능 ({{customerName}}, {{programTitle}} 등)
     - 미리보기 기능
  4. 템플릿 렌더링 함수:
     ```typescript
     // /lib/email/renderer.ts
     export function renderTemplate(template: string, data: Record<string, any>): string {
       return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
     }
     ```

- **완료 조건**:
  - 템플릿 생성/수정/삭제 동작 확인
  - 변수 치환 정확성 검증
- **예상 기간**: 7일
- **난이도**: 중
- **의존성**: ISSUE-02

---

#### ISSUE-12: 이메일 발송 기능 구현

- **목표**: 고객에게 매칭 결과를 이메일로 전송하는 기능 개발
- **작업 내용**:
  1. 이메일 서비스 선택 및 연동:
     - Resend (추천, Vercel 최적화) 또는 SendGrid
     ```bash
     npm install resend
     ```
  2. 이메일 발송 API 작성:
     - `POST /api/communication/email`

     ```typescript
     // /app/api/communication/email/route.ts
     import { Resend } from 'resend';

     const resend = new Resend(process.env.RESEND_API_KEY);

     export async function POST(request: Request) {
       const { templateId, customerId, programIds } = await request.json();

       // 템플릿 및 데이터 조회
       const template = await db.emailTemplate.findUnique({ where: { id: templateId } });
       const customer = await db.customer.findUnique({ where: { id: customerId } });
       const programs = await db.program.findMany({ where: { id: { in: programIds } } });

       // 템플릿 렌더링
       const emailBody = renderTemplate(template.body, {
         customerName: customer.name,
         programs: programs.map(p => p.title).join(', '),
       });

       // 이메일 발송
       await resend.emails.send({
         from: 'noreply@yourdomain.com',
         to: customer.contactEmail,
         subject: template.subject,
         html: emailBody,
       });

       return Response.json({ success: true });
     }
     ```

  3. 발송 이력 저장:

     ```prisma
     model EmailLog {
       id          String   @id @default(uuid())
       customerId  String
       templateId  String
       sentAt      DateTime @default(now())
       status      String   // sent, failed
       error       String?

       customer    Customer @relation(fields: [customerId], references: [id])
       template    EmailTemplate @relation(fields: [templateId], references: [id])
     }
     ```

  4. 에러 처리 및 재시도 로직
  5. 발송 결과 UI:
     - `/components/communication/EmailHistory.tsx`

- **완료 조건**:
  - 이메일 발송 성공 확인 (실제 수신)
  - 발송 실패 시 에러 처리 확인
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-11

---

#### ISSUE-13: 자동 발송 스케줄러 구현

- **목표**: 주기적으로 고객에게 새로운 매칭 결과 이메일 자동 발송
- **작업 내용**:
  1. Vercel Cron Job 설정:
     - `/app/api/cron/send-emails/route.ts`
     - 매주 월요일 오전 9시 실행
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/send-emails",
           "schedule": "0 9 * * 1"
         }
       ]
     }
     ```
  2. 자동 발송 로직:
     - 지난 1주일간 새로운 매칭 결과 조회
     - 고객별로 그룹화
     - 템플릿 렌더링 및 이메일 발송
  3. 발송 설정 관리:
     - 고객별 발송 주기 설정 (매주/격주/매월)
     - 수신 거부 기능
  4. Rate Limiting (Resend API 제한 대응)
- **완료 조건**:
  - 스케줄러 동작 확인 (테스트 실행)
  - 고객별 발송 주기 설정 동작 확인
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-12

---

### Phase 6: 대시보드 및 분석 (Week 12-13)

#### ISSUE-14: 대시보드 데이터 집계 API 구현

- **목표**: 컨설턴트가 활동을 한눈에 파악할 수 있는 통계 데이터 제공
- **작업 내용**:
  1. 집계 API 작성:
     - `GET /api/analytics`
     ```typescript
     // 반환 데이터 예시
     {
       totalCustomers: 150,
       totalPrograms: 500,
       totalMatchings: 1200,
       emailsSent: 80,
       recentActivity: [...],
       topPrograms: [...],  // 가장 많이 매칭된 프로그램
       topCustomers: [...], // 가장 많은 매칭 받은 고객
     }
     ```
  2. 성능 최적화:
     - Redis 캐싱 (10분)
     - Prisma Aggregate 활용
     - 인덱싱 최적화
  3. 시계열 데이터:
     - 일별/주별/월별 매칭 추이
     - 고객 증가 추이
- **완료 조건**:
  - API 응답 시간 1초 이내
  - 정확한 통계 데이터 반환 확인
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-09, ISSUE-12

---

#### ISSUE-15: 대시보드 UI 개발

- **목표**: 직관적인 대시보드 페이지 구현
- **작업 내용**:
  1. 대시보드 컴포넌트 작성:
     - `/components/dashboard/StatsCard.tsx` (통계 카드)
     - `/components/dashboard/Chart.tsx` (차트)
     - `/components/dashboard/RecentActivity.tsx` (최근 활동)
     - `/components/dashboard/QuickActions.tsx` (빠른 작업)
  2. 차트 라이브러리 연동:
     - Recharts 또는 Chart.js
     ```bash
     npm install recharts
     ```
  3. 페이지 작성:
     - `/app/dashboard/page.tsx`
  4. 실시간 업데이트:
     - React Query 자동 재검증 (1분마다)
- **완료 조건**:
  - 대시보드 로딩 시간 2초 이내
  - 차트 시각화 명확성 검증
- **예상 기간**: 7일
- **난이도**: 중
- **의존성**: ISSUE-14

---

#### ISSUE-16: 리포트 생성 기능

- **목표**: PDF 형태의 활동 리포트 생성 및 다운로드 기능
- **작업 내용**:
  1. PDF 생성 라이브러리 설치:
     ```bash
     npm install @react-pdf/renderer
     ```
  2. 리포트 API 작성:
     - `POST /api/analytics/report` (리포트 생성)
     - 기간 설정 (시작일~종료일)
     - PDF 파일 생성 및 Supabase Storage 업로드
  3. 리포트 템플릿 작성:
     - 고객 통계
     - 매칭 성과
     - 이메일 발송 이력
     - 차트/그래프
  4. 다운로드 UI:
     - `/components/dashboard/ReportGenerator.tsx`
- **완료 조건**:
  - PDF 리포트 다운로드 성공
  - 리포트 내용 정확성 검증
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-14

---

### Phase 7: 관리자 기능 (Week 14)

#### ISSUE-17: 사용자 관리 기능

- **목표**: 관리자용 사용자(컨설턴트) 관리 기능 구현
- **작업 내용**:
  1. Role 기반 권한 관리:
     ```prisma
     model User {
       id       String   @id @default(uuid())
       email    String   @unique
       name     String
       role     String   @default("consultant") // admin, consultant
       // ...
     }
     ```
  2. 관리자 API:
     - `GET /api/admin/users` (사용자 목록)
     - `PUT /api/admin/users/[id]` (사용자 정보 수정)
     - `DELETE /api/admin/users/[id]` (사용자 삭제)
  3. 관리자 페이지:
     - `/app/admin/users/page.tsx`
  4. 권한 체크 미들웨어:
     ```typescript
     // /lib/auth/role-check.ts
     export function requireAdmin(handler) {
       return async (req, res) => {
         const session = await getServerSession(authOptions);
         if (session?.user?.role !== 'admin') {
           return Response.json({ error: 'Unauthorized' }, { status: 403 });
         }
         return handler(req, res);
       };
     }
     ```
- **완료 조건**:
  - 관리자 계정으로 사용자 관리 동작 확인
  - 일반 사용자 접근 차단 확인
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-02

---

#### ISSUE-18: 시스템 설정 관리

- **목표**: 전역 설정 관리 기능 구현
- **작업 내용**:
  1. 설정 모델 작성:
     ```prisma
     model SystemSetting {
       id          String   @id @default(uuid())
       key         String   @unique
       value       Json
       description String?
       updatedAt   DateTime @updatedAt
     }
     ```
  2. 설정 API:
     - `GET /api/admin/settings`
     - `PUT /api/admin/settings/[key]`
  3. 설정 항목 예시:
     - 이메일 발송 주기 기본값
     - AI 매칭 임계값
     - 공공데이터 동기화 주기
  4. 설정 UI:
     - `/app/admin/settings/page.tsx`
- **완료 조건**:
  - 설정 변경 후 즉시 반영 확인
- **예상 기간**: 3일
- **난이도**: 하
- **의존성**: ISSUE-17

---

### Phase 8: 성능 최적화 및 테스트 (Week 15-16)

#### ISSUE-19: 성능 최적화

- **목표**: 애플리케이션 로딩 시간 및 응답 속도 개선
- **작업 내용**:
  1. 프론트엔드 최적화:
     - 코드 스플리팅 (Dynamic Import)
     - 이미지 최적화 (Next.js Image)
     - 폰트 최적화 (next/font)
     - Lazy Loading (React.lazy)
  2. 백엔드 최적화:
     - Database Indexing (Prisma)
     - Query 최적화 (N+1 문제 해결)
     - Redis 캐싱 강화
  3. 번들 사이즈 분석:

     ```bash
     npm install @next/bundle-analyzer
     ```

     - 불필요한 라이브러리 제거

  4. Lighthouse 성능 측정:
     - Performance Score 90+ 목표
     - Accessibility Score 95+ 목표

- **완료 조건**:
  - 초기 로딩 시간 3초 이내
  - API 응답 시간 평균 200ms 이내
  - Lighthouse Performance 90+
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: 모든 기능 구현 완료

---

#### ISSUE-20: 통합 테스트 작성

- **목표**: E2E 테스트 및 API 테스트 커버리지 확보
- **작업 내용**:
  1. Playwright 설치 및 설정:
     ```bash
     npm install -D @playwright/test
     npx playwright install
     ```
  2. E2E 테스트 작성:
     - 로그인 → 고객 등록 → 매칭 실행 → 이메일 발송 흐름
     - `/tests/e2e/customer-flow.spec.ts`
  3. API 테스트 작성:
     - Jest + Supertest
     - `/tests/api/customers.test.ts`
     - `/tests/api/matching.test.ts`
  4. 테스트 커버리지 목표:
     - API: 80% 이상
     - E2E: 주요 흐름 100% 커버
- **완료 조건**:
  - 모든 E2E 테스트 통과
  - CI/CD 파이프라인에 테스트 통합
- **예상 기간**: 7일
- **난이도**: 중
- **의존성**: 모든 기능 구현 완료

---

#### ISSUE-21: 에러 추적 및 모니터링 설정

- **목표**: 프로덕션 환경 에러 추적 및 성능 모니터링 구축
- **작업 내용**:
  1. Sentry 연동:

     ```bash
     npm install @sentry/nextjs
     ```

     - `sentry.client.config.ts`
     - `sentry.server.config.ts`
     - Error Boundary 설정

  2. Vercel Analytics 활성화
  3. Supabase 모니터링 대시보드 설정
  4. 알림 설정:
     - 에러 발생 시 이메일/Slack 알림
     - API 응답 시간 임계값 초과 시 알림

- **완료 조건**:
  - 의도적 에러 발생 시 Sentry 기록 확인
  - 알림 수신 확인
- **예상 기간**: 3일
- **난이도**: 하
- **의존성**: ISSUE-19

---

### Phase 9: 프로덕션 배포 준비 (Week 17)

#### ISSUE-22: 보안 강화

- **목표**: 프로덕션 환경 보안 강화
- **작업 내용**:
  1. 환경변수 보안:
     - `.env.local` → Vercel Environment Variables
     - Secrets 암호화
  2. Supabase RLS (Row Level Security) 설정:
     ```sql
     -- 고객 데이터는 소유자만 접근 가능
     CREATE POLICY customer_owner_policy ON "Customer"
       FOR ALL USING (auth.uid() = "userId");
     ```
  3. CORS 설정:
     - API 엔드포인트별 허용 도메인 설정
  4. Rate Limiting 강화:
     - Vercel Edge Config 활용
  5. XSS/CSRF 방지:
     - Next.js 내장 보안 기능 활용
     - Content Security Policy 설정
  6. 의존성 보안 검사:
     ```bash
     npm audit
     npm audit fix
     ```
- **완료 조건**:
  - OWASP Top 10 취약점 점검 완료
  - 보안 감사 통과
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: 모든 기능 구현 완료

---

#### ISSUE-23: 프로덕션 배포

- **목표**: Vercel 프로덕션 환경 배포
- **작업 내용**:
  1. Vercel Production 도메인 설정
  2. Supabase Production 인스턴스 설정:
     - 개발 DB → 프로덕션 DB 마이그레이션
     - Backup 설정
  3. 환경변수 프로덕션 설정:
     - OpenAI API Key
     - Resend API Key
     - 공공데이터포털 API Key
  4. Prisma Migration 실행:
     ```bash
     npx prisma migrate deploy
     ```
  5. DNS 설정 (커스텀 도메인)
  6. SSL 인증서 설정 (Vercel 자동)
  7. 헬스 체크 엔드포인트:
     - `GET /api/health` (시스템 상태 확인)
  8. 마이그레이션 준비 문서 작성:
     - Supabase → AWS RDS 마이그레이션 가이드
     - Vercel → 자체 서버 마이그레이션 가이드
- **완료 조건**:
  - 프로덕션 URL 접속 가능
  - 모든 기능 동작 확인
  - 마이그레이션 문서 완성
- **예상 기간**: 5일
- **난이도**: 중
- **의존성**: ISSUE-22

---

#### ISSUE-24: 사용자 문서 작성

- **목표**: 최종 사용자(컨설턴트)용 사용 가이드 작성
- **작업 내용**:
  1. 사용자 매뉴얼 작성:
     - 시작하기 (회원가입, 로그인)
     - 고객 관리 방법
     - 매칭 실행 방법
     - 이메일 템플릿 생성 방법
     - 대시보드 활용법
  2. FAQ 작성
  3. 동영상 튜토리얼 제작 (선택)
  4. 문서 배포:
     - `/app/docs/page.tsx` (인앱 문서)
     - 또는 Notion/GitBook
- **완료 조건**:
  - 사용자 매뉴얼 완성
  - 베타 테스터 피드백 반영
- **예상 기간**: 3일
- **난이도**: 하
- **의존성**: ISSUE-23

---

## 주요 변경 사항 히스토리

### v1.6 (2025-11-20) - 다중 공공데이터 API 통합 연동

- **핵심 변경**: 단일 API에서 2개 API 통합으로 아키텍처 변경
- **대상 API**:
  - **중기부 API** (기존 코드 활용)
  - **K-startup API** (기존 코드 활용)
  - ⏸️ 지자체 API (v2.0으로 연기)
- **데이터베이스 스키마 변경**:
  - `Program` 모델에 다중 API 대응 필드 추가:
    - `dataSource`: API 출처 구분 ("중기부", "K-startup")
    - `sourceApiId`: 각 API의 원본 ID (중복 방지)
    - `lastSyncedAt`: 마지막 동기화 시각
    - `syncStatus`: 동기화 상태 ("active", "outdated", "deleted")
    - `rawData`: 원본 데이터 보관 (JSON)
  - 복합 인덱스 추가:
    - `@@unique([dataSource, sourceApiId])` - 중복 방지
    - `@@index([dataSource])` - API별 필터링
    - `@@index([lastSyncedAt])` - 동기화 추적
- **API 아키텍처 개선**:
  - **어댑터 패턴**: `IProgramAPIClient` 인터페이스 도입
  - **MSMEAPIClient**: 중기부 API 클라이언트 (기존 코드 리팩토링)
  - **KStartupAPIClient**: K-startup API 클라이언트 (기존 코드 리팩토링)
  - **ProgramSyncOrchestrator**: 다중 API 병렬 동기화 조율
- **동기화 전략**:
  - **병렬 실행**: `Promise.allSettled`로 2개 API 동시 동기화
  - **독립적 실패 처리**: 한 API 실패 시 다른 API는 계속 진행
  - **증분 동기화**: `lastSyncedAt` 기준 변경 데이터만 업데이트
- **완료 조건 변경**:
  - 기존: 단일 API에서 100개 이상 데이터 수집
  - 변경: **2개 API 각각 50개 이상** (총 100개 이상)
- **리스크 및 완화 전략**:
  - **리스크**: API별 응답 형식 차이, 동기화 시간 증가
  - **완화**: 어댑터 패턴, `rawData` JSON 필드, 병렬 동기화
- **프로젝트 기간**: 14주 유지 (10일 유지, 기존 코드 활용으로 추가 기간 불필요)
- **향후 확장성**: 지자체 API는 v2.0에서 추가 가능 (스키마 변경 불필요)

### v1.5 (2025-11-19) - 랜딩 페이지 추가

- **핵심 변경**: 초대 기반 서비스 안내 및 사용자 유입을 위한 랜딩 페이지를 Phase 1에 추가
- **새로운 이슈**:
  - **ISSUE-01: 랜딩 페이지 구현** (새로 추가)
    - 11개 섹션 구현 (Hero, Problem, Solution, Key Features, Impact, Social Proof, Invitation Form, Success Stories, FAQ, Final CTA, Footer)
    - 초대 신청 폼 (이메일 + 회사명 + 이름)
    - Prisma Invitation 모델
    - 디자인 시스템 (Primary Blue #0052CC, Pretendard 폰트, Lucide 아이콘)
    - 5일 예상 기간, ISSUE-02 (인증)와 병렬 가능
- **이슈 번호 변경**:
  - 기존 ISSUE-01 (인증) → 새로운 ISSUE-02 (인증)
  - 기존 ISSUE-02 (고객 모델) → 새로운 ISSUE-03
  - 기존 ISSUE-03 (고객 UI) → 새로운 ISSUE-04
  - 이후 모든 이슈 번호 +1 이동 (ISSUE-24까지)
- **프로젝트 기간**: 14주 유지 (병렬 작업 가능)
- **총 이슈 수**: 24개 → **25개** (ISSUE-00 ~ ISSUE-24)
- **장점**:
  - ✅ 초대 기반 서비스 홍보 및 사용자 유입
  - ✅ 서비스 가치 명확한 전달 (11개 섹션)
  - ✅ 이메일 수집 및 초대 관리 시스템
  - ✅ 인증 시스템과 병렬 개발 가능

### v1.4 (2025-11-19) - 선택 기반 학습 기능 추가

- **핵심 변경**: 영업자가 선택한 프로그램을 기반으로 고객 선호도 자동 학습
- **새로운 기능**:
  - **선택 기반 학습**: 영업자가 고객에게 전달한 프로그램 선택 → 자동 학습
  - **선호 키워드 가중치**: 학습된 키워드는 다음 매칭 시 +50% 가중치 (10점 → 15점)
  - **UI 개선**: 매칭 결과에 체크박스 + "선택한 프로그램으로 학습" 버튼 추가
- **데이터베이스 스키마 변경**:
  - `Customer`: `preferredKeywords String[] @default([])` 추가
- **API 추가**:
  - `POST /api/matching/update-preferences` (선택된 프로그램 기반 학습)
- **프로젝트 기간**: 14주 유지 (ISSUE-09만 3일 → 4일, 병렬 가능)
- **장점**:
  - ✅ 영업자의 선택을 통한 자동 학습 (수동 입력 불필요)
  - ✅ 매칭 정확도 지속적 향상
  - ✅ 투명한 학습 과정 (선택한 프로그램이 명확히 표시됨)
  - ✅ 간단한 구현 (머신러닝 불필요)

### v1.3 (2025-11-19) - AI 제거, 업종/키워드/지역 기반 매칭으로 전환

- **핵심 변경**: AI 기능 완전 제거, 규칙 기반 매칭으로 단순화
- **제거된 기능**:
  - OpenAI API 임베딩 (ISSUE-06 전체 삭제)
  - pgvector 벡터 검색
  - LLM 기반 매칭 이유 생성
- **새로운 매칭 방식**:
  - **업종 매칭**: 고객 업종 ↔ 프로그램 대상 업종 (30점)
  - **지역 매칭**: 고객 지역 ↔ 프로그램 대상 지역 (30점)
  - **키워드 매칭**: challenges/goals ↔ 프로그램 키워드 (최대 40점)
- **데이터베이스 스키마 변경**:
  - `Program`: `targetLocation[]`, `keywords[]`, `description` 추가
  - `Program`: `embedding` 필드 제거
  - `MatchingResult`: `matchedIndustry`, `matchedLocation`, `matchedKeywords[]` 추가
- **기술 스택 변경**:
  - 제거: OpenAI API, pgvector
  - 추가: PostgreSQL Full-Text Search
- **프로젝트 기간 단축**: 17주 → **14주** (3주 단축)
  - ISSUE-06 제거: -10일
  - ISSUE-07~09 단순화: -11일
- **이슈 번호 변경**:
  - 기존 ISSUE-07 → 새로운 ISSUE-06
  - 기존 ISSUE-08 → 새로운 ISSUE-07
  - 기존 ISSUE-09 → 새로운 ISSUE-08
  - 기존 ISSUE-10 → 새로운 ISSUE-09
  - 이후 이슈 번호 모두 -1 이동
- **장점**:
  - ✅ OpenAI API 비용 제로
  - ✅ 단순성 및 투명성
  - ✅ 빠른 응답 속도
  - ✅ 개발 기간 단축
- **향후 개선 계획**:
  - v2.0에서 AI 기능 옵션으로 추가 가능

### v1.2 (2025-11-19) - 컴포넌트 모듈화 및 API 기반 개발 추가

- **개발 원칙 추가**:
  - 컴포넌트 모듈화 원칙 명시
  - API 기반 개발 원칙 명시
  - 테스트 가능한 구조 설계
- **폴더 구조 정의**:
  - `/components` 하위 구조 상세화
  - `/app/api` 엔드포인트 구조 상세화
- **개발 방식**:
  - 모든 UI를 재사용 가능한 컴포넌트로 분리
  - 모든 데이터 핸들링을 API 엔드포인트로 작성
  - Postman/Insomnia를 통한 수시 데이터 테스트

### v1.1 (2025-11-19) - 기술 스택 업데이트

- **Backend**: Next.js 15 App Router로 통합
- **Data Source**: 공공데이터포털 API로 변경 (웹 크롤링 → API 연동)
- **Infrastructure**: Supabase + Vercel로 베타 배포
- **Migration Readiness**: 추상화 계층 설계 (Prisma, NextAuth.js, Storage Interface)

### v1.0 (2025-11-18) - 초기 실행 계획

- PRD.md 기반 24개 이슈 생성
- 17주 개발 일정 수립

---

## 진행 상황 (Progress Tracking)

### Phase 1: 기본 인프라 및 인증 (Week 1-2)

#### ✅ ISSUE-00: 프로젝트 초기 설정 및 인프라 구축 (완료)

- **완료일**: 2025-11-20
- **작업 내용**:
  - ✅ Next.js 15 프로젝트 초기화 (App Router, TypeScript, Tailwind)
  - ✅ Supabase 프로젝트 생성 및 연결 (PostgreSQL 17.6)
  - ✅ Prisma ORM v6 설정 (schema.prisma, prisma.config.ts)
  - ✅ Vercel 배포 파이프라인 구성 (vercel.json)
  - ✅ 공공데이터포털 API 키 준비 (.env.local)
  - ✅ 기본 폴더 구조 생성 (app, components, lib, tests, hooks, styles, utils, types, prisma, public)
  - ✅ ESLint + Prettier + Husky + lint-staged 설정
  - ✅ Git 저장소 초기화 (https://github.com/ownerscedric-cto/ownership-ai.git)
- **생성된 파일**:
  - `src/lib/supabase.ts` - Supabase 클라이언트
  - `src/lib/prisma.ts` - Prisma 클라이언트 (singleton 패턴)
  - `prisma/schema.prisma` - 데이터베이스 스키마
  - `prisma.config.ts` - Prisma 설정
  - `vercel.json` - Vercel 배포 설정
  - `.prettierrc`, `.prettierignore` - Prettier 설정
  - `eslint.config.mjs` - ESLint 설정
  - `.lintstagedrc.json` - lint-staged 설정
  - `.husky/pre-commit` - Git pre-commit 훅
- **완료 조건 충족**:
  - ✅ Supabase 연결 성공 (PostgreSQL 17.6 확인)
  - ✅ Prisma Client 생성 완료
  - ✅ Git 저장소 설정 완료
  - ✅ 코드 품질 도구 설정 완료 (pre-commit 훅 동작)
  - ⏳ Vercel 배포 대기 (로컬 환경 완료)
  - ⏳ 공공데이터포털 API 키 발급 대기

#### 🔄 ISSUE-01: 랜딩 페이지 구현 (준비 완료)

- **상태**: 시작 대기 중
- **의존성**: ISSUE-00 ✅ 완료
- **예상 기간**: 5일

#### ⏸️ ISSUE-02: 인증 시스템 구현 (대기)

- **상태**: 대기
- **병렬 가능**: ISSUE-01과 동시 진행 가능

---

## 타임라인

**전체 기간**: 14주 (약 3.5개월)

```
Week 1-2:   ISSUE-00, ISSUE-01, ISSUE-02 (인프라 + 랜딩 페이지 + 인증)
Week 3-4:   ISSUE-03, ISSUE-04, ISSUE-05 (고객 관리)
Week 5-6:   ISSUE-06, ISSUE-07 (정부지원사업 데이터 + UI)
Week 7-8:   ISSUE-08, ISSUE-09, ISSUE-10 (업종/키워드/지역 매칭)
Week 9-10:  ISSUE-11, ISSUE-12, ISSUE-13 (커뮤니케이션)
Week 11-12: ISSUE-14, ISSUE-15, ISSUE-16 (대시보드)
Week 13:    ISSUE-17, ISSUE-18 (관리자 기능)
Week 14:    ISSUE-19, ISSUE-20, ISSUE-21, ISSUE-22, ISSUE-23, ISSUE-24 (최적화 + 테스트 + 배포)
```

**변경 사항**:

- **3주 단축**: AI 관련 이슈 제거 및 단순화
- **ISSUE-06 제거**: AI 임베딩 관련 작업 삭제
- **Phase 4 단축**: Week 7-9 → Week 7-8 (2주)
- **Phase 9 통합**: Week 15-17 → Week 14 (1주, 병렬 작업)

---

## 고위험 이슈 (⚠️)

1. **ISSUE-06** (공공데이터포털 API 연동): 외부 API 의존성, Rate Limit 리스크

**완화 전략**:

- Redis 캐싱 (24시간)
- Exponential Backoff Retry
- 점진적 동기화 (페이지 단위)
- Rate Limiting 구현 (Upstash Redis)

---

## 성공 지표

- ✅ **기능 완성도**: 모든 25개 이슈 완료
- ✅ **성능**: Lighthouse Performance 90+
- ✅ **테스트**: API 커버리지 80%+, E2E 주요 흐름 100%
- ✅ **보안**: OWASP Top 10 점검 통과
- ✅ **사용성**: 베타 테스터 만족도 80%+
- ✅ **마이그레이션 준비**: 완전한 추상화 계층 구축

---

**문서 끝**
