# Current Phase: Phase 2 - 고객 관리 기능 (Week 3-4)

**목표**: 고객(Customer) 데이터 관리 시스템 구축 - CRUD API 및 UI 컴포넌트 개발

**전체 진행 상황**: Phase 2 / 9 Phases

**이전 Phase**: ✅ Phase 1 완료 (프로젝트 인프라, 랜딩 페이지, 인증 시스템)

**Phase 2 진행 현황**:

- ✅ ISSUE-03: 고객 데이터 모델 및 API 구현 (완료)
- ⏳ ISSUE-04: 고객 관리 UI 컴포넌트 개발 (대기)
- ⏳ ISSUE-05: 엑셀 파일 업로드 기능 (대기)

---

## 📋 Phase 2 ISSUE 목록

### 📋 ISSUE-03: 고객 데이터 모델 및 API 구현

**상태**: ✅ 완료
**목표**: 고객(Customer) 데이터 CRUD API 완성
**의존성**: ✅ ISSUE-02 (인증 시스템) 완료

**작업 내용**:

1. **Prisma 스키마 작성** (`Customer` 모델)

   ```prisma
   model Customer {
     id                    String   @id @default(uuid())
     userId                String   // 컨설턴트 ID (Supabase Auth UID)

     // 사업자 정보
     businessNumber        String   @unique  // 사업자등록번호 (10자리, 필수)
     businessType          String   // 'INDIVIDUAL' | 'CORPORATE' (개인사업자 | 법인사업자)
     corporateNumber       String?  // 법인등록번호 (13자리, 법인사업자만 해당)
     name                  String   // 사업자명/상호

     // 기업 정보
     industry              String?
     companySize           String?
     location              String?
     budget                Int?

     // 니즈 정보
     challenges            String[]
     goals                 String[]
     preferredKeywords     String[] @default([])  // 영업자가 선택한 프로그램 기반 학습된 키워드

     // 연락처 정보
     contactEmail          String?
     contactPhone          String?

     // 기타
     notes                 String?
     createdAt             DateTime @default(now())
     updatedAt             DateTime @updatedAt

     matchingResults MatchingResult[]

     @@index([userId])
     @@index([businessNumber])
     @@index([businessType])
     @@index([industry])
     @@index([location])
     @@index([createdAt])
   }
   ```

2. **API 엔드포인트 작성**:
   - ✅ **표준 응답 형식 사용** (PRINCIPLES.md 준수)
     ```typescript
     // Success: { success: true, data: {...}, metadata?: { total, page, limit } }
     // Error: { success: false, error: { code, message, details? } }
     ```
   - `POST /api/customers` (고객 생성)
   - `GET /api/customers` (고객 목록 조회, 필터링/정렬/페이지네이션)
   - `GET /api/customers/[id]` (고객 상세 조회)
   - `PUT /api/customers/[id]` (고객 정보 수정)
   - `DELETE /api/customers/[id]` (고객 삭제)

3. **Request Validation** (Zod 스키마 - MANDATORY)

   ```typescript
   // /lib/validations/customer.ts
   import { z } from 'zod';

   // 사업자등록번호 검증 (10자리 숫자)
   const businessNumberRegex = /^\d{10}$/;
   // 법인등록번호 검증 (13자리 숫자)
   const corporateNumberRegex = /^\d{13}$/;

   export const createCustomerSchema = z
     .object({
       // 사업자 정보 (필수)
       businessNumber: z
         .string()
         .regex(businessNumberRegex, '사업자등록번호는 10자리 숫자여야 합니다'),
       businessType: z.enum(['INDIVIDUAL', 'CORPORATE'], {
         errorMap: () => ({ message: '개인사업자 또는 법인사업자를 선택해주세요' }),
       }),
       corporateNumber: z
         .string()
         .regex(corporateNumberRegex, '법인등록번호는 13자리 숫자여야 합니다')
         .optional()
         .nullable(),
       name: z.string().min(1, '사업자명/상호는 필수입니다'),

       // 기업 정보 (선택)
       industry: z.string().optional(),
       companySize: z.string().optional(),
       location: z.string().optional(),
       budget: z.number().int().positive().optional(),

       // 니즈 정보 (선택)
       challenges: z.array(z.string()).default([]),
       goals: z.array(z.string()).default([]),
       preferredKeywords: z.array(z.string()).default([]),

       // 연락처 정보 (선택)
       contactEmail: z.string().email('올바른 이메일 형식이 아닙니다').optional(),
       contactPhone: z.string().optional(),

       // 기타 (선택)
       notes: z.string().optional(),
     })
     .refine(
       data => {
         // 법인사업자인 경우 법인등록번호 필수 검증
         if (data.businessType === 'CORPORATE' && !data.corporateNumber) {
           return false;
         }
         return true;
       },
       {
         message: '법인사업자는 법인등록번호가 필수입니다',
         path: ['corporateNumber'],
       }
     );

   export const updateCustomerSchema = createCustomerSchema.partial();
   ```

4. **국세청 사업자등록정보 진위확인 API 통합** (공공데이터포털)
   - **개발 접근 방식**: 별도 테스트 페이지 → 모듈화 → 메인 페이지 적용

   **Step 1: API 모듈 개발 및 테스트 페이지 구현**
   - `/lib/services/nts-business-verification.ts` (API 서비스 모듈)

     ```typescript
     // 국세청 사업자등록정보 진위확인 서비스
     // API 문서: https://infuser.odcloud.kr/api/stages/28493/api-docs

     // 진위확인 API 요청 인터페이스 (공공데이터포털 스펙)
     export interface ValidationApiRequest {
       b_no: string[]; // 사업자등록번호 배열 (10자리, 숫자만)
     }

     // 상태조회 API 요청 인터페이스
     export interface StatusApiRequest {
       b_no: string[]; // 사업자등록번호 배열 (10자리, 숫자만)
     }

     // 진위확인 API 응답 (실제 공공데이터포털 응답 구조)
     export interface ValidationApiResponse {
       status_code: string; // 응답 상태 코드
       match_cnt: number; // 일치 개수
       request_cnt: number; // 요청 개수
       data: Array<{
         b_no: string; // 사업자등록번호
         valid: string; // "01": 진위확인 성공, "02": 실패
         valid_msg: string; // 검증 결과 메시지
         request_param: {
           b_no: string;
           start_dt: string;
           p_nm: string;
           p_nm2?: string;
           b_nm?: string;
           corp_no?: string;
           b_sector?: string;
           b_type?: string;
           b_adr?: string;
         };
         status?: {
           b_no: string;
           b_stt: string; // 납세자상태 (계속사업자, 휴업자, 폐업자)
           b_stt_cd: string; // 납세자상태코드
           tax_type: string; // 과세유형
           tax_type_cd: string; // 과세유형코드
           end_dt: string; // 폐업일
           utcc_yn: string; // 단위과세전환폐업여부
           tax_type_change_dt: string; // 최근과세유형전환일자
           invoice_apply_dt: string; // 세금계산서적용일자
         };
       }>;
     }

     // 클라이언트 사용 인터페이스 (간소화)
     export interface BusinessVerificationRequest {
       businessNumber: string; // 사업자등록번호 (하이픈 포함 가능, 자동 제거됨)
       ownerName: string; // 대표자명
       openDate: string; // 개업일자 (YYYYMMDD 또는 YYYY-MM-DD, 자동 변환)
       foreignOwnerKoreanName?: string; // 외국인 사업자 한글명
       businessName?: string; // 상호명
       corporateNumber?: string; // 법인등록번호 (13자리, 선택)
       businessSector?: string; // 주업태명
       businessType?: string; // 주종목명
       businessAddress?: string; // 사업장주소
     }

     export interface BusinessVerificationResponse {
       valid: boolean; // 진위확인 결과
       validCode: string; // "01": 성공, "02": 실패
       validMessage: string; // 검증 결과 메시지
       businessNumber: string; // 사업자등록번호
       status?: {
         statusName: string; // 사업자 상태 (계속사업자, 휴업자, 폐업자)
         statusCode: string; // 사업자 상태 코드
         taxType: string; // 과세유형
         closedDate?: string; // 폐업일 (있는 경우)
       };
       verifiedAt: string; // 확인 일시
       error?: string; // 에러 메시지
     }

     // 유틸리티 함수
     export function formatBusinessNumber(num: string): string {
       // 하이픈 제거, 숫자만 추출
       return num.replace(/[^0-9]/g, '');
     }

     export function formatOpenDate(date: string): string {
       // YYYY-MM-DD → YYYYMMDD 변환
       return date.replace(/[^0-9]/g, '');
     }

     export async function verifyBusinessNumber(
       data: BusinessVerificationRequest
     ): Promise<BusinessVerificationResponse> {
       // 공공데이터포털 진위확인 API 호출 로직
       // POST 방식, JSON.stringify 필요
     }

     export async function checkBusinessStatus(
       businessNumber: string
     ): Promise<BusinessVerificationResponse> {
       // 상태조회 API 호출 (진위확인보다 간단)
     }
     ```

   - `/app/test/business-verification/page.tsx` (독립 테스트 페이지)
     - **진위확인 테스트 섹션**:
       - 사업자등록번호 (하이픈 자동 포맷팅)
       - 대표자명
       - 개업일자 (날짜 선택기)
       - 상호명 (선택)
       - 법인등록번호 (선택, 법인사업자만)
       - 외국인 사업자 한글명 (선택)
     - **상태조회 테스트 섹션**: 사업자등록번호만 입력
     - API 호출 결과 표시 (JSON 뷰어)
     - 실제 API 응답 원본과 파싱 결과 비교 표시
     - 성공/실패 케이스별 UI 표시
     - Rate Limiting 테스트

   - `/api/test/business-verification/route.ts` (테스트 API 프록시)
     - POST 방식, JSON 요청/응답
     - 환경변수에서 API 키 로드 (`process.env.PUBLIC_DATA_API_KEY`)
     - 진위확인: `/validate` 엔드포인트
     - 상태조회: `/status` 엔드포인트
     - 에러 핸들링 (API 키 누락, 네트워크 에러, 응답 파싱 실패)
     - 요청/응답 로깅

   **Step 2: 모듈 검증 및 최적화**
   - 다양한 케이스 테스트 (정상, 폐업, 휴업, 존재하지 않는 번호)
   - 에러 처리 개선
   - 응답 시간 측정 및 최적화
   - 캐싱 전략 수립 (동일 사업자번호 중복 조회 방지)

   **Step 3: CustomerForm에 통합**
   - 사업자등록번호 입력 시 실시간 검증 옵션 추가
   - "사업자정보 확인" 버튼으로 API 호출
   - 검증 결과에 따라 상호명 자동 입력
   - 폐업/휴업 사업자 경고 메시지

   **환경 변수 설정**:

   ```bash
   # .env.local (이미 설정되어 있음)
   PUBLIC_DATA_API_KEY=<이미_등록된_공공데이터포털_API_키>

   # 사용 예시:
   # - Base URL: https://api.odcloud.kr/api/nts-businessman/v1
   # - 진위확인: https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${PUBLIC_DATA_API_KEY}
   # - 상태조회: https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${PUBLIC_DATA_API_KEY}
   ```

   **API 호출 시 주의사항** (공공데이터포털 문서 기준):
   - **요청 방식**: POST, Content-Type: `application/json`
   - **사업자등록번호**: 숫자 10자리, 하이픈(`-`) 제거 필수
   - **법인등록번호**: 숫자 13자리, 하이픈(`-`) 제거 필수
   - **개업일자**: `YYYYMMDD` 형식, 하이픈(`-`) 제거 필수
   - **대표자성명**: 외국인의 경우 영문명 입력, 한글명은 `p_nm2` 필드 사용
   - **상호**: "주식회사", "(주)" 등은 앞/뒤 위치 상관없이 검색 가능
   - **공백**: 모든 필드에서 앞뒤 공백 무시
   - **배열 형식**: 여러 사업자번호 동시 조회 가능 (`b_no: string[]`)
   - **빈값 처리**: 선택 필드를 빈값으로 검색 시 `""` (empty string) 사용

5. **인증 및 권한 체크**:
   - Supabase Auth 세션 검증 (모든 API 엔드포인트)
   - 사용자는 자신의 고객만 조회/수정/삭제 가능 (userId 필터링)

6. **에러 처리**:
   - 400: 유효성 검증 실패 (Zod 에러)
   - 401: 인증되지 않은 사용자
   - 403: 권한 없음 (다른 사용자의 고객 접근 시도)
   - 404: 고객을 찾을 수 없음
   - 500: 서버 에러

7. **Postman/Insomnia로 API 테스트**

8. **Jest로 단위 테스트 작성** (선택사항, 시간 여유 시)

**완료 조건**:

- [x] Customer Prisma 모델 작성 및 마이그레이션 완료
- [x] 5개 CRUD API 엔드포인트 구현 완료
- [x] Zod 검증 스키마 작성 및 적용
- [x] 국세청 사업자등록정보 API 통합 완료:
  - [x] Step 1: API 모듈 및 테스트 페이지 구현
  - [x] Step 2: 다양한 케이스 테스트 및 검증 완료
  - [x] Step 3: CustomerForm에 검증 기능 통합 (테스트 페이지에 통합)
- [x] 인증/권한 체크 미들웨어 적용
- [x] Postman/Insomnia로 모든 API 동작 확인 (테스트 페이지로 확인)
- [x] 표준 응답 형식 준수 확인
- [ ] ~~테스트 커버리지 80% 이상~~ (선택사항)

**예상 기간**: 5일
**난이도**: 중
**기술 스택**: Prisma, Zod, Next.js API Routes, Supabase Auth

---

### 📋 ISSUE-04: 고객 관리 UI 컴포넌트 개발

**상태**: 대기
**목표**: 고객 목록, 상세, 등록/수정 UI 구현
**의존성**: ISSUE-03 (고객 API) 완료

**작업 내용**:

1. **shadcn/ui 공통 컴포넌트 설치**:

   ```bash
   npx shadcn@latest add button input label textarea select table dialog
   npx shadcn@latest add form card badge separator skeleton
   ```

2. **고객 관련 컴포넌트 작성**:
   - `/components/customers/CustomerList.tsx` (목록 + 필터링)
     - shadcn/ui Table 사용
     - 페이지네이션 (React Query useInfiniteQuery)
     - 로딩 상태 (Skeleton UI)
   - `/components/customers/CustomerCard.tsx` (카드 형태)
     - shadcn/ui Card 사용
     - 모바일 최적화 뷰
   - `/components/customers/CustomerForm.tsx` (등록/수정 폼)
     - shadcn/ui Form + react-hook-form 사용
     - Zod 스키마 통합
     - 실시간 유효성 검증
   - `/components/customers/CustomerDetail.tsx` (상세 정보)
     - 고객 정보 표시
     - 매칭 결과 프리뷰 (Phase 4 이후)
   - `/components/customers/CustomerFilters.tsx` (필터 UI)
     - 업종, 지역, 생성일 필터

3. **React Query 설정**:

   ```typescript
   // /lib/queries/customers.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

   export const useCustomers = filters => {
     return useQuery({
       queryKey: ['customers', filters],
       queryFn: () => fetchCustomers(filters),
       staleTime: 5 * 60 * 1000, // 5분 캐싱
     });
   };

   export const useCreateCustomer = () => {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: createCustomer,
       onSuccess: () => {
         queryClient.invalidateQueries(['customers']);
       },
     });
   };

   export const useUpdateCustomer = () => {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: updateCustomer,
       onSuccess: () => {
         queryClient.invalidateQueries(['customers']);
       },
     });
   };

   export const useDeleteCustomer = () => {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: deleteCustomer,
       onSuccess: () => {
         queryClient.invalidateQueries(['customers']);
       },
     });
   };
   ```

4. **페이지 작성**:
   - `/app/customers/page.tsx` (목록)
     - CustomerList + CustomerFilters
     - "새 고객 등록" 버튼
   - `/app/customers/[id]/page.tsx` (상세)
     - CustomerDetail
     - 수정/삭제 버튼
   - `/app/customers/new/page.tsx` (등록)
     - CustomerForm

5. **Loading/Error 상태 처리**:
   - React Query isLoading, isError, error 상태 활용
   - Skeleton UI (로딩)
   - Error Boundary (에러)

6. **Optimistic Updates 구현**:
   - 수정/삭제 시 즉시 UI 업데이트
   - API 실패 시 자동 롤백

7. **디자인 시스템 적용** (PRINCIPLES.md 준수):
   - Primary Blue (#0052CC) - CTA 버튼
   - Lucide React 아이콘 사용
   - TailwindCSS 유틸리티 클래스
   - 모바일 반응형 (sm, md, lg breakpoints)

**완료 조건**:

- [ ] shadcn/ui 컴포넌트 설치 및 설정 완료
- [ ] 고객 목록 조회 UI 동작 확인 (필터링/정렬)
- [ ] 고객 등록 폼 동작 확인 (유효성 검증)
- [ ] 고객 수정 기능 동작 확인
- [ ] 고객 삭제 기능 동작 확인 (확인 다이얼로그 포함)
- [ ] Loading/Error 상태 처리 확인
- [ ] Optimistic Updates 동작 확인
- [ ] 모바일 반응형 동작 확인 (767px 이하)

**예상 기간**: 7일
**난이도**: 중
**기술 스택**: React Query, shadcn/ui, react-hook-form, Zod, TailwindCSS

---

### 📋 ISSUE-05: 엑셀 파일 업로드 기능

**상태**: 대기
**목표**: 고객 데이터 일괄 등록 기능 구현
**의존성**: ISSUE-03 (고객 API) 완료

**작업 내용**:

1. **엑셀 파싱 라이브러리 설치**:

   ```bash
   npm install xlsx
   npm install --save-dev @types/xlsx
   ```

2. **API 작성**:
   - `POST /api/customers/bulk` (엑셀 파일 업로드 처리)
     ```typescript
     // Request: FormData (file: File)
     // Response: {
     //   success: true,
     //   data: {
     //     total: 100,
     //     success: 95,
     //     failed: 5,
     //     errors: [
     //       { row: 10, field: 'email', message: '이메일 형식이 잘못되었습니다' },
     //       { row: 25, field: 'name', message: '고객명은 필수입니다' }
     //     ]
     //   }
     // }
     ```
   - **검증 로직**: Zod 스키마로 각 행 검증
   - **중복 체크**: contactEmail 기준 중복 방지
   - **트랜잭션 처리**: Prisma transaction으로 부분 실패 시 롤백
     ```typescript
     await prisma.$transaction(async tx => {
       // 모든 고객 생성
       for (const customer of validatedCustomers) {
         await tx.customer.create({ data: customer });
       }
     });
     ```

3. **업로드 UI 컴포넌트**:
   - `/components/customers/BulkUpload.tsx`
     - 드래그앤드롭 지원 (react-dropzone)
     - 진행률 표시 (Progress bar)
     - 에러 결과 표시 (어떤 행에서 실패했는지)
     - 성공/실패 통계 표시

4. **엑셀 템플릿 다운로드 기능**:
   - `/api/customers/bulk/template` (GET)
   - xlsx 라이브러리로 템플릿 생성
   - 샘플 데이터 포함 (2-3개 예시 행)
   - 필수/선택 컬럼 안내 (첫 번째 행 주석)

5. **업로드 페이지 작성**:
   - `/app/customers/bulk-upload/page.tsx`
   - BulkUpload 컴포넌트
   - 템플릿 다운로드 버튼
   - 업로드 가이드 (지원 형식, 최대 파일 크기)

**완료 조건**:

- [ ] 엑셀 파싱 라이브러리 설치 완료
- [ ] 템플릿 다운로드 API 구현
- [ ] 엑셀 업로드 API 구현 (검증 + 트랜잭션)
- [ ] 업로드 UI 컴포넌트 구현 (드래그앤드롭)
- [ ] 100개 이상의 고객 데이터 일괄 등록 성공 테스트
- [ ] 에러 처리 확인 (잘못된 데이터 감지 및 표시)
- [ ] 진행률 표시 동작 확인
- [ ] 성공/실패 통계 표시 확인

**예상 기간**: 5일
**난이도**: 중
**기술 스택**: xlsx, react-dropzone, Prisma Transaction, Zod

---

## 📌 다음 Phase 미리보기

**Phase 3: 정부지원사업 데이터 수집 (Week 5-6)**

- ISSUE-06: 다중 공공데이터 API 통합 연동 (중기부 + K-startup) ⚠️ 고위험
- ISSUE-07: 정부지원사업 UI 컴포넌트 개발

**핵심 기술**:

- Adapter Pattern (IProgramAPIClient)
- Promise.allSettled (병렬 API 호출)
- Exponential Backoff (Rate Limiting)
- Vercel Cron Job (자동 동기화)

---

## 🎯 현재 작업 시작하기

Phase 2를 시작하려면:

1. **"ISSUE-03 시작해줘"** - 고객 API 구현 시작
2. **"고객 데이터 모델 작성해줘"** - Prisma 스키마부터 시작

Phase를 변경하려면:

1. **"Phase 1로 돌아가줘"** - 이전 Phase 확인
2. **"Phase 3 보여줘"** - 다음 Phase 미리보기

---

## 📊 Phase 2 예상 완료 시점

**총 예상 기간**: 17일 (Week 3-4)

- ISSUE-03: 5일
- ISSUE-04: 7일
- ISSUE-05: 5일

**성공 기준**:

- ✅ 고객 CRUD API 완성 (인증/권한 포함)
- ✅ 고객 관리 UI 완성 (목록/상세/등록/수정/삭제)
- ✅ 엑셀 일괄 업로드 기능 완성
- ✅ React Query 상태 관리 완성
- ✅ shadcn/ui 디자인 시스템 적용
