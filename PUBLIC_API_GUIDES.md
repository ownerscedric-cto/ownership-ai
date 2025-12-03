# 공공데이터 API 활용 가이드

정부지원사업 플랫폼에서 사용하는 공공데이터 API들의 활용 방법을 정리한 문서입니다.

## 목차

1. [기업마당 API](#기업마당-api)
2. [K-Startup API](#k-startup-api)
3. [한국콘텐츠진흥원 (KOCCA) API](#한국콘텐츠진흥원-kocca-api)
4. [다중 API 데이터 교차 노출 전략](#다중-api-데이터-교차-노출-전략)

---

## 기업마당 API

기업마당(Bizinfo)은 중소벤처기업부에서 운영하는 정부지원사업 통합 플랫폼입니다. 다양한 정부지원사업 정보를 API를 통해 제공합니다.

### 1. API 기본 정보

**Base URL**

```
https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do
```

**인증 방식**

- API Key 방식 (crtfcKey 파라미터)
- 환경변수: `BIZINFO_API_KEY`

**응답 형식**

- RSS (XML)
- JSON

### 2. 요청 파라미터

| 파라미터        | 필수 | 타입   | 설명                                                       | 예시                |
| --------------- | ---- | ------ | ---------------------------------------------------------- | ------------------- |
| `crtfcKey`      | ✅   | string | API 인증키                                                 | `{BIZINFO_API_KEY}` |
| `dataType`      | ✅   | string | 응답 데이터 형식<br/>- `rss`: RSS (XML)<br/>- `json`: JSON | `json`              |
| `searchCnt`     | ❌   | number | 검색 건수 (최대 500건)                                     | `10`                |
| `pageIndex`     | ❌   | number | 페이지 번호 (1부터 시작)                                   | `1`                 |
| `pageUnit`      | ❌   | number | 페이지당 결과 수                                           | `10`                |
| `searchLclasId` | ❌   | string | 분야 코드 (아래 표 참조)                                   | `01`                |
| `hashtags`      | ❌   | string | 지역 해시태그 (공백으로 구분)                              | `서울 경기`         |

### 3. 분야 코드 (searchLclasId)

| 코드 | 분야명 | 설명                    |
| ---- | ------ | ----------------------- |
| `01` | 금융   | 자금지원, 융자, 보증 등 |
| `02` | 기술   | R&D, 기술개발, 특허 등  |
| `03` | 인력   | 고용, 교육, 인턴십 등   |
| `04` | 수출   | 해외진출, 수출지원 등   |
| `05` | 내수   | 판로지원, 마케팅 등     |
| `06` | 창업   | 창업지원, 초기투자 등   |
| `07` | 경영   | 컨설팅, 경영지원 등     |
| `09` | 기타   | 기타 정부지원사업       |

### 4. 지역 해시태그 (hashtags)

```
서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종,
경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
```

**사용 예시**:

- 단일 지역: `hashtags=서울`
- 복수 지역: `hashtags=서울 경기`
- 전국: 파라미터 생략

### 5. TypeScript 타입 정의

```typescript
// types/bizinfo.ts

/**
 * 기업마당 API 요청 파라미터
 */
export interface BizinfoApiParams {
  crtfcKey: string; // API 인증키
  dataType: 'rss' | 'json'; // 응답 형식
  searchCnt?: number; // 검색 건수 (최대 500)
  pageIndex?: number; // 페이지 번호
  pageUnit?: number; // 페이지당 결과 수
  searchLclasId?: BizinfoCategory; // 분야 코드
  hashtags?: string; // 지역 해시태그 (공백 구분)
}

/**
 * 분야 코드 타입
 */
export type BizinfoCategory =
  | '01' // 금융
  | '02' // 기술
  | '03' // 인력
  | '04' // 수출
  | '05' // 내수
  | '06' // 창업
  | '07' // 경영
  | '09'; // 기타

/**
 * 분야 코드 레이블 매핑
 */
export const BIZINFO_CATEGORY_LABELS: Record<BizinfoCategory, string> = {
  '01': '금융',
  '02': '기술',
  '03': '인력',
  '04': '수출',
  '05': '내수',
  '06': '창업',
  '07': '경영',
  '09': '기타',
};

/**
 * 지역 해시태그 목록
 */
export const BIZINFO_REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export type BizinfoRegion = (typeof BIZINFO_REGIONS)[number];

/**
 * 기업마당 API 응답 (JSON)
 */
export interface BizinfoApiResponse {
  pageInfo: {
    totalCount: number; // 전체 건수
    resultCount: number; // 현재 페이지 건수
    pageIndex: number; // 현재 페이지
    pageUnit: number; // 페이지당 결과 수
  };
  resultCode: string; // 응답 코드 ("00": 성공)
  resultMsg: string; // 응답 메시지
  items?: BizinfoProgram[]; // 사업 목록
}

/**
 * 정부지원사업 항목
 */
export interface BizinfoProgram {
  pblancNm: string; // 사업명
  reqstBeginDt: string; // 신청 시작일 (YYYYMMDD)
  reqstEndDt: string; // 신청 종료일 (YYYYMMDD)
  pblancUrl: string; // 공고 URL
  areaNm: string; // 지역명
  pbancOprtnInsttNm: string; // 운영기관명
  pldirSportRealmLclasCodeNm: string; // 분야명 (대분류)
  pblancDc: string; // 사업 설명
  jrsdInsttNm: string; // 소관기관명
}
```

### 6. API 클라이언트 구현

```typescript
// lib/bizinfo-client.ts

import type {
  BizinfoApiParams,
  BizinfoApiResponse,
  BizinfoCategory,
  BizinfoProgram,
} from '@/types/bizinfo';

/**
 * 기업마당 API 클라이언트
 */
export class BizinfoApiClient {
  private readonly baseUrl = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BIZINFO_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('BIZINFO_API_KEY is required');
    }
  }

  /**
   * 정부지원사업 목록 조회
   */
  async getPrograms(
    params: Omit<BizinfoApiParams, 'crtfcKey' | 'dataType'>
  ): Promise<BizinfoApiResponse> {
    const searchParams = new URLSearchParams({
      crtfcKey: this.apiKey,
      dataType: 'json',
      ...(params.searchCnt && { searchCnt: String(params.searchCnt) }),
      ...(params.pageIndex && { pageIndex: String(params.pageIndex) }),
      ...(params.pageUnit && { pageUnit: String(params.pageUnit) }),
      ...(params.searchLclasId && { searchLclasId: params.searchLclasId }),
      ...(params.hashtags && { hashtags: params.hashtags }),
    });

    const url = `${this.baseUrl}?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: BizinfoApiResponse = await response.json();

      // API 응답 코드 확인
      if (data.resultCode !== '00') {
        throw new Error(`API error: ${data.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('Bizinfo API error:', error);
      throw error;
    }
  }

  /**
   * 분야별 사업 조회
   */
  async getProgramsByCategory(
    category: BizinfoCategory,
    options?: {
      pageIndex?: number;
      pageUnit?: number;
      regions?: string[];
    }
  ): Promise<BizinfoProgram[]> {
    const response = await this.getPrograms({
      searchLclasId: category,
      pageIndex: options?.pageIndex || 1,
      pageUnit: options?.pageUnit || 20,
      searchCnt: 500,
      hashtags: options?.regions?.join(' '),
    });

    return response.items || [];
  }

  /**
   * 지역별 사업 조회
   */
  async getProgramsByRegion(
    regions: string[],
    options?: {
      category?: BizinfoCategory;
      pageIndex?: number;
      pageUnit?: number;
    }
  ): Promise<BizinfoProgram[]> {
    const response = await this.getPrograms({
      hashtags: regions.join(' '),
      searchLclasId: options?.category,
      pageIndex: options?.pageIndex || 1,
      pageUnit: options?.pageUnit || 20,
      searchCnt: 500,
    });

    return response.items || [];
  }

  /**
   * 전체 사업 조회 (페이지네이션)
   */
  async getAllPrograms(options?: { pageIndex?: number; pageUnit?: number }): Promise<{
    programs: BizinfoProgram[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const pageUnit = options?.pageUnit || 20;
    const pageIndex = options?.pageIndex || 1;

    const response = await this.getPrograms({
      pageIndex,
      pageUnit,
      searchCnt: 500,
    });

    const totalPages = Math.ceil(response.pageInfo.totalCount / pageUnit);

    return {
      programs: response.items || [],
      totalCount: response.pageInfo.totalCount,
      currentPage: pageIndex,
      totalPages,
    };
  }
}

/**
 * 싱글톤 인스턴스 (서버 사이드)
 */
let bizinfoClient: BizinfoApiClient | null = null;

export function getBizinfoClient(): BizinfoApiClient {
  if (!bizinfoClient) {
    bizinfoClient = new BizinfoApiClient();
  }
  return bizinfoClient;
}
```

### 7. 사용 예시

#### 7.1 Next.js API Route에서 사용

```typescript
// app/api/programs/bizinfo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBizinfoClient } from '@/lib/bizinfo-client';
import type { BizinfoCategory } from '@/types/bizinfo';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get('category') as BizinfoCategory | null;
  const regions = searchParams.get('regions')?.split(',') || [];
  const pageIndex = parseInt(searchParams.get('page') || '1');
  const pageUnit = parseInt(searchParams.get('limit') || '20');

  try {
    const client = getBizinfoClient();

    let programs;

    if (category && regions.length > 0) {
      // 분야 + 지역 필터링
      programs = await client.getProgramsByCategory(category, {
        pageIndex,
        pageUnit,
        regions,
      });
    } else if (category) {
      // 분야만 필터링
      programs = await client.getProgramsByCategory(category, {
        pageIndex,
        pageUnit,
      });
    } else if (regions.length > 0) {
      // 지역만 필터링
      programs = await client.getProgramsByRegion(regions, {
        pageIndex,
        pageUnit,
      });
    } else {
      // 전체 조회
      const result = await client.getAllPrograms({
        pageIndex,
        pageUnit,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({
      programs,
      currentPage: pageIndex,
    });
  } catch (error) {
    console.error('Failed to fetch Bizinfo programs:', error);

    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}
```

#### 7.2 React Query Hook

```typescript
// hooks/use-bizinfo-programs.ts

import { useQuery } from '@tanstack/react-query';
import type { BizinfoCategory, BizinfoProgram } from '@/types/bizinfo';

interface UseBizinfoProgramsParams {
  category?: BizinfoCategory;
  regions?: string[];
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useBizinfoPrograms({
  category,
  regions = [],
  page = 1,
  limit = 20,
  enabled = true,
}: UseBizinfoProgramsParams = {}) {
  return useQuery({
    queryKey: ['bizinfo-programs', { category, regions, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (category) {
        params.append('category', category);
      }

      if (regions.length > 0) {
        params.append('regions', regions.join(','));
      }

      const response = await fetch(`/api/programs/bizinfo?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      return response.json() as Promise<{
        programs: BizinfoProgram[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }>;
    },
    enabled,
  });
}
```

#### 7.3 컴포넌트에서 사용

```typescript
// components/BizinfoProgramList.tsx

'use client';

import { useState } from 'react';
import { useBizinfoPrograms } from '@/hooks/use-bizinfo-programs';
import { BIZINFO_CATEGORY_LABELS, BIZINFO_REGIONS } from '@/types/bizinfo';
import type { BizinfoCategory } from '@/types/bizinfo';

export function BizinfoProgramList() {
  const [selectedCategory, setSelectedCategory] = useState<BizinfoCategory | undefined>();
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useBizinfoPrograms({
    category: selectedCategory,
    regions: selectedRegions,
    page: currentPage,
    limit: 20,
  });

  if (error) {
    return <div>오류가 발생했습니다: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="flex gap-4">
        {/* 분야 선택 */}
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value as BizinfoCategory || undefined)}
          className="px-4 py-2 border rounded"
        >
          <option value="">전체 분야</option>
          {Object.entries(BIZINFO_CATEGORY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        {/* 지역 선택 */}
        <select
          multiple
          value={selectedRegions}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions);
            setSelectedRegions(options.map(opt => opt.value));
          }}
          className="px-4 py-2 border rounded"
        >
          {BIZINFO_REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* 사업 목록 */}
      {isLoading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          <div className="space-y-4">
            {data?.programs.map((program) => (
              <div key={program.pblancUrl} className="p-4 border rounded">
                <h3 className="font-bold">{program.pblancNm}</h3>
                <p className="text-sm text-gray-600">{program.pbancOprtnInsttNm}</p>
                <p className="text-sm">
                  신청기간: {program.reqstBeginDt} ~ {program.reqstEndDt}
                </p>
                <p className="text-sm">분야: {program.pldirSportRealmLclasCodeNm}</p>
                <p className="text-sm">지역: {program.areaNm}</p>
                <a
                  href={program.pblancUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  자세히 보기 →
                </a>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {data && data.totalPages > 1 && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-4 py-2">
                {currentPage} / {data.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(data.totalPages, p + 1))}
                disabled={currentPage === data.totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 8. 에러 처리

```typescript
// lib/bizinfo-error-handler.ts

export class BizinfoApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'BizinfoApiError';
  }
}

export function handleBizinfoError(error: unknown): never {
  if (error instanceof BizinfoApiError) {
    throw error;
  }

  if (error instanceof Error) {
    // 네트워크 오류
    if (error.message.includes('fetch')) {
      throw new BizinfoApiError('NETWORK_ERROR', '기업마당 API 연결에 실패했습니다.', 503);
    }

    // 일반 오류
    throw new BizinfoApiError('UNKNOWN_ERROR', error.message, 500);
  }

  throw new BizinfoApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다.', 500);
}
```

### 9. 환경 변수 설정

```bash
# .env.local

# 기업마당 API Key
BIZINFO_API_KEY=your_api_key_here
```

### 10. 데이터 동기화 전략

기업마당 API 데이터를 데이터베이스에 동기화하는 방법:

```typescript
// lib/sync-bizinfo.ts

import { prisma } from '@/lib/prisma';
import { getBizinfoClient } from '@/lib/bizinfo-client';
import type { BizinfoProgram } from '@/types/bizinfo';

/**
 * 기업마당 데이터 동기화
 */
export async function syncBizinfoPrograms() {
  const client = getBizinfoClient();

  try {
    console.log('Starting Bizinfo sync...');

    let page = 1;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
      const result = await client.getAllPrograms({
        pageIndex: page,
        pageUnit: 100, // 한 번에 100개씩
      });

      if (result.programs.length === 0) {
        hasMore = false;
        break;
      }

      // 데이터베이스에 저장
      for (const program of result.programs) {
        await upsertProgram(program);
        totalSynced++;
      }

      console.log(`Synced page ${page}/${result.totalPages}`);

      hasMore = page < result.totalPages;
      page++;

      // Rate limiting (API 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Bizinfo sync completed: ${totalSynced} programs`);

    return { success: true, totalSynced };
  } catch (error) {
    console.error('Bizinfo sync failed:', error);
    throw error;
  }
}

/**
 * 프로그램 데이터 업서트
 */
async function upsertProgram(program: BizinfoProgram) {
  await prisma.program.upsert({
    where: {
      externalId: program.pblancUrl, // URL을 고유 식별자로 사용
    },
    create: {
      externalId: program.pblancUrl,
      source: 'BIZINFO',
      title: program.pblancNm,
      organization: program.pbancOprtnInsttNm,
      department: program.jrsdInsttNm,
      category: program.pldirSportRealmLclasCodeNm,
      region: program.areaNm,
      description: program.pblancDc,
      applicationStartDate: parseDate(program.reqstBeginDt),
      applicationEndDate: parseDate(program.reqstEndDt),
      url: program.pblancUrl,
      status: 'ACTIVE',
    },
    update: {
      title: program.pblancNm,
      organization: program.pbancOprtnInsttNm,
      department: program.jrsdInsttNm,
      category: program.pldirSportRealmLclasCodeNm,
      region: program.areaNm,
      description: program.pblancDc,
      applicationStartDate: parseDate(program.reqstBeginDt),
      applicationEndDate: parseDate(program.reqstEndDt),
      url: program.pblancUrl,
      updatedAt: new Date(),
    },
  });
}

/**
 * 날짜 문자열 파싱 (YYYYMMDD → Date)
 */
function parseDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}
```

### 11. Cron Job 설정 (자동 동기화)

```typescript
// app/api/cron/sync-bizinfo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { syncBizinfoPrograms } from '@/lib/sync-bizinfo';

export async function GET(request: NextRequest) {
  // Vercel Cron Job 인증
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncBizinfoPrograms();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.totalSynced} programs`,
    });
  } catch (error) {
    console.error('Cron job failed:', error);

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-bizinfo",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 12. 베스트 프랙티스

#### 12.1 API 호출 최적화

- 페이지네이션 사용 (pageUnit은 20-100 권장)
- Rate limiting 적용 (요청 간 1초 대기)
- 캐싱 전략 사용 (Redis, React Query)

#### 12.2 데이터 품질 관리

- 중복 데이터 제거 (externalId로 upsert)
- 날짜 형식 검증 (YYYYMMDD)
- 필수 필드 존재 여부 확인

#### 12.3 에러 처리

- API 응답 코드 확인 (resultCode)
- 네트워크 오류 재시도 로직
- 상세한 에러 로깅

#### 12.4 보안

- API Key는 환경 변수로 관리
- 클라이언트 사이드에서 직접 호출 금지
- API Route를 통한 프록시 패턴 사용

---

## K-Startup API

K-Startup은 중소벤처기업부 K-Startup 종합지원플랫폼에서 제공하는 창업 및 지원사업 관련 API입니다.

### 1. API 기본 정보

**Base URL**

```
https://apis.data.go.kr/B552735/kisedKstartupService01
```

**인증 방식**

- API Key 방식 (serviceKey 파라미터)
- 환경변수: `PUBLIC_DATA_API_KEY` (기업마당과 동일한 키 사용 가능)

**응답 형식**

- XML (기본)
- JSON

### 2. API 엔드포인트 목록

#### 2.1 지원사업 공고정보 조회

**Endpoint**: `GET /getAnnouncementInformation01`

가장 핵심적인 API로, 현재 진행 중인 정부지원사업 공고 목록을 조회합니다.

**요청 파라미터**:

| 파라미터     | 필수 | 타입   | 설명                                                | 예시                    |
| ------------ | ---- | ------ | --------------------------------------------------- | ----------------------- |
| `serviceKey` | ✅   | string | API 인증키 (공공데이터포털 발급)                    | `{PUBLIC_DATA_API_KEY}` |
| `page`       | ❌   | number | 페이지 번호 (기본값: 1)                             | `1`                     |
| `perPage`    | ❌   | number | 페이지당 결과 수 (기본값: 10, 최대: 100)            | `10`                    |
| `dataType`   | ❌   | string | 응답 데이터 형식<br/>- 생략: XML<br/>- `json`: JSON | `json`                  |

**예시 URL**:

```
https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey={PUBLIC_DATA_API_KEY}&page=1&perPage=10&dataType=json
```

#### 2.2 통합공고 지원사업 정보 조회

**Endpoint**: `GET /getBusinessInformation01`

다양한 기관의 지원사업을 통합하여 제공하는 API입니다.

**요청 파라미터**: 동일 (serviceKey, page, perPage, dataType)

#### 2.3 창업관련 통계보고서 정보 조회

**Endpoint**: `GET /getStatisticalInformation01`

창업 관련 통계 및 보고서 정보를 제공합니다.

**요청 파라미터**: 동일 (serviceKey, page, perPage, dataType)

#### 2.4 창업관련 콘텐츠 정보 조회

**Endpoint**: `GET /getContentInformation01`

창업 관련 교육 콘텐츠, 가이드 등의 정보를 제공합니다.

**요청 파라미터**: 동일 (serviceKey, page, perPage, dataType)

### 3. TypeScript 타입 정의

```typescript
// types/kstartup.ts

/**
 * K-Startup API 요청 파라미터
 */
export interface KStartupApiParams {
  serviceKey: string; // API 인증키
  page?: number; // 페이지 번호 (기본값: 1)
  perPage?: number; // 페이지당 결과 수 (기본값: 10, 최대: 100)
  dataType?: 'json'; // 응답 형식 (생략 시 XML)
}

/**
 * K-Startup API 공통 응답 구조
 */
export interface KStartupApiResponse<T> {
  response: {
    header: {
      resultCode: string; // 응답 코드 ("00": 성공)
      resultMsg: string; // 응답 메시지
    };
    body: {
      items?: T[]; // 결과 배열
      totalCount: number; // 전체 건수
      pageNo: number; // 현재 페이지
      numOfRows: number; // 페이지당 결과 수
    };
  };
}

/**
 * 지원사업 공고정보 항목
 */
export interface KStartupAnnouncement {
  announcementId: string; // 공고 ID
  title: string; // 공고 제목
  organization: string; // 주관 기관
  department: string; // 담당 부서
  category: string; // 사업 분야
  targetAudience: string; // 지원 대상
  region: string; // 지원 지역
  description: string; // 사업 설명
  budgetRange: string; // 지원 금액
  applicationStartDate: string; // 접수 시작일 (YYYYMMDD)
  applicationEndDate: string; // 접수 종료일 (YYYYMMDD)
  announcementDate: string; // 공고일 (YYYYMMDD)
  detailUrl: string; // 상세보기 URL
  attachmentUrl?: string; // 첨부파일 URL
  contactPhone?: string; // 문의 전화번호
  contactEmail?: string; // 문의 이메일
}

/**
 * 통합공고 지원사업 정보 항목
 */
export interface KStartupBusiness {
  businessId: string; // 사업 ID
  businessName: string; // 사업명
  organization: string; // 주관 기관
  supportType: string; // 지원 유형 (융자, 보조금, 투자 등)
  industry: string; // 지원 업종
  region: string; // 지원 지역
  budget: string; // 지원 규모
  startDate: string; // 사업 시작일
  endDate: string; // 사업 종료일
  detailUrl: string; // 상세보기 URL
}

/**
 * 창업관련 통계보고서 정보 항목
 */
export interface KStartupStatistics {
  reportId: string; // 보고서 ID
  reportTitle: string; // 보고서 제목
  publisher: string; // 발행 기관
  publishDate: string; // 발행일
  summary: string; // 요약
  reportUrl: string; // 보고서 URL
  category: string; // 분류
}

/**
 * 창업관련 콘텐츠 정보 항목
 */
export interface KStartupContent {
  contentId: string; // 콘텐츠 ID
  contentTitle: string; // 콘텐츠 제목
  contentType: string; // 콘텐츠 유형 (동영상, 문서, 교육 등)
  provider: string; // 제공 기관
  category: string; // 분류
  description: string; // 설명
  contentUrl: string; // 콘텐츠 URL
  thumbnailUrl?: string; // 썸네일 URL
  createdDate: string; // 등록일
}
```

### 4. API 클라이언트 구현

```typescript
// lib/kstartup-client.ts

import type {
  KStartupApiParams,
  KStartupApiResponse,
  KStartupAnnouncement,
  KStartupBusiness,
  KStartupStatistics,
  KStartupContent,
} from '@/types/kstartup';

/**
 * K-Startup API 클라이언트
 */
export class KStartupApiClient {
  private readonly baseUrl = 'https://apis.data.go.kr/B552735/kisedKstartupService01';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PUBLIC_DATA_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('PUBLIC_DATA_API_KEY is required');
    }
  }

  /**
   * 지원사업 공고정보 조회
   */
  async getAnnouncements(
    params?: Omit<KStartupApiParams, 'serviceKey'>
  ): Promise<KStartupApiResponse<KStartupAnnouncement>> {
    const searchParams = new URLSearchParams({
      serviceKey: this.apiKey,
      dataType: 'json',
      page: String(params?.page || 1),
      perPage: String(params?.perPage || 10),
    });

    const url = `${this.baseUrl}/getAnnouncementInformation01?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: KStartupApiResponse<KStartupAnnouncement> = await response.json();

      // API 응답 코드 확인
      if (data.response.header.resultCode !== '00') {
        throw new Error(`API error: ${data.response.header.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('K-Startup API error:', error);
      throw error;
    }
  }

  /**
   * 통합공고 지원사업 정보 조회
   */
  async getBusinesses(
    params?: Omit<KStartupApiParams, 'serviceKey'>
  ): Promise<KStartupApiResponse<KStartupBusiness>> {
    const searchParams = new URLSearchParams({
      serviceKey: this.apiKey,
      dataType: 'json',
      page: String(params?.page || 1),
      perPage: String(params?.perPage || 10),
    });

    const url = `${this.baseUrl}/getBusinessInformation01?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: KStartupApiResponse<KStartupBusiness> = await response.json();

      if (data.response.header.resultCode !== '00') {
        throw new Error(`API error: ${data.response.header.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('K-Startup Business API error:', error);
      throw error;
    }
  }

  /**
   * 창업관련 통계보고서 정보 조회
   */
  async getStatistics(
    params?: Omit<KStartupApiParams, 'serviceKey'>
  ): Promise<KStartupApiResponse<KStartupStatistics>> {
    const searchParams = new URLSearchParams({
      serviceKey: this.apiKey,
      dataType: 'json',
      page: String(params?.page || 1),
      perPage: String(params?.perPage || 10),
    });

    const url = `${this.baseUrl}/getStatisticalInformation01?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: KStartupApiResponse<KStartupStatistics> = await response.json();

      if (data.response.header.resultCode !== '00') {
        throw new Error(`API error: ${data.response.header.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('K-Startup Statistics API error:', error);
      throw error;
    }
  }

  /**
   * 창업관련 콘텐츠 정보 조회
   */
  async getContents(
    params?: Omit<KStartupApiParams, 'serviceKey'>
  ): Promise<KStartupApiResponse<KStartupContent>> {
    const searchParams = new URLSearchParams({
      serviceKey: this.apiKey,
      dataType: 'json',
      page: String(params?.page || 1),
      perPage: String(params?.perPage || 10),
    });

    const url = `${this.baseUrl}/getContentInformation01?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: KStartupApiResponse<KStartupContent> = await response.json();

      if (data.response.header.resultCode !== '00') {
        throw new Error(`API error: ${data.response.header.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('K-Startup Content API error:', error);
      throw error;
    }
  }

  /**
   * 모든 공고 페이지네이션 조회
   */
  async getAllAnnouncements(options?: { page?: number; perPage?: number }): Promise<{
    announcements: KStartupAnnouncement[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const perPage = options?.perPage || 10;
    const page = options?.page || 1;

    const response = await this.getAnnouncements({
      page,
      perPage,
    });

    const totalPages = Math.ceil(response.response.body.totalCount / perPage);

    return {
      announcements: response.response.body.items || [],
      totalCount: response.response.body.totalCount,
      currentPage: page,
      totalPages,
    };
  }
}

/**
 * 싱글톤 인스턴스
 */
let kstartupClient: KStartupApiClient | null = null;

export function getKStartupClient(): KStartupApiClient {
  if (!kstartupClient) {
    kstartupClient = new KStartupApiClient();
  }
  return kstartupClient;
}
```

### 5. 사용 예시

#### 5.1 Next.js API Route에서 사용

```typescript
// app/api/programs/kstartup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getKStartupClient } from '@/lib/kstartup-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '10');
  const type = searchParams.get('type') || 'announcements'; // announcements, businesses, statistics, contents

  try {
    const client = getKStartupClient();

    let result;

    switch (type) {
      case 'announcements':
        result = await client.getAllAnnouncements({ page, perPage });
        break;
      case 'businesses':
        const businessResponse = await client.getBusinesses({ page, perPage });
        result = {
          businesses: businessResponse.response.body.items || [],
          totalCount: businessResponse.response.body.totalCount,
          currentPage: page,
          totalPages: Math.ceil(businessResponse.response.body.totalCount / perPage),
        };
        break;
      case 'statistics':
        const statsResponse = await client.getStatistics({ page, perPage });
        result = {
          statistics: statsResponse.response.body.items || [],
          totalCount: statsResponse.response.body.totalCount,
          currentPage: page,
          totalPages: Math.ceil(statsResponse.response.body.totalCount / perPage),
        };
        break;
      case 'contents':
        const contentsResponse = await client.getContents({ page, perPage });
        result = {
          contents: contentsResponse.response.body.items || [],
          totalCount: contentsResponse.response.body.totalCount,
          currentPage: page,
          totalPages: Math.ceil(contentsResponse.response.body.totalCount / perPage),
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch K-Startup data:', error);

    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

#### 5.2 React Query Hook

```typescript
// hooks/use-kstartup-announcements.ts

import { useQuery } from '@tanstack/react-query';
import type { KStartupAnnouncement } from '@/types/kstartup';

interface UseKStartupAnnouncementsParams {
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useKStartupAnnouncements({
  page = 1,
  perPage = 10,
  enabled = true,
}: UseKStartupAnnouncementsParams = {}) {
  return useQuery({
    queryKey: ['kstartup-announcements', { page, perPage }],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'announcements',
        page: String(page),
        perPage: String(perPage),
      });

      const response = await fetch(`/api/programs/kstartup?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      return response.json() as Promise<{
        announcements: KStartupAnnouncement[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }>;
    },
    enabled,
  });
}
```

#### 5.3 컴포넌트에서 사용

```typescript
// components/KStartupAnnouncementList.tsx

'use client';

import { useState } from 'react';
import { useKStartupAnnouncements } from '@/hooks/use-kstartup-announcements';

export function KStartupAnnouncementList() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useKStartupAnnouncements({
    page: currentPage,
    perPage: 20,
  });

  if (error) {
    return <div>오류가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">K-Startup 지원사업 공고</h2>

      {/* 공고 목록 */}
      <div className="space-y-4">
        {data?.announcements.map((announcement) => (
          <div key={announcement.announcementId} className="p-4 border rounded">
            <h3 className="font-bold">{announcement.title}</h3>
            <p className="text-sm text-gray-600">{announcement.organization}</p>
            <p className="text-sm">
              접수기간: {announcement.applicationStartDate} ~ {announcement.applicationEndDate}
            </p>
            <p className="text-sm">지원 대상: {announcement.targetAudience}</p>
            <p className="text-sm">지원 지역: {announcement.region}</p>
            <p className="text-sm">지원 금액: {announcement.budgetRange}</p>
            <a
              href={announcement.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              자세히 보기 →
            </a>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2">
            {currentPage} / {data.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(data.totalPages, p + 1))}
            disabled={currentPage === data.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6. 에러 처리

```typescript
// lib/kstartup-error-handler.ts

export class KStartupApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'KStartupApiError';
  }
}

export function handleKStartupError(error: unknown): never {
  if (error instanceof KStartupApiError) {
    throw error;
  }

  if (error instanceof Error) {
    // 네트워크 오류
    if (error.message.includes('fetch')) {
      throw new KStartupApiError('NETWORK_ERROR', 'K-Startup API 연결에 실패했습니다.', 503);
    }

    // 일반 오류
    throw new KStartupApiError('UNKNOWN_ERROR', error.message, 500);
  }

  throw new KStartupApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다.', 500);
}
```

### 7. 환경 변수 설정

```bash
# .env.local

# 공공데이터 API Key (기업마당과 동일하게 사용 가능)
PUBLIC_DATA_API_KEY=your_api_key_here
```

### 8. 데이터 동기화 전략

K-Startup 데이터를 데이터베이스에 동기화하는 방법:

```typescript
// lib/sync-kstartup.ts

import { prisma } from '@/lib/prisma';
import { getKStartupClient } from '@/lib/kstartup-client';
import type { KStartupAnnouncement } from '@/types/kstartup';

/**
 * K-Startup 데이터 동기화
 */
export async function syncKStartupPrograms() {
  const client = getKStartupClient();

  try {
    console.log('Starting K-Startup sync...');

    let page = 1;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
      const result = await client.getAllAnnouncements({
        page,
        perPage: 100, // 한 번에 100개씩
      });

      if (result.announcements.length === 0) {
        hasMore = false;
        break;
      }

      // 데이터베이스에 저장
      for (const announcement of result.announcements) {
        await upsertAnnouncement(announcement);
        totalSynced++;
      }

      console.log(`Synced page ${page}/${result.totalPages}`);

      hasMore = page < result.totalPages;
      page++;

      // Rate limiting (API 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`K-Startup sync completed: ${totalSynced} programs`);

    return { success: true, totalSynced };
  } catch (error) {
    console.error('K-Startup sync failed:', error);
    throw error;
  }
}

/**
 * 공고 데이터 업서트
 */
async function upsertAnnouncement(announcement: KStartupAnnouncement) {
  await prisma.program.upsert({
    where: {
      externalId: announcement.announcementId, // 공고 ID를 고유 식별자로 사용
    },
    create: {
      externalId: announcement.announcementId,
      source: 'KSTARTUP',
      title: announcement.title,
      organization: announcement.organization,
      department: announcement.department,
      category: announcement.category,
      targetAudience: announcement.targetAudience,
      region: announcement.region,
      description: announcement.description,
      budgetRange: announcement.budgetRange,
      applicationStartDate: parseDate(announcement.applicationStartDate),
      applicationEndDate: parseDate(announcement.applicationEndDate),
      url: announcement.detailUrl,
      status: 'ACTIVE',
    },
    update: {
      title: announcement.title,
      organization: announcement.organization,
      department: announcement.department,
      category: announcement.category,
      targetAudience: announcement.targetAudience,
      region: announcement.region,
      description: announcement.description,
      budgetRange: announcement.budgetRange,
      applicationStartDate: parseDate(announcement.applicationStartDate),
      applicationEndDate: parseDate(announcement.applicationEndDate),
      url: announcement.detailUrl,
      updatedAt: new Date(),
    },
  });
}

/**
 * 날짜 문자열 파싱 (YYYYMMDD → Date)
 */
function parseDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}
```

### 9. Cron Job 설정 (자동 동기화)

```typescript
// app/api/cron/sync-kstartup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { syncKStartupPrograms } from '@/lib/sync-kstartup';

export async function GET(request: NextRequest) {
  // Vercel Cron Job 인증
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncKStartupPrograms();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.totalSynced} programs`,
    });
  } catch (error) {
    console.error('Cron job failed:', error);

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

```json
// vercel.json (기업마당과 함께 설정)
{
  "crons": [
    {
      "path": "/api/cron/sync-bizinfo",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/sync-kstartup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### 10. 다중 API 통합 전략

기업마당과 K-Startup API를 함께 사용하는 방법:

```typescript
// lib/sync-all-programs.ts

import { syncBizinfoPrograms } from '@/lib/sync-bizinfo';
import { syncKStartupPrograms } from '@/lib/sync-kstartup';

/**
 * 모든 API 데이터 동기화
 */
export async function syncAllPrograms() {
  console.log('Starting multi-API sync...');

  const results = await Promise.allSettled([syncBizinfoPrograms(), syncKStartupPrograms()]);

  const bizinfoResult = results[0];
  const kstartupResult = results[1];

  const summary = {
    bizinfo:
      bizinfoResult.status === 'fulfilled'
        ? { success: true, count: bizinfoResult.value.totalSynced }
        : { success: false, error: bizinfoResult.reason },
    kstartup:
      kstartupResult.status === 'fulfilled'
        ? { success: true, count: kstartupResult.value.totalSynced }
        : { success: false, error: kstartupResult.reason },
  };

  console.log('Multi-API sync completed:', summary);

  return summary;
}
```

### 11. 베스트 프랙티스

#### 11.1 API 호출 최적화

- 페이지당 결과 수는 10-100 권장 (최대 100)
- Rate limiting 적용 (요청 간 1초 대기)
- 캐싱 전략 사용 (Redis, React Query)

#### 11.2 데이터 품질 관리

- 중복 데이터 제거 (externalId로 upsert)
- 날짜 형식 검증 (YYYYMMDD)
- 필수 필드 존재 여부 확인

#### 11.3 에러 처리

- API 응답 코드 확인 (resultCode)
- 네트워크 오류 재시도 로직
- 상세한 에러 로깅

#### 11.4 보안

- API Key는 환경 변수로 관리
- 클라이언트 사이드에서 직접 호출 금지
- API Route를 통한 프록시 패턴 사용

### 12. 기업마당 vs K-Startup API 비교

| 항목                   | 기업마당          | K-Startup                          |
| ---------------------- | ----------------- | ---------------------------------- |
| **제공 기관**          | 중소벤처기업부    | 중소벤처기업부                     |
| **주요 대상**          | 중소기업 전반     | 창업 기업 중심                     |
| **응답 형식**          | RSS, JSON         | XML, JSON                          |
| **페이지당 최대 결과** | 500개             | 100개                              |
| **주요 데이터**        | 정부지원사업 공고 | 창업 지원사업, 통계, 콘텐츠        |
| **API 엔드포인트 수**  | 1개 (공고 조회)   | 4개 (공고, 통합공고, 통계, 콘텐츠) |

**추천 사용 전략**:

- **기업마당**: 일반 중소기업 대상 정부지원사업 (금융, 기술, 인력, 수출, 내수, 경영 등)
- **K-Startup**: 창업 기업 대상 지원사업 및 창업 관련 정보

두 API를 함께 사용하면 더 포괄적인 정부지원사업 정보를 제공할 수 있습니다.

---

## 한국콘텐츠진흥원 (KOCCA) API

한국콘텐츠진흥원에서 제공하는 콘텐츠 산업 지원사업 정보 API입니다.

### 1. API 기본 정보

**Base URLs**

```
지원사업: https://kocca.kr/api/pims/List.do
금융지원: https://kocca.kr/api/finance/List.do
```

**인증 방식**

- API Key 방식 (serviceKey 파라미터)
- 환경변수: `KOCCA_API_KEY`
- 발급처: 한국콘텐츠진흥원 (https://kocca.kr)

**응답 형식**

- XML (기본)
- JSON (추정)

### 2. API 엔드포인트

#### 2.1 지원사업 목록 조회

**Endpoint**: `GET /api/pims/List.do`

콘텐츠 산업 지원사업 공고 목록을 조회합니다.

**요청 파라미터**:

| 파라미터     | 필수 | 타입    | 설명                                                                                               | 예시              |
| ------------ | ---- | ------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| `serviceKey` | ✅   | string  | 한국콘텐츠진흥원 발급 서비스키                                                                     | `{KOCCA_API_KEY}` |
| `cate`       | ❌   | string  | 게시판 카테고리<br/>- `1`: 자유공모<br/>- `2`: 지정공모<br/>- `3`: 모집공고<br/>- `4`: 종료된 사업 | `1`               |
| `startDt`    | ❌   | string  | 조회시작일 (YYYYMMDD)                                                                              | `20240101`        |
| `endDt`      | ❌   | string  | 조회종료일 (YYYYMMDD)                                                                              | `20241231`        |
| `pageNo`     | ❌   | integer | 페이지 번호 (기본값: 1)                                                                            | `1`               |
| `numOfRows`  | ❌   | integer | 한 페이지 결과 수 (기본값: 10, 최대: 100)                                                          | `10`              |

**예시 URL**:

```
https://kocca.kr/api/pims/List.do?serviceKey={KOCCA_API_KEY}&pageNo=1&numOfRows=10&cate=1&startDt=20240101&endDt=20241231
```

#### 2.2 금융지원 목록 조회

**Endpoint**: `GET /api/finance/List.do`

콘텐츠 산업 금융지원 정보를 조회합니다.

**요청 파라미터**: 동일 (serviceKey, cate, startDt, endDt, pageNo, numOfRows)

**예시 URL**:

```
https://kocca.kr/api/finance/List.do?serviceKey={KOCCA_API_KEY}&pageNo=1&numOfRows=10
```

### 3. TypeScript 타입 정의

```typescript
// types/kocca.ts

/**
 * 한국콘텐츠진흥원 API 요청 파라미터
 */
export interface KoccaApiParams {
  serviceKey: string; // API 인증키
  cate?: KoccaCategory; // 게시판 카테고리
  startDt?: string; // 조회시작일 (YYYYMMDD)
  endDt?: string; // 조회종료일 (YYYYMMDD)
  pageNo?: number; // 페이지 번호 (기본값: 1)
  numOfRows?: number; // 한 페이지 결과 수 (기본값: 10, 최대: 100)
}

/**
 * 게시판 카테고리 타입
 */
export type KoccaCategory =
  | '1' // 자유공모
  | '2' // 지정공모
  | '3' // 모집공고
  | '4'; // 종료된 사업

/**
 * 게시판 카테고리 레이블 매핑
 */
export const KOCCA_CATEGORY_LABELS: Record<KoccaCategory, string> = {
  '1': '자유공모',
  '2': '지정공모',
  '3': '모집공고',
  '4': '종료된 사업',
};

/**
 * KOCCA API 공통 응답 구조 (추정)
 */
export interface KoccaApiResponse<T> {
  response: {
    header: {
      resultCode: string; // 응답 코드
      resultMsg: string; // 응답 메시지
    };
    body: {
      items?: T[]; // 결과 배열
      totalCount: number; // 전체 건수
      pageNo: number; // 현재 페이지
      numOfRows: number; // 페이지당 결과 수
    };
  };
}

/**
 * 지원사업 항목
 */
export interface KoccaProgram {
  programId: string; // 사업 ID
  title: string; // 사업명
  category: string; // 카테고리 (자유공모, 지정공모 등)
  organization: string; // 주관 기관
  description: string; // 사업 설명
  targetAudience: string; // 지원 대상
  supportDetail: string; // 지원 내용
  budgetRange: string; // 지원 규모
  applicationStartDate: string; // 접수 시작일 (YYYYMMDD)
  applicationEndDate: string; // 접수 종료일 (YYYYMMDD)
  announcementDate: string; // 공고일 (YYYYMMDD)
  detailUrl: string; // 상세보기 URL
  attachmentUrl?: string; // 첨부파일 URL
  contactInfo?: string; // 문의처
  status: string; // 진행 상태
}

/**
 * 금융지원 항목
 */
export interface KoccaFinance {
  financeId: string; // 금융지원 ID
  title: string; // 금융지원명
  financeType: string; // 금융 유형 (융자, 보증, 투자 등)
  organization: string; // 지원 기관
  description: string; // 지원 설명
  targetAudience: string; // 지원 대상
  supportAmount: string; // 지원 금액
  interestRate?: string; // 금리 (융자의 경우)
  period: string; // 지원 기간
  applicationMethod: string; // 신청 방법
  detailUrl: string; // 상세보기 URL
  contactInfo?: string; // 문의처
}
```

### 4. API 클라이언트 구현

```typescript
// lib/kocca-client.ts

import type {
  KoccaApiParams,
  KoccaApiResponse,
  KoccaProgram,
  KoccaFinance,
  KoccaCategory,
} from '@/types/kocca';

/**
 * 한국콘텐츠진흥원 API 클라이언트
 */
export class KoccaApiClient {
  private readonly baseUrl = 'https://kocca.kr/api';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KOCCA_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('KOCCA_API_KEY is required');
    }
  }

  /**
   * 지원사업 목록 조회
   */
  async getPrograms(
    params?: Omit<KoccaApiParams, 'serviceKey'>
  ): Promise<KoccaApiResponse<KoccaProgram>> {
    const searchParams = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: String(params?.pageNo || 1),
      numOfRows: String(params?.numOfRows || 10),
      ...(params?.cate && { cate: params.cate }),
      ...(params?.startDt && { startDt: params.startDt }),
      ...(params?.endDt && { endDt: params.endDt }),
    });

    const url = `${this.baseUrl}/pims/List.do?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: KoccaApiResponse<KoccaProgram> = await response.json();

      // API 응답 코드 확인
      if (data.response.header.resultCode !== '00') {
        throw new Error(`API error: ${data.response.header.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('KOCCA API error:', error);
      throw error;
    }
  }

  /**
   * 금융지원 목록 조회
   */
  async getFinances(
    params?: Omit<KoccaApiParams, 'serviceKey'>
  ): Promise<KoccaApiResponse<KoccaFinance>> {
    const searchParams = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: String(params?.pageNo || 1),
      numOfRows: String(params?.numOfRows || 10),
      ...(params?.cate && { cate: params.cate }),
      ...(params?.startDt && { startDt: params.startDt }),
      ...(params?.endDt && { endDt: params.endDt }),
    });

    const url = `${this.baseUrl}/finance/List.do?${searchParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: KoccaApiResponse<KoccaFinance> = await response.json();

      if (data.response.header.resultCode !== '00') {
        throw new Error(`API error: ${data.response.header.resultMsg}`);
      }

      return data;
    } catch (error) {
      console.error('KOCCA Finance API error:', error);
      throw error;
    }
  }

  /**
   * 카테고리별 지원사업 조회
   */
  async getProgramsByCategory(
    category: KoccaCategory,
    options?: {
      pageNo?: number;
      numOfRows?: number;
      startDt?: string;
      endDt?: string;
    }
  ): Promise<KoccaProgram[]> {
    const response = await this.getPrograms({
      cate: category,
      pageNo: options?.pageNo || 1,
      numOfRows: options?.numOfRows || 20,
      startDt: options?.startDt,
      endDt: options?.endDt,
    });

    return response.response.body.items || [];
  }

  /**
   * 기간별 지원사업 조회
   */
  async getProgramsByPeriod(
    startDate: string,
    endDate: string,
    options?: {
      category?: KoccaCategory;
      pageNo?: number;
      numOfRows?: number;
    }
  ): Promise<KoccaProgram[]> {
    const response = await this.getPrograms({
      startDt: startDate,
      endDt: endDate,
      cate: options?.category,
      pageNo: options?.pageNo || 1,
      numOfRows: options?.numOfRows || 20,
    });

    return response.response.body.items || [];
  }

  /**
   * 모든 지원사업 페이지네이션 조회
   */
  async getAllPrograms(options?: { pageNo?: number; numOfRows?: number }): Promise<{
    programs: KoccaProgram[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const numOfRows = options?.numOfRows || 10;
    const pageNo = options?.pageNo || 1;

    const response = await this.getPrograms({
      pageNo,
      numOfRows,
    });

    const totalPages = Math.ceil(response.response.body.totalCount / numOfRows);

    return {
      programs: response.response.body.items || [],
      totalCount: response.response.body.totalCount,
      currentPage: pageNo,
      totalPages,
    };
  }
}

/**
 * 싱글톤 인스턴스
 */
let koccaClient: KoccaApiClient | null = null;

export function getKoccaClient(): KoccaApiClient {
  if (!koccaClient) {
    koccaClient = new KoccaApiClient();
  }
  return koccaClient;
}
```

### 5. 사용 예시

#### 5.1 Next.js API Route에서 사용

```typescript
// app/api/programs/kocca/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getKoccaClient } from '@/lib/kocca-client';
import type { KoccaCategory } from '@/types/kocca';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const pageNo = parseInt(searchParams.get('page') || '1');
  const numOfRows = parseInt(searchParams.get('limit') || '10');
  const cate = searchParams.get('cate') as KoccaCategory | null;
  const startDt = searchParams.get('startDt');
  const endDt = searchParams.get('endDt');
  const type = searchParams.get('type') || 'programs'; // programs, finances

  try {
    const client = getKoccaClient();

    let result;

    if (type === 'programs') {
      const response = await client.getPrograms({
        pageNo,
        numOfRows,
        cate: cate || undefined,
        startDt: startDt || undefined,
        endDt: endDt || undefined,
      });

      result = {
        programs: response.response.body.items || [],
        totalCount: response.response.body.totalCount,
        currentPage: pageNo,
        totalPages: Math.ceil(response.response.body.totalCount / numOfRows),
      };
    } else if (type === 'finances') {
      const response = await client.getFinances({
        pageNo,
        numOfRows,
        cate: cate || undefined,
        startDt: startDt || undefined,
        endDt: endDt || undefined,
      });

      result = {
        finances: response.response.body.items || [],
        totalCount: response.response.body.totalCount,
        currentPage: pageNo,
        totalPages: Math.ceil(response.response.body.totalCount / numOfRows),
      };
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch KOCCA data:', error);

    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

#### 5.2 React Query Hook

```typescript
// hooks/use-kocca-programs.ts

import { useQuery } from '@tanstack/react-query';
import type { KoccaProgram, KoccaCategory } from '@/types/kocca';

interface UseKoccaProgramsParams {
  page?: number;
  limit?: number;
  category?: KoccaCategory;
  startDt?: string;
  endDt?: string;
  enabled?: boolean;
}

export function useKoccaPrograms({
  page = 1,
  limit = 10,
  category,
  startDt,
  endDt,
  enabled = true,
}: UseKoccaProgramsParams = {}) {
  return useQuery({
    queryKey: ['kocca-programs', { page, limit, category, startDt, endDt }],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'programs',
        page: String(page),
        limit: String(limit),
      });

      if (category) params.append('cate', category);
      if (startDt) params.append('startDt', startDt);
      if (endDt) params.append('endDt', endDt);

      const response = await fetch(`/api/programs/kocca?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      return response.json() as Promise<{
        programs: KoccaProgram[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }>;
    },
    enabled,
  });
}
```

#### 5.3 컴포넌트에서 사용

```typescript
// components/KoccaProgramList.tsx

'use client';

import { useState } from 'react';
import { useKoccaPrograms } from '@/hooks/use-kocca-programs';
import { KOCCA_CATEGORY_LABELS } from '@/types/kocca';
import type { KoccaCategory } from '@/types/kocca';

export function KoccaProgramList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<KoccaCategory | undefined>();

  const { data, isLoading, error } = useKoccaPrograms({
    page: currentPage,
    limit: 20,
    category: selectedCategory,
  });

  if (error) {
    return <div>오류가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">한국콘텐츠진흥원 지원사업</h2>

      {/* 카테고리 필터 */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={`px-4 py-2 border rounded ${!selectedCategory ? 'bg-blue-500 text-white' : ''}`}
        >
          전체
        </button>
        {Object.entries(KOCCA_CATEGORY_LABELS).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setSelectedCategory(code as KoccaCategory)}
            className={`px-4 py-2 border rounded ${selectedCategory === code ? 'bg-blue-500 text-white' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 사업 목록 */}
      <div className="space-y-4">
        {data?.programs.map((program) => (
          <div key={program.programId} className="p-4 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {program.category}
                </span>
                <h3 className="font-bold mt-2">{program.title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{program.organization}</p>
            <p className="text-sm mt-2">
              접수기간: {program.applicationStartDate} ~ {program.applicationEndDate}
            </p>
            <p className="text-sm">지원 대상: {program.targetAudience}</p>
            <p className="text-sm">지원 규모: {program.budgetRange}</p>
            <a
              href={program.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-block mt-2"
            >
              자세히 보기 →
            </a>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2">
            {currentPage} / {data.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(data.totalPages, p + 1))}
            disabled={currentPage === data.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6. 데이터 동기화 전략

```typescript
// lib/sync-kocca.ts

import { prisma } from '@/lib/prisma';
import { getKoccaClient } from '@/lib/kocca-client';
import type { KoccaProgram } from '@/types/kocca';

/**
 * KOCCA 데이터 동기화
 */
export async function syncKoccaPrograms() {
  const client = getKoccaClient();

  try {
    console.log('Starting KOCCA sync...');

    let pageNo = 1;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
      const result = await client.getAllPrograms({
        pageNo,
        numOfRows: 100, // 한 번에 100개씩
      });

      if (result.programs.length === 0) {
        hasMore = false;
        break;
      }

      // 데이터베이스에 저장
      for (const program of result.programs) {
        await upsertProgram(program);
        totalSynced++;
      }

      console.log(`Synced page ${pageNo}/${result.totalPages}`);

      hasMore = pageNo < result.totalPages;
      pageNo++;

      // Rate limiting (API 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`KOCCA sync completed: ${totalSynced} programs`);

    return { success: true, totalSynced };
  } catch (error) {
    console.error('KOCCA sync failed:', error);
    throw error;
  }
}

/**
 * 프로그램 데이터 업서트
 */
async function upsertProgram(program: KoccaProgram) {
  await prisma.program.upsert({
    where: {
      externalId: program.programId, // 프로그램 ID를 고유 식별자로 사용
    },
    create: {
      externalId: program.programId,
      source: 'KOCCA',
      title: program.title,
      organization: program.organization,
      category: program.category,
      targetAudience: program.targetAudience,
      description: program.description,
      budgetRange: program.budgetRange,
      applicationStartDate: parseDate(program.applicationStartDate),
      applicationEndDate: parseDate(program.applicationEndDate),
      url: program.detailUrl,
      status: 'ACTIVE',
    },
    update: {
      title: program.title,
      organization: program.organization,
      category: program.category,
      targetAudience: program.targetAudience,
      description: program.description,
      budgetRange: program.budgetRange,
      applicationStartDate: parseDate(program.applicationStartDate),
      applicationEndDate: parseDate(program.applicationEndDate),
      url: program.detailUrl,
      updatedAt: new Date(),
    },
  });
}

/**
 * 날짜 문자열 파싱 (YYYYMMDD → Date)
 */
function parseDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}
```

### 7. 환경 변수 설정

```bash
# .env.local

# 한국콘텐츠진흥원 API Key
KOCCA_API_KEY=your_kocca_api_key_here

# 기존 공공데이터 API Key
PUBLIC_DATA_API_KEY=your_public_data_api_key_here
```

### 8. Cron Job 설정

```typescript
// app/api/cron/sync-kocca/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { syncKoccaPrograms } from '@/lib/sync-kocca';

export async function GET(request: NextRequest) {
  // Vercel Cron Job 인증
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncKoccaPrograms();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.totalSynced} programs`,
    });
  } catch (error) {
    console.error('Cron job failed:', error);

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

```json
// vercel.json (다중 API와 함께 설정)
{
  "crons": [
    {
      "path": "/api/cron/sync-bizinfo",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/sync-kstartup",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/sync-kocca",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### 9. 다중 API 통합

```typescript
// lib/sync-all-programs.ts

import { syncBizinfoPrograms } from '@/lib/sync-bizinfo';
import { syncKStartupPrograms } from '@/lib/sync-kstartup';
import { syncKoccaPrograms } from '@/lib/sync-kocca';

/**
 * 모든 API 데이터 동기화
 */
export async function syncAllPrograms() {
  console.log('Starting multi-API sync...');

  const results = await Promise.allSettled([
    syncBizinfoPrograms(),
    syncKStartupPrograms(),
    syncKoccaPrograms(),
  ]);

  const bizinfoResult = results[0];
  const kstartupResult = results[1];
  const koccaResult = results[2];

  const summary = {
    bizinfo:
      bizinfoResult.status === 'fulfilled'
        ? { success: true, count: bizinfoResult.value.totalSynced }
        : { success: false, error: bizinfoResult.reason },
    kstartup:
      kstartupResult.status === 'fulfilled'
        ? { success: true, count: kstartupResult.value.totalSynced }
        : { success: false, error: kstartupResult.reason },
    kocca:
      koccaResult.status === 'fulfilled'
        ? { success: true, count: koccaResult.value.totalSynced }
        : { success: false, error: koccaResult.reason },
  };

  console.log('Multi-API sync completed:', summary);

  return summary;
}
```

### 10. 베스트 프랙티스

#### 10.1 API 호출 최적화

- 페이지당 결과 수는 10-100 권장 (최대 100)
- Rate limiting 적용 (요청 간 1초 대기)
- 캐싱 전략 사용 (Redis, React Query)

#### 10.2 데이터 품질 관리

- 중복 데이터 제거 (externalId로 upsert)
- 날짜 형식 검증 (YYYYMMDD)
- 필수 필드 존재 여부 확인

#### 10.3 카테고리 활용

- 자유공모(1): 일반 기업 대상 공개 공모
- 지정공모(2): 특정 기업 대상 지정 공모
- 모집공고(3): 참가자 모집 공고
- 종료된 사업(4): 종료된 사업 정보 (참고용)

#### 10.4 보안

- API Key는 환경 변수로 관리
- 클라이언트 사이드에서 직접 호출 금지
- API Route를 통한 프록시 패턴 사용

### 11. API 비교표

| 항목                   | 기업마당          | K-Startup               | KOCCA                          |
| ---------------------- | ----------------- | ----------------------- | ------------------------------ |
| **제공 기관**          | 중소벤처기업부    | 중소벤처기업부          | 한국콘텐츠진흥원               |
| **주요 대상**          | 중소기업 전반     | 창업 기업               | 콘텐츠 산업                    |
| **응답 형식**          | RSS, JSON         | XML, JSON               | XML, JSON                      |
| **페이지당 최대 결과** | 500개             | 100개                   | 100개                          |
| **주요 데이터**        | 정부지원사업 공고 | 창업 지원, 통계, 콘텐츠 | 콘텐츠 산업 지원사업, 금융지원 |
| **카테고리 분류**      | 8개 분야          | 4개 유형                | 4개 카테고리                   |

**추천 사용 전략**:

- **기업마당**: 일반 중소기업 대상 정부지원사업 (금융, 기술, 인력, 수출, 내수, 경영 등)
- **K-Startup**: 창업 기업 대상 지원사업 및 창업 관련 정보
- **KOCCA**: 콘텐츠 산업 (게임, 영상, 음악, 출판 등) 전문 지원사업

세 API를 함께 사용하면 산업별로 특화된 정부지원사업 정보를 제공할 수 있습니다.

---

## 다중 API 데이터 교차 노출 전략

### 1. 개요

**문제점**: 각 API의 데이터를 순차적으로 나열하면 특정 API의 지원사업만 연속으로 노출됨

- 예: 한국콘텐츠진흥원 사업 20개 → K-Startup 사업 20개 → 기업마당 사업 20개
- 결과: 사용자가 다른 API 출처의 사업을 보기 위해 여러 페이지를 넘겨야 함

**해결 방법**: 모든 API의 데이터를 등록일 기준으로 통합 정렬하여 교차적으로 노출

- 예: 기업마당 사업 → KOCCA 사업 → K-Startup 사업 → 기업마당 사업 → ...
- 결과: 한 페이지 안에서 다양한 출처의 최신 지원사업 확인 가능

### 2. 구현 전략

#### 2.1 데이터베이스 설계

```prisma
// prisma/schema.prisma

model Program {
  id              String   @id @default(uuid())

  // API 출처 구분
  source          String   // "BIZINFO" | "KSTARTUP" | "KOCCA"
  externalId      String   // API별 고유 ID

  // 공통 필드
  title           String
  summary         String?
  content         String?
  category        String?

  // 날짜 정보 (정렬 기준)
  registeredAt    DateTime // 등록일 (정렬의 핵심 필드)
  startDate       DateTime?
  endDate         DateTime?

  // 메타 정보
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([source, externalId])
  @@index([registeredAt(sort: Desc)]) // 등록일 내림차순 인덱스 (최신순)
  @@index([source, registeredAt(sort: Desc)]) // 출처별 정렬 인덱스
}
```

**핵심 포인트**:

- `registeredAt`: 모든 API의 등록일을 통일된 DateTime 형식으로 저장
- `source`: API 출처를 명시적으로 구분
- 인덱스 설계: `registeredAt` 기준 정렬 성능 최적화

#### 2.2 데이터 동기화 시 등록일 매핑

각 API의 등록일 필드를 통일된 `registeredAt`으로 매핑:

```typescript
// lib/sync-bizinfo.ts

async function syncBizinfoPrograms() {
  const programs = await bizinfoClient.getPrograms({ pageUnit: 100 });

  for (const item of programs.result) {
    await prisma.program.upsert({
      where: {
        source_externalId: {
          source: 'BIZINFO',
          externalId: item.pblancId,
        },
      },
      create: {
        source: 'BIZINFO',
        externalId: item.pblancId,
        title: item.pblancNm,
        summary: item.pblancSj,
        content: item.pblancCn,
        category: item.lclasCodeNm,

        // 등록일 매핑 (기업마당: instCd 필드 사용)
        registeredAt: parseDate(item.instReqstDe), // 신청 등록일
        startDate: parseDate(item.rcptBgnde),
        endDate: parseDate(item.rcptEndde),
      },
      update: {
        title: item.pblancNm,
        summary: item.pblancSj,
        // ... 업데이트 필드
      },
    });
  }
}

// lib/sync-kstartup.ts

async function syncKStartupPrograms() {
  const announcements = await kstartupClient.getAnnouncements({ perPage: 100 });

  for (const item of announcements.response.body.items) {
    await prisma.program.upsert({
      where: {
        source_externalId: {
          source: 'KSTARTUP',
          externalId: item.ntceNo,
        },
      },
      create: {
        source: 'KSTARTUP',
        externalId: item.ntceNo,
        title: item.ntceTtl,
        summary: item.ntceCn,
        category: item.ntceTypeCd,

        // 등록일 매핑 (K-Startup: regDt 필드 사용)
        registeredAt: parseDate(item.regDt),
        startDate: parseDate(item.aplyStartDt),
        endDate: parseDate(item.aplyEndDt),
      },
      update: {
        // ... 업데이트 필드
      },
    });
  }
}

// lib/sync-kocca.ts

async function syncKoccaPrograms() {
  const programs = await koccaClient.getPrograms({ numOfRows: 100 });

  for (const item of programs.response.body.items) {
    await prisma.program.upsert({
      where: {
        source_externalId: {
          source: 'KOCCA',
          externalId: item.bizNo,
        },
      },
      create: {
        source: 'KOCCA',
        externalId: item.bizNo,
        title: item.bizNm,
        summary: item.bizSmry,
        content: item.bizCn,
        category: item.cateNm,

        // 등록일 매핑 (KOCCA: regDt 필드 사용)
        registeredAt: parseDate(item.regDt),
        startDate: parseDate(item.rcptStartDt),
        endDate: parseDate(item.rcptEndDt),
      },
      update: {
        // ... 업데이트 필드
      },
    });
  }
}

/**
 * 날짜 문자열을 DateTime으로 변환
 * 지원 형식: YYYYMMDD, YYYY-MM-DD, ISO 8601
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  try {
    // YYYYMMDD 형식
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }

    // ISO 8601 또는 YYYY-MM-DD
    return new Date(dateStr);
  } catch (error) {
    console.error('Failed to parse date:', dateStr);
    return null;
  }
}
```

#### 2.3 교차 정렬 조회 API

```typescript
// app/api/programs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const category = searchParams.get('category') || undefined;
  const source = searchParams.get('source') || undefined;

  const skip = (page - 1) * limit;

  try {
    // 교차 정렬 조회: 등록일 기준 내림차순 (최신순)
    const programs = await prisma.program.findMany({
      where: {
        ...(category && { category }),
        ...(source && { source }),
      },
      orderBy: {
        registeredAt: 'desc', // 등록일 기준 최신순 정렬
      },
      skip,
      take: limit,
      select: {
        id: true,
        source: true,
        title: true,
        summary: true,
        category: true,
        registeredAt: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    // 전체 개수 조회
    const totalCount = await prisma.program.count({
      where: {
        ...(category && { category }),
        ...(source && { source }),
      },
    });

    // 출처별 분포 통계 (선택 사항)
    const sourceDistribution = await prisma.program.groupBy({
      by: ['source'],
      _count: {
        source: true,
      },
      where: {
        id: {
          in: programs.map(p => p.id),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: programs,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        sourceDistribution,
      },
    });
  } catch (error) {
    console.error('Failed to fetch programs:', error);

    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}
```

**조회 결과 예시**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "source": "BIZINFO",
      "title": "2024 중소기업 기술개발 지원사업",
      "registeredAt": "2024-12-01T09:00:00Z"
    },
    {
      "id": "uuid-2",
      "source": "KOCCA",
      "title": "콘텐츠 창작자 육성 프로그램",
      "registeredAt": "2024-11-30T14:30:00Z"
    },
    {
      "id": "uuid-3",
      "source": "KSTARTUP",
      "title": "예비창업패키지 모집 공고",
      "registeredAt": "2024-11-30T10:15:00Z"
    },
    {
      "id": "uuid-4",
      "source": "BIZINFO",
      "title": "글로벌 강소기업 육성사업",
      "registeredAt": "2024-11-29T16:20:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 847,
    "totalPages": 43,
    "sourceDistribution": [
      { "source": "BIZINFO", "_count": { "source": 9 } },
      { "source": "KSTARTUP", "_count": { "source": 6 } },
      { "source": "KOCCA", "_count": { "source": 5 } }
    ]
  }
}
```

#### 2.4 프론트엔드 통합 (React Query)

```typescript
// hooks/usePrograms.ts

import { useQuery } from '@tanstack/react-query';

interface ProgramsParams {
  page?: number;
  limit?: number;
  category?: string;
  source?: string;
}

export function usePrograms(params: ProgramsParams = {}) {
  return useQuery({
    queryKey: ['programs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.category) searchParams.set('category', params.category);
      if (params.source) searchParams.set('source', params.source);

      const response = await fetch(`/api/programs?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

```tsx
// components/ProgramList.tsx

import { usePrograms } from '@/hooks/usePrograms';

export function ProgramList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePrograms({ page, limit: 20 });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;

  return (
    <div>
      <div className="space-y-4">
        {data.data.map(program => (
          <div key={program.id} className="border p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {program.source}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(program.registeredAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{program.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{program.summary}</p>
          </div>
        ))}
      </div>

      {/* 출처별 분포 표시 (선택 사항) */}
      <div className="mt-4 flex gap-2 text-xs text-gray-500">
        현재 페이지:
        {data.meta.sourceDistribution.map(dist => (
          <span key={dist.source}>
            {dist.source}: {dist._count.source}개
          </span>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="px-4 py-2">
          {page} / {data.meta.totalPages}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= data.meta.totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
```

### 3. 고급 기능

#### 3.1 출처별 가중치 적용 (선택 사항)

특정 API 출처에 우선순위를 부여하여 노출 빈도 조정:

```typescript
// lib/weighted-sort.ts

interface ProgramWithWeight extends Program {
  weight: number;
}

/**
 * 가중치 기반 교차 정렬
 * - 등록일은 기본 정렬 기준 유지
 * - 동일한 날짜 내에서 출처별 가중치 적용
 */
export async function getWeightedPrograms(params: {
  page: number;
  limit: number;
  weights?: { [key: string]: number }; // 예: { BIZINFO: 1.5, KSTARTUP: 1.0, KOCCA: 1.2 }
}) {
  const { page, limit, weights = {} } = params;
  const defaultWeight = 1.0;

  // 더 많은 데이터를 가져온 후 클라이언트 사이드에서 가중치 정렬
  const programs = await prisma.program.findMany({
    orderBy: { registeredAt: 'desc' },
    take: limit * 3, // 버퍼를 위해 3배수 조회
  });

  // 가중치 점수 계산
  const scored = programs.map(program => ({
    ...program,
    score: (weights[program.source] || defaultWeight) * new Date(program.registeredAt).getTime(),
  }));

  // 점수 기반 정렬 후 페이지네이션
  const sorted = scored.sort((a, b) => b.score - a.score);
  const skip = (page - 1) * limit;
  const paginated = sorted.slice(skip, skip + limit);

  return paginated;
}
```

#### 3.2 라운드 로빈 방식 교차 노출 (선택 사항)

각 출처에서 순차적으로 1개씩 가져와 균등하게 노출:

```typescript
// lib/round-robin.ts

/**
 * 라운드 로빈 방식으로 교차 노출
 * - 각 API 출처에서 순차적으로 1개씩 선택
 * - 등록일 기준 정렬은 출처별로 적용
 */
export async function getRoundRobinPrograms(params: { page: number; limit: number }) {
  const { page, limit } = params;

  // 각 출처별로 최신순 데이터 조회
  const [bizinfo, kstartup, kocca] = await Promise.all([
    prisma.program.findMany({
      where: { source: 'BIZINFO' },
      orderBy: { registeredAt: 'desc' },
      take: Math.ceil(limit / 3) + 10,
    }),
    prisma.program.findMany({
      where: { source: 'KSTARTUP' },
      orderBy: { registeredAt: 'desc' },
      take: Math.ceil(limit / 3) + 10,
    }),
    prisma.program.findMany({
      where: { source: 'KOCCA' },
      orderBy: { registeredAt: 'desc' },
      take: Math.ceil(limit / 3) + 10,
    }),
  ]);

  // 라운드 로빈 방식으로 교차 배치
  const result: Program[] = [];
  const sources = [bizinfo, kstartup, kocca];
  const maxLength = Math.max(bizinfo.length, kstartup.length, kocca.length);

  for (let i = 0; i < maxLength && result.length < limit; i++) {
    for (const source of sources) {
      if (source[i]) {
        result.push(source[i]);
        if (result.length >= limit) break;
      }
    }
  }

  return result;
}
```

### 4. 성능 최적화

#### 4.1 데이터베이스 인덱스

```sql
-- 등록일 기준 정렬 인덱스 (최우선)
CREATE INDEX idx_programs_registered_at ON "Program"("registeredAt" DESC);

-- 출처별 정렬 인덱스
CREATE INDEX idx_programs_source_registered_at ON "Program"("source", "registeredAt" DESC);

-- 카테고리 필터링 + 정렬 인덱스
CREATE INDEX idx_programs_category_registered_at ON "Program"("category", "registeredAt" DESC);

-- 복합 인덱스 (필터링 + 정렬)
CREATE INDEX idx_programs_filters ON "Program"("source", "category", "registeredAt" DESC);
```

#### 4.2 캐싱 전략

```typescript
// lib/cache-programs.ts

import { redis } from '@/lib/redis';

const CACHE_TTL = 60 * 5; // 5분
const CACHE_KEY_PREFIX = 'programs:';

export async function getCachedPrograms(params: {
  page: number;
  limit: number;
  category?: string;
  source?: string;
}) {
  const cacheKey = `${CACHE_KEY_PREFIX}${JSON.stringify(params)}`;

  // 캐시 조회
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // DB 조회
  const programs = await prisma.program.findMany({
    where: {
      ...(params.category && { category: params.category }),
      ...(params.source && { source: params.source }),
    },
    orderBy: { registeredAt: 'desc' },
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  });

  // 캐시 저장
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(programs));

  return programs;
}
```

### 5. 베스트 프랙티스

#### 5.1 등록일 데이터 품질 관리

- 모든 API 동기화 시 `registeredAt` 필드 필수 검증
- 잘못된 날짜 형식은 현재 시간으로 대체하거나 스킵
- 로그를 통해 데이터 품질 모니터링

#### 5.2 사용자 경험 개선

- 출처 라벨을 통해 어느 API에서 온 데이터인지 명확히 표시
- 등록일을 사용자 친화적으로 표시 (예: "3일 전", "1주일 전")
- 출처별 필터링 옵션 제공 (전체 | 기업마당 | K-Startup | KOCCA)

#### 5.3 모니터링

- 출처별 데이터 동기화 성공률 추적
- 출처별 데이터 분포 모니터링 (불균형 감지)
- 등록일 기준 데이터 신선도 확인 (최신 데이터 비율)

### 6. 완료 기준

✅ 모든 API 데이터가 `registeredAt` 필드로 통일되어 저장됨
✅ 데이터베이스 인덱스가 등록일 기준 정렬에 최적화됨
✅ API 엔드포인트가 교차 정렬된 데이터를 반환함
✅ 프론트엔드에서 출처가 명확히 표시됨
✅ 페이지네이션이 정상 작동함
✅ 한 페이지 내에서 다양한 출처의 최신 지원사업이 노출됨
