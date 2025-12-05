# RLS (Row Level Security) 설정 가이드

## 📋 개요

Supabase 테이블에 Row Level Security를 적용하여 데이터 보안을 강화합니다.

**현재 상태**: UNRESTRICTED (모든 데이터 공개 🚨)
**목표 상태**: RLS 활성화 + 정책 적용 (사용자별 데이터 격리 ✅)

---

## 🔧 1단계: Supabase에서 RLS 정책 적용

### 1-1. Supabase Dashboard 접속

1. https://supabase.com/dashboard 로그인
2. 프로젝트 선택: `ownership_ai`
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 1-2. RLS 정책 SQL 실행

1. `prisma/enable-rls-policies.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기
4. **Run** 버튼 클릭

**예상 실행 시간**: 5-10초

### 1-3. 적용 확인

**Table Editor**로 이동:

- `customers` 테이블 → **RLS enabled** 표시 확인
- `programs` 테이블 → **RLS enabled** 표시 확인
- `customer_programs` 테이블 → **RLS enabled** 표시 확인
- `matching_results` 테이블 → **RLS enabled** 표시 확인
- `sync_metadata` 테이블 → **RLS enabled** 표시 확인
- `invitations` 테이블 → **RLS enabled** 표시 확인

---

## 🛠️ 2단계: API 라우트 업데이트 (Service Client 사용)

### 업데이트 필요한 API 라우트

RLS를 우회해야 하는 API (Service Client 사용 필요):

#### ✅ 이미 Prisma 사용 중 (수정 불필요)

- `/api/customers` → Prisma 사용
- `/api/customers/[id]` → Prisma 사용
- `/api/programs` → Prisma 사용
- `/api/programs/[id]` → Prisma 사용
- `/api/matching` → Prisma 사용

#### ⚠️ Supabase Direct Query 사용 중 (확인 필요)

아래 API들이 Supabase를 직접 사용한다면 Service Client로 변경 필요:

```typescript
// ❌ 변경 전 (RLS 적용됨 - 에러 발생 가능)
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient(); // RLS 적용

  const { data, error } = await supabase.from('programs').insert(programData); // RLS로 차단될 수 있음
}
```

```typescript
// ✅ 변경 후 (RLS 우회)
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServiceClient(); // RLS 우회

  const { data, error } = await supabase.from('programs').insert(programData); // 성공
}
```

### Service Client 사용이 필요한 경우

**RLS 우회가 필요한 작업**:

1. 프로그램 동기화 (`/api/programs/sync`) - 모든 프로그램 업데이트
2. 매칭 알고리즘 실행 (`/api/matching`) - 모든 프로그램 조회
3. 관리자 작업 (초대 승인, 통계 조회 등)

**RLS 적용이 필요한 작업**:

1. 고객 CRUD - 사용자는 자기 고객만 접근 (Prisma 사용 중)
2. 관심목록 관리 - 사용자는 자기 관심목록만 접근
3. 매칭 결과 조회 - 사용자는 자기 매칭 결과만 조회

---

## ✅ 3단계: 테스트

### 3-1. 로컬 환경에서 테스트

1. **개발 서버 재시작**

   ```bash
   npm run dev
   ```

2. **Supabase Dashboard → Table Editor 확인**
   - 모든 테이블에 **RLS enabled** 표시 확인

3. **프론트엔드 테스트**

   ```bash
   # 브라우저에서 http://localhost:3000 접속
   # 로그인 후 고객 목록 조회
   ```

   **예상 동작**:
   - ✅ 자신의 고객만 조회됨
   - ✅ 다른 사용자의 고객은 보이지 않음

4. **API 테스트**

   ```bash
   # 프로그램 동기화 (Service Client 사용)
   curl -X POST http://localhost:3000/api/programs/sync

   # 고객 조회 (일반 Client 사용)
   curl http://localhost:3000/api/customers \
     -H "Cookie: your-session-cookie"
   ```

### 3-2. 다른 사용자 계정으로 테스트

1. 두 번째 사용자 계정 생성
2. 로그인 후 고객 생성
3. 첫 번째 계정으로 전환
4. **확인**: 두 번째 계정의 고객이 보이지 않아야 함 ✅

### 3-3. Supabase Auth 로그 확인

**Supabase Dashboard → Authentication → Logs**

- RLS 정책이 올바르게 적용되는지 확인
- 권한 거부 로그 확인

---

## 🔍 4단계: 문제 해결

### 문제 1: "permission denied for table customers"

**원인**: RLS 정책이 잘못 설정됨

**해결**:

1. Supabase SQL Editor에서 정책 확인
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'customers';
   ```
2. 정책이 없으면 `enable-rls-policies.sql` 재실행

### 문제 2: API에서 데이터 조회 실패

**원인**: API에서 일반 Client 대신 Service Client를 사용해야 함

**해결**:

```typescript
// src/lib/supabase/server.ts
import { createServiceClient } from '@/lib/supabase/server';

const supabase = createServiceClient(); // RLS 우회
```

### 문제 3: 프론트엔드에서 모든 데이터가 보임

**원인**: 브라우저 캐시 또는 세션 문제

**해결**:

1. 브라우저 캐시 삭제
2. 로그아웃 후 재로그인
3. Supabase Dashboard에서 RLS 활성화 확인

---

## 📊 RLS 정책 요약

| 테이블                | SELECT        | INSERT      | UPDATE      | DELETE      | 설명                                  |
| --------------------- | ------------- | ----------- | ----------- | ----------- | ------------------------------------- |
| **customers**         | 사용자 본인   | 사용자 본인 | 사용자 본인 | 사용자 본인 | 고객 데이터는 생성한 사용자만 접근    |
| **programs**          | 인증된 사용자 | 서비스 역할 | 서비스 역할 | 서비스 역할 | 모든 사용자가 조회 가능, 수정은 API만 |
| **customer_programs** | 고객 소유자   | 고객 소유자 | -           | 고객 소유자 | 관심목록은 고객 소유자만 관리         |
| **matching_results**  | 고객 소유자   | 서비스 역할 | 서비스 역할 | 서비스 역할 | 매칭 결과는 고객 소유자만 조회        |
| **sync_metadata**     | 인증된 사용자 | 서비스 역할 | 서비스 역할 | 서비스 역할 | 동기화 메타데이터는 읽기만            |
| **invitations**       | 본인 email    | 누구나      | 서비스 역할 | 서비스 역할 | 초대 신청은 누구나, 승인은 관리자만   |

---

## 🚀 Production 배포 시 주의사항

### Vercel 환경 변수 확인

```bash
vercel env ls
```

**필수 환경 변수**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ⚠️ **중요!**
- `DATABASE_URL`
- `DIRECT_URL`

### Production 테스트

1. Vercel 배포 후 RLS 작동 확인
2. Supabase Production 환경에서 동일한 SQL 실행
3. 다중 사용자 시나리오 테스트

---

## 📝 추가 보안 권장사항

### 1. API Rate Limiting

```typescript
// src/middleware.ts
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request: Request) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

### 2. Input Validation (Zod)

```typescript
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1).max(100),
  businessNumber: z.string().regex(/^\d{10}$/),
});
```

### 3. SQL Injection 방지

- ✅ **Prisma ORM 사용** (SQL Injection 자동 방지)
- ✅ Supabase Query Builder 사용 (parameterized queries)
- ❌ Raw SQL 직접 실행 금지

---

## 📚 참고 문서

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**마지막 업데이트**: 2025-12-05
**작성자**: Claude (SuperClaude Framework)
