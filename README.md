# 컨설턴트 관리 플랫폼 (Ownership AI)

1인 컨설턴트를 위한 고객 정보 관리 및 정부지원사업 매칭 SaaS 플랫폼

## 프로젝트 개요

**목표**: 1인 컨설턴트가 고객 정보를 효율적으로 관리하고, 업종/키워드/지역 기반으로 정부지원사업을 매칭하여 고객에게 추천하는 플랫폼

**핵심 기능**:

1. 고객 정보 관리 (CRM)
2. 정부지원사업 데이터 수집 및 관리
3. 업종/키워드/지역 기반 매칭 시스템
4. 자동화된 고객 커뮤니케이션
5. 대시보드 및 분석 기능
6. 관리자 기능

## 기술 스택

| 카테고리             | 기술                                          |
| -------------------- | --------------------------------------------- |
| **Frontend**         | React 18 + TypeScript + Next.js 15 App Router |
| **Backend**          | Next.js 15 API Routes + Server Actions        |
| **Database**         | Supabase PostgreSQL + Prisma ORM v6           |
| **Authentication**   | Supabase Auth + NextAuth.js                   |
| **Storage**          | Supabase Storage                              |
| **Hosting**          | Vercel (Serverless Functions)                 |
| **외부 API**         | 공공데이터포털 (중기부, K-startup)            |
| **State Management** | Zustand (클라이언트), React Query (서버)      |
| **UI Framework**     | TailwindCSS v4 + shadcn/ui                    |

## 프로젝트 구조

```
ownership-ai/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   ├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── lib/             # 유틸리티 및 설정
│   │   ├── supabase.ts  # Supabase 클라이언트
│   │   └── prisma.ts    # Prisma 클라이언트
│   ├── hooks/           # 커스텀 React Hooks
│   ├── styles/          # 전역 스타일
│   ├── types/           # TypeScript 타입 정의
│   └── utils/           # 헬퍼 함수
├── prisma/
│   ├── schema.prisma    # 데이터베이스 스키마
│   └── migrations/      # 데이터베이스 마이그레이션
├── public/              # 정적 파일
└── tests/               # 테스트 파일
```

## 시작하기

### 필수 요구사항

- Node.js v20.12.2 이상
- npm 또는 yarn
- Supabase 계정
- Vercel 계정 (배포용)

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Database URL (Connection Pooler)
DATABASE_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Public Data Portal API Key
PUBLIC_DATA_API_KEY=your-api-key
```

### 설치 및 실행

1. 의존성 설치:

```bash
npm install
```

2. Prisma 클라이언트 생성:

```bash
npx prisma generate
```

3. 개발 서버 실행:

```bash
npm run dev
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 자동 수정
- `npm run format` - Prettier 포맷팅
- `npm run format:check` - Prettier 검사
- `npm run typecheck` - TypeScript 타입 체크

## 데이터베이스 관리

### Prisma 마이그레이션

```bash
# 마이그레이션 생성
npx prisma migrate dev --name migration_name

# 마이그레이션 적용
npx prisma migrate deploy

# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio
```

## 배포

Vercel에 자동 배포되도록 설정되어 있습니다:

1. GitHub 저장소와 연결
2. 환경 변수 설정
3. 자동 배포 완료

## 문서

- [실행 계획 (EXECUTION.md)](./EXECUTION.md) - 상세 개발 계획 및 이슈 목록
- [PRD (PRD.md)](./PRD.md) - 제품 요구사항 문서
- [Supabase 문서](https://supabase.com/docs)
- [Next.js 문서](https://nextjs.org/docs)
- [Prisma 문서](https://www.prisma.io/docs)

## 진행 상황

- ✅ **ISSUE-00**: 프로젝트 초기 설정 및 인프라 구축 (완료)
- 🔄 **ISSUE-01**: 랜딩 페이지 구현 (준비 완료)
- ⏸️ **ISSUE-02**: 인증 시스템 구현 (대기)

## 라이선스

Proprietary - 모든 권리 보유

## 연락처

프로젝트 관련 문의: [GitHub Issues](https://github.com/ownerscedric-cto/ownership-ai/issues)
