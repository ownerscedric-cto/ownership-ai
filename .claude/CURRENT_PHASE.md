# Current Phase: Phase 3 - 정부지원사업 데이터 수집 (Week 5-6) 🚀

**목표**: 다중 공공데이터 API 통합 및 프로그램 데이터 자동 수집 시스템 구축

**전체 진행 상황**: Phase 3 / 9 Phases 🔄 **Phase 3 시작!**

**이전 Phase**: ✅ Phase 2 완료 (고객 관리 CRUD, UI, 엑셀 업로드)

**Phase 3 진행 현황**: 🔄 **ISSUE-07 완료!**

- ⏳ ISSUE-06: 다중 공공데이터 API 통합 연동 (기업마당 + K-Startup + KOCCA) ⚠️ 고위험 (진행 대기)
- ✅ ISSUE-07: 정부지원사업 UI 컴포넌트 개발 (완료)

---

## ✅ Phase 3 API 구성 현황

### **3개 API 키 준비 완료!** 🎉

모든 공공데이터 API 키가 `.env.local`에 설정되어 있습니다:

#### 1️⃣ **기업마당 API** (중소벤처기업부)

```bash
BIZINFO_API_KEY=f0K6CT
BIZINFO_API_BASE_URL=https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do

# 사용 예시
# https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey={BIZINFO_API_KEY}&dataType=json&searchCnt=10&pageIndex=1&pageUnit=10&searchLclasId=01
```

**주요 파라미터**:

- `crtfcKey`: API 키 (필수)
- `dataType`: `json` (JSON 응답)
- `searchCnt`: 조회 건수 (기본 10)
- `pageIndex`: 페이지 번호 (1부터 시작)
- `pageUnit`: 페이지당 건수
- `searchLclasId`: 카테고리 코드 (01: 창업, 02: 경영, 03: 금융 등)

---

#### 2️⃣ **K-Startup API** (한국벤처창업진흥원)

```bash
PUBLIC_DATA_API_KEY=e224416b40e2d82716c0b11880f8a396c50a48b0f6b19f7a9f90a0180d141b06
KSTARTUP_API_BASE_URL=https://apis.data.go.kr/B552735

# 사용 예시
# https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey={PUBLIC_DATA_API_KEY}&page=1&perPage=10
```

**주요 파라미터**:

- `serviceKey`: API 키 (필수)
- `page`: 페이지 번호 (1부터 시작)
- `perPage`: 페이지당 건수 (기본 10, 최대 100)

**API 엔드포인트**:

- `getAnnouncementInformation01`: 공고정보 조회

---

#### 3️⃣ **한국콘텐츠진흥원 API** (KOCCA)

```bash
KOCCA_API_KEY=AUIo9CWNHyaddihzmtadduMXNEdxH4NAszFQULd5SDIDrOo=

# PIMS (지원사업)
KOCCA_PIMS_API_BASE_URL=https://kocca.kr/api/pims/List.do
# https://kocca.kr/api/pims/List.do?serviceKey={KOCCA_API_KEY}&pageNo=1&numOfRows=1&viewStartDt=20220419

# Finance (금융지원)
KOCCA_FINANCE_API_BASE_URL=https://kocca.kr/api/finance/List.do
# https://kocca.kr/api/finance/List.do?serviceKey={KOCCA_API_KEY}&pageNo=1&numOfRows=10
```

**주요 파라미터**:

- `serviceKey`: API 키 (필수)
- `pageNo`: 페이지 번호 (1부터 시작)
- `numOfRows`: 페이지당 건수
- `viewStartDt`: 조회 시작일 (YYYYMMDD) - PIMS만 해당

**2개 엔드포인트**:

- PIMS: 지원사업 공고
- Finance: 금융지원 정보

---

## 🚨 Phase 3 시작 전 필수 준비사항

### 1️⃣ **데이터베이스 준비** ⚠️ **필수 - 유일하게 남은 준비사항**

- [ ] **Program Prisma 모델 작성** (현재 schema.prisma에 없음)
  - `dataSource`, `sourceApiId`, `rawData` 등 필드 추가
  - `@@unique([dataSource, sourceApiId])` 중복 방지 인덱스
  - 검색 최적화 인덱스 (`category`, `targetAudience`, `targetLocation`, `deadline`)

**Program 모델 스키마 (3개 API 대응)**:

```prisma
model Program {
  id              String   @id @default(uuid())

  // 다중 API 대응 필드
  dataSource      String   // "기업마당", "K-Startup", "KOCCA-PIMS", "KOCCA-Finance"
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

  // 날짜 정보 (교차 정렬용)
  registeredAt    DateTime // 등록일 (교차 정렬의 핵심 필드) ⭐
  startDate       DateTime?
  endDate         DateTime?

  // 동기화 메타데이터
  lastSyncedAt    DateTime @default(now()) @updatedAt
  syncStatus      String   @default("active") // "active", "outdated", "deleted"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  matchingResults MatchingResult[]

  // 복합 인덱스 (검색 성능 향상)
  @@unique([dataSource, sourceApiId]) // 중복 방지
  @@index([registeredAt(sort: Desc)]) // 등록일 내림차순 정렬 (교차 노출용) ⭐
  @@index([dataSource, registeredAt(sort: Desc)]) // 출처별 정렬
  @@index([category])
  @@index([targetAudience])
  @@index([targetLocation])
  @@index([deadline])
  @@index([dataSource]) // API별 필터링
  @@index([lastSyncedAt]) // 동기화 추적
}
```

### 2️⃣ **공공데이터 API 키 발급** ✅ **완료!**

- ✅ **기업마당 API 키** (`BIZINFO_API_KEY`) - 완료
- ✅ **K-Startup API 키** (`PUBLIC_DATA_API_KEY`) - 완료 (공공데이터포털 키 재사용)
- ✅ **한국콘텐츠진흥원 API 키** (`KOCCA_API_KEY`) - 완료

**현재 상태**: ✅ **3개 API 키 모두 준비 완료!** (.env.local 설정 완료)

### 3️⃣ **API 문서 조사** ✅ **완료!**

각 API의 스펙이 `.env.local`에 주석으로 문서화되어 있습니다:

- ✅ Base URL, 엔드포인트
- ✅ Request 형식 (GET, Query Parameters)
- ✅ 필수 파라미터 (API 키, 페이지네이션)
- ⏳ Response 형식 (실제 호출하며 확인 필요)
- ⏳ Rate Limiting (실제 호출하며 확인 필요)
- ⏳ 에러 코드 및 응답 형식 (실제 호출하며 확인 필요)

---

## 📋 Phase 3 ISSUE 목록

### 📋 ISSUE-06: 다중 공공데이터 API 통합 연동 (기업마당 + K-Startup + KOCCA) ⚠️ 고위험

**상태**: ⏳ 대기 → 🚀 **시작 준비 완료!**
**목표**: 3개 API 통합 수집 및 저장 자동화 (기업마당, K-Startup, KOCCA)
**의존성**: ✅ Phase 2 완료, ✅ API 키 준비 완료

**핵심 기술**:

- **Adapter Pattern** (`IProgramAPIClient`) - API별 차이 흡수
- **Promise.allSettled** - 병렬 API 호출, 부분 실패 허용
- **Exponential Backoff** - Rate Limiting 대응
- **Vercel Cron Job** - 매일 자동 동기화
- **rawData JSON 필드** - 원본 데이터 보존

**작업 내용**:

1. **Program Prisma 모델 작성 및 마이그레이션**
   - 위 스키마 참조
   - `dataSource` 값: "기업마당", "K-Startup", "KOCCA-PIMS", "KOCCA-Finance"

2. **API 클라이언트 작성 (어댑터 패턴)**:

   ```typescript
   // /lib/apis/base-api-client.ts
   export interface IProgramAPIClient {
     fetchPrograms(params: SyncParams): Promise<RawProgramData[]>;
     extractKeywords(raw: any): string[];
     parseLocation(raw: any): string[];
     getDataSource(): string; // "기업마당", "K-Startup", "KOCCA-PIMS", "KOCCA-Finance"
   }

   // /lib/apis/bizinfo-api-client.ts (기업마당)
   export class BizinfoAPIClient implements IProgramAPIClient {
     private apiKey = process.env.BIZINFO_API_KEY!;
     private baseUrl = process.env.BIZINFO_API_BASE_URL!;

     getDataSource() {
       return '기업마당';
     }

     async fetchPrograms(params: { page: number; pageSize: number }) {
       const url = `${this.baseUrl}?crtfcKey=${this.apiKey}&dataType=json&searchCnt=${params.pageSize}&pageIndex=${params.page}&pageUnit=${params.pageSize}&searchLclasId=01`;
       const response = await fetch(url);
       const data = await response.json();
       return data.result || [];
     }

     extractKeywords(program: any): string[] {
       // 기업마당 API 응답에서 키워드 추출 (실제 응답 구조 확인 후 구현)
       return [];
     }

     parseLocation(program: any): string[] {
       // 기업마당 API 응답에서 지역 정보 추출
       return [];
     }
   }

   // /lib/apis/kstartup-api-client.ts (K-Startup)
   export class KStartupAPIClient implements IProgramAPIClient {
     private apiKey = process.env.PUBLIC_DATA_API_KEY!;
     private baseUrl = process.env.KSTARTUP_API_BASE_URL!;

     getDataSource() {
       return 'K-Startup';
     }

     async fetchPrograms(params: { page: number; perPage: number }) {
       const url = `${this.baseUrl}/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${this.apiKey}&page=${params.page}&perPage=${params.perPage}`;
       const response = await fetch(url);
       const data = await response.json();
       return data.data || [];
     }

     extractKeywords(program: any): string[] {
       // K-Startup API 응답에서 키워드 추출
       return [];
     }

     parseLocation(program: any): string[] {
       // K-Startup API 응답에서 지역 정보 추출
       return [];
     }
   }

   // /lib/apis/kocca-api-client.ts (한국콘텐츠진흥원)
   export class KoccaPIMSAPIClient implements IProgramAPIClient {
     private apiKey = process.env.KOCCA_API_KEY!;
     private baseUrl = process.env.KOCCA_PIMS_API_BASE_URL!;

     getDataSource() {
       return 'KOCCA-PIMS';
     }

     async fetchPrograms(params: { pageNo: number; numOfRows: number }) {
       const viewStartDt = '20220101'; // 조회 시작일 (조정 가능)
       const url = `${this.baseUrl}?serviceKey=${this.apiKey}&pageNo=${params.pageNo}&numOfRows=${params.numOfRows}&viewStartDt=${viewStartDt}`;
       const response = await fetch(url);
       const data = await response.json();
       return data.items || [];
     }

     extractKeywords(program: any): string[] {
       return [];
     }

     parseLocation(program: any): string[] {
       return [];
     }
   }

   export class KoccaFinanceAPIClient implements IProgramAPIClient {
     private apiKey = process.env.KOCCA_API_KEY!;
     private baseUrl = process.env.KOCCA_FINANCE_API_BASE_URL!;

     getDataSource() {
       return 'KOCCA-Finance';
     }

     async fetchPrograms(params: { pageNo: number; numOfRows: number }) {
       const url = `${this.baseUrl}?serviceKey=${this.apiKey}&pageNo=${params.pageNo}&numOfRows=${params.numOfRows}`;
       const response = await fetch(url);
       const data = await response.json();
       return data.items || [];
     }

     extractKeywords(program: any): string[] {
       return [];
     }

     parseLocation(program: any): string[] {
       return [];
     }
   }
   ```

3. **통합 동기화 오케스트레이터 작성**:

   ```typescript
   // /lib/sync/program-sync-orchestrator.ts
   export class ProgramSyncOrchestrator {
     private clients: IProgramAPIClient[] = [
       new BizinfoAPIClient(),
       new KStartupAPIClient(),
       new KoccaPIMSAPIClient(),
       new KoccaFinanceAPIClient(),
     ];

     async syncAll() {
       // Promise.allSettled로 병렬 동기화 (부분 실패 허용)
       const results = await Promise.allSettled(
         this.clients.map(client => this.syncFromClient(client))
       );

       const succeeded = results.filter(r => r.status === 'fulfilled').length;
       const failed = results.filter(r => r.status === 'rejected').length;
       const total = results.length;

       return { total, succeeded, failed };
     }

     private async syncFromClient(client: IProgramAPIClient) {
       const rawData = await client.fetchPrograms({ page: 1, pageSize: 50 });

       for (const raw of rawData) {
         await prisma.program.upsert({
           where: {
             dataSource_sourceApiId: {
               dataSource: client.getDataSource(),
               sourceApiId: raw.id || raw.announcementId || raw.bizId,
             },
           },
           update: {
             title: raw.title,
             description: raw.description,
             keywords: client.extractKeywords(raw),
             targetLocation: client.parseLocation(raw),
             rawData: raw,
             lastSyncedAt: new Date(),
           },
           create: {
             dataSource: client.getDataSource(),
             sourceApiId: raw.id || raw.announcementId || raw.bizId,
             title: raw.title,
             description: raw.description,
             keywords: client.extractKeywords(raw),
             targetLocation: client.parseLocation(raw),
             rawData: raw,
           },
         });
       }
     }
   }
   ```

4. **API 엔드포인트 작성**:
   - `POST /api/programs/sync` (수동 동기화 트리거)
   - `GET /api/programs` (목록 조회, 필터링/정렬/페이지네이션)
     - **⭐ 교차 정렬 구현**: `orderBy: { registeredAt: 'desc' }` (등록일 기준 최신순)
     - 출처별 분포 통계 포함 (현재 페이지의 API별 개수)
     - 자세한 구현: PUBLIC_API_GUIDES.md > 다중 API 데이터 교차 노출 전략 참조
   - `GET /api/programs/[id]` (상세 조회)

5. **Vercel Cron Job 설정**:

   ```typescript
   // /app/api/cron/sync-programs/route.ts
   export async function GET(request: Request) {
     // Vercel Cron Secret 검증
     const authHeader = request.headers.get('authorization');
     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return new Response('Unauthorized', { status: 401 });
     }

     const orchestrator = new ProgramSyncOrchestrator();
     const result = await orchestrator.syncAll();
     return Response.json({ success: true, ...result });
   }
   ```

   **vercel.json**:

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

6. **에러 처리 및 로깅**:
   - API 호출 실패 시 재시도 (Exponential Backoff)
   - **API별 독립 실행** (하나 실패해도 나머지 계속)
   - 상세 로그 출력 (어떤 API에서 몇 개 수집했는지)

7. **Rate Limiting 구현** (Upstash Redis 활용 - 선택)

8. **Redis 캐싱 전략** (선택):
   - 프로그램 목록 캐싱 (1시간)
   - 증분 동기화 (`lastSyncedAt` 기준)

**완료 조건**:

- [ ] Program Prisma 모델 작성 및 마이그레이션 완료
  - [ ] `registeredAt` 필드 포함 (교차 정렬용)
  - [ ] `registeredAt` 인덱스 생성 (내림차순)
- [ ] 4개 API 클라이언트 작성 완료 (Bizinfo, KStartup, KOCCA-PIMS, KOCCA-Finance)
  - [ ] 각 API의 등록일 필드를 `registeredAt`으로 매핑
- [ ] 각 API별 최소 20개 이상 데이터 수집 (총 80개 이상 목표)
- [ ] 모든 프로그램에 업종, 지역, 키워드 정보 포함
- [ ] `POST /api/programs/sync` 구현 (수동 동기화)
- [ ] `GET /api/programs` 구현 (목록 조회, 필터링)
  - [ ] **교차 정렬 구현**: `orderBy: { registeredAt: 'desc' }` 적용
  - [ ] 출처별 분포 통계 포함
- [ ] `GET /api/programs/[id]` 구현 (상세 조회)
- [ ] Vercel Cron Job 설정 (매일 새벽 2시 자동 동기화)
- [ ] Rate Limit 에러 처리 (Exponential Backoff)
- [ ] 병렬 동기화 동작 확인 (Promise.allSettled)

**예상 기간**: 10일
**난이도**: 고 ⚠️

**리스크**:

- 각 API 응답 속도 느림 가능성
- API별 응답 형식 차이 (실제 호출 후 확인 필요)
- Rate Limit 초과 가능성
- 동기화 시간 증가 (4개 API 처리)

**완화 전략**:

- Redis 캐싱 (1시간) - 선택
- Exponential Backoff Retry
- 병렬 동기화 (Promise.allSettled)
- 어댑터 패턴 (API별 차이 흡수)
- rawData JSON 필드 (원본 데이터 보관)
- 증분 동기화 (lastSyncedAt 기준)

---

### 📋 ISSUE-07: 정부지원사업 UI 컴포넌트 개발

**상태**: ✅ 완료
**목표**: 프로그램 목록, 상세, 검색 UI 구현
**의존성**: ✅ ISSUE-06 완료 후 시작 가능

**작업 내용**:

1. **shadcn/ui 추가 컴포넌트 설치** (필요 시):

   ```bash
   npx shadcn@latest add badge separator skeleton pagination
   ```

2. **프로그램 관련 컴포넌트 작성**:
   - `/components/programs/ProgramList.tsx` (목록 + 페이지네이션)
     - shadcn/ui Card 사용
     - React Query `usePrograms` hook
     - 로딩 상태 (Skeleton UI)
   - `/components/programs/ProgramCard.tsx` (카드 형태)
     - 프로그램 제목, 설명, 마감일, 데이터소스 표시
     - Badge로 데이터소스 표시 (기업마당, K-Startup, KOCCA)
     - 모바일 최적화 뷰
   - `/components/programs/ProgramDetail.tsx` (상세 정보)
     - 프로그램 전체 정보 표시
     - rawData JSON 뷰어 (개발자용)
     - 매칭 결과 프리뷰 (Phase 4 이후)
   - `/components/programs/ProgramFilters.tsx` (필터 UI)
     - 업종, 지역, 마감일 필터
     - 데이터소스 필터 (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)
   - `/components/programs/ProgramSearch.tsx` (키워드 검색)
     - 실시간 검색 (debounce 300ms)

3. **React Query 설정**:

   ```typescript
   // /lib/hooks/usePrograms.ts
   export const usePrograms = (filters: ProgramFilters) => {
     return useQuery({
       queryKey: ['programs', filters],
       queryFn: () => fetchPrograms(filters),
       staleTime: 5 * 60 * 1000, // 5분 캐싱
     });
   };

   export const useProgram = (id: string) => {
     return useQuery({
       queryKey: ['program', id],
       queryFn: () => fetchProgram(id),
       enabled: !!id,
     });
   };
   ```

4. **페이지 작성**:
   - `/app/programs/page.tsx` (목록)
     - ProgramList + ProgramFilters + ProgramSearch
     - 페이지네이션
   - `/app/programs/[id]/page.tsx` (상세)
     - ProgramDetail
     - 매칭 결과 섹션 (Phase 4 이후)

5. **Loading/Error 상태 처리**:
   - React Query `isLoading`, `isError`, `error` 상태 활용
   - Skeleton UI (로딩)
   - Error Boundary (에러)

6. **디자인 시스템 적용** (PRINCIPLES.md 준수):
   - Primary Blue (#0052CC) - CTA 버튼
   - Lucide React 아이콘 사용
   - TailwindCSS 유틸리티 클래스
   - 모바일 반응형 (sm, md, lg breakpoints)

**완료 조건**:

- [x] shadcn/ui 추가 컴포넌트 설치 완료 (pagination, tabs)
- [x] ProgramList 컴포넌트 (목록 + 페이지네이션)
- [x] ProgramCard 컴포넌트 (카드 형태, Badge로 dataSource 표시)
- [x] ProgramDetail 컴포넌트 (상세 정보)
- [x] ProgramFilters 컴포넌트 (업종/지역/마감일/데이터소스 필터)
- [x] ProgramSearch 컴포넌트 (키워드 검색 - ProgramFilters에 통합)
- [x] React Query 설정 (`usePrograms`, `useProgram` hook)
- [x] `/app/programs/page.tsx` (목록 페이지)
- [x] `/app/programs/[id]/page.tsx` (상세 페이지)
- [x] Loading/Error 상태 처리
- [x] 모바일 반응형 확인 (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

**예상 기간**: 6일
**난이도**: 중
**기술 스택**: React Query, shadcn/ui, TailwindCSS
**실제 소요 기간**: 1일
**완료일**: 2025-01-21

---

## 🎯 Phase 3 시작 가이드

### ✅ 준비사항 체크리스트

**필수 준비 항목**:

1. [ ] **Program Prisma 모델 작성** (schema.prisma) - **유일하게 남은 준비사항**
2. ✅ **공공데이터 API 키 확인** (.env.local에 3개 API 모두 설정 완료)
3. ✅ **API 문서 조사** (Base URL, 파라미터 모두 .env.local에 문서화)
4. ✅ **환경변수 설정** (.env.local에 API 키 모두 추가됨)

**선택적 준비 항목**:

1. [ ] Redis 캐싱 전략 검토
2. [ ] Sentry 에러 추적 설정

---

### 🚀 Phase 3 시작 명령어

**준비 완료! 바로 시작 가능**:

1. **"ISSUE-06 시작해줘"** - Program Prisma 모델 작성부터 시작
2. **"Program 모델만 먼저 만들자"** - 스키마 작성 + 마이그레이션만
3. **"기업마당 API부터 테스트해보자"** - 단일 API 먼저 테스트

**Phase 변경**:

1. **"Phase 2로 돌아가줘"** - Phase 2 재확인
2. **"Phase 4 보여줘"** - Phase 4 미리보기

---

## 📊 Phase 3 예상 완료 시점

**총 예상 기간**: 16일 (Week 5-6)

- ISSUE-06: 10일
- ISSUE-07: 6일

**성공 기준**:

- ✅ 4개 API 통합 연동 완료 (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)
- ✅ 각 API별 최소 20개 이상 데이터 수집 (총 80개 이상 목표)
- ✅ 프로그램 목록/상세 조회 API 완성
- ✅ 프로그램 목록/상세 UI 완성
- ✅ Vercel Cron Job 자동 동기화 완성
- ✅ Rate Limiting 및 에러 처리 완성

---

## 📚 참고 문서

- **EXECUTION.md**: 전체 프로젝트 로드맵 (Phase 1 ~ 9)
- **PUBLIC_API_GUIDES.md**: ⭐ **3개 API 상세 가이드 (필독!)**
  - 기업마당 API: TypeScript 타입, 클라이언트 구현, React Query Hook, 동기화 전략
  - K-Startup API: 4개 엔드포인트, 페이지네이션, 에러 처리, Cron Job 설정
  - 한국콘텐츠진흥원 API: PIMS/Finance 엔드포인트, 카테고리별 조회
  - 다중 API 통합 전략 (Promise.allSettled)
  - **⭐ 다중 API 데이터 교차 노출 전략**: 등록일 기준 교차 정렬, 인덱스 설계, 캐싱, 성능 최적화 (필수!)
- **PRINCIPLES.md**: 개발 원칙 및 디자인 시스템
- **RULES.md**: 프레임워크 규칙
- **.env.local**: ✅ **3개 API 키 모두 설정 완료!**
  - 기업마당 API (BIZINFO_API_KEY)
  - K-Startup API (PUBLIC_DATA_API_KEY)
  - 한국콘텐츠진흥원 API (KOCCA_API_KEY)
