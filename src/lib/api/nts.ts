/**
 * 국세청 사업자등록정보 진위확인 API
 * 공공데이터포털: https://www.data.go.kr/
 * API 명세: 국세청_사업자등록정보 진위확인 및 상태조회 서비스
 */

/**
 * 국세청 API 응답 타입
 */
export interface NtsBusinessStatusResponse {
  status_code: string; // "OK" | "ERROR"
  request_cnt: number; // 요청 건수
  match_cnt: number; // 매칭 건수
  data: NtsBusinessData[];
}

/**
 * 사업자 정보 데이터
 */
export interface NtsBusinessData {
  b_no: string; // 사업자등록번호
  b_stt: string; // 사업자 상태 (예: "계속사업자", "휴업자", "폐업자")
  b_stt_cd: string; // 사업자 상태 코드 ("01": 계속사업자, "02": 휴업자, "03": 폐업자)
  tax_type: string; // 과세 유형 (예: "부가가치세 일반과세자")
  tax_type_cd: string; // 과세 유형 코드
  end_dt: string; // 폐업일 (YYYYMMDD, 없으면 빈 문자열)
  utcc_yn: string; // 단위과세 적용 사업자 여부 ("Y" | "N")
  tax_type_change_dt: string; // 과세 유형 전환일자
  invoice_apply_dt: string; // 전자세금계산서 적용일자
  rbf_tax_type: string; // 직전 과세 유형
  rbf_tax_type_cd: string; // 직전 과세 유형 코드
}

/**
 * 사업자 상태 조회 결과 (프론트엔드용 간소화된 타입)
 */
export interface BusinessStatus {
  businessNumber: string; // 사업자등록번호
  isValid: boolean; // 유효한 사업자 여부
  status: string; // 사업자 상태 ("계속사업자" | "휴업자" | "폐업자" | "알 수 없음")
  statusCode: string; // 사업자 상태 코드
  taxType: string; // 과세 유형
  endDate?: string; // 폐업일 (있는 경우)
  rawData?: NtsBusinessData; // 원본 데이터 (디버깅용)
}

/**
 * API 에러 타입
 */
export class NtsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NtsApiError';
  }
}

/**
 * 사업자등록번호 유효성 검증
 * 10자리 숫자인지 확인
 */
export function validateBusinessNumber(businessNumber: string): boolean {
  const cleaned = businessNumber.replace(/[-\s]/g, '');
  return /^\d{10}$/.test(cleaned);
}

/**
 * 사업자등록번호 포맷팅
 * "1234567890" → "123-45-67890"
 */
export function formatBusinessNumber(businessNumber: string): string {
  const cleaned = businessNumber.replace(/[-\s]/g, '');
  if (cleaned.length !== 10) return businessNumber;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

/**
 * 국세청 API로 사업자등록번호 진위 확인
 * @param businessNumbers 사업자등록번호 배열 (최대 100개)
 * @returns 사업자 상태 정보 배열
 */
export async function verifyBusinessRegistration(
  businessNumbers: string[]
): Promise<BusinessStatus[]> {
  // 1. 환경 변수에서 API 키 가져오기
  const apiKey = process.env.PUBLIC_DATA_API_KEY;

  if (!apiKey) {
    throw new NtsApiError('API 키가 설정되지 않았습니다', 'MISSING_API_KEY', {
      hint: 'PUBLIC_DATA_API_KEY 환경 변수를 확인해주세요',
    });
  }

  // 2. 입력 검증
  if (!businessNumbers || businessNumbers.length === 0) {
    throw new NtsApiError('사업자등록번호를 입력해주세요', 'INVALID_INPUT', { businessNumbers });
  }

  if (businessNumbers.length > 100) {
    throw new NtsApiError(
      '한 번에 최대 100개의 사업자등록번호만 조회할 수 있습니다',
      'TOO_MANY_REQUESTS',
      { count: businessNumbers.length }
    );
  }

  // 3. 사업자등록번호 유효성 검증 및 정제
  const cleanedNumbers = businessNumbers.map(num => num.replace(/[-\s]/g, ''));

  const invalidNumbers = cleanedNumbers.filter(num => !/^\d{10}$/.test(num));
  if (invalidNumbers.length > 0) {
    throw new NtsApiError(
      '유효하지 않은 사업자등록번호가 포함되어 있습니다',
      'INVALID_BUSINESS_NUMBER',
      { invalidNumbers }
    );
  }

  // 4. API 요청
  const apiUrl = 'http://api.odcloud.kr/api/nts-businessman/v1/status';

  try {
    const response = await fetch(`${apiUrl}?serviceKey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        b_no: cleanedNumbers,
      }),
    });

    // 5. HTTP 에러 처리
    if (!response.ok) {
      const errorText = await response.text();
      throw new NtsApiError(
        `국세청 API 요청 실패: ${response.status} ${response.statusText}`,
        'API_REQUEST_FAILED',
        { status: response.status, statusText: response.statusText, body: errorText }
      );
    }

    // 6. 응답 파싱
    const data: NtsBusinessStatusResponse = await response.json();

    // 7. API 에러 응답 처리
    if (data.status_code !== 'OK') {
      throw new NtsApiError('국세청 API에서 에러를 반환했습니다', 'API_ERROR_RESPONSE', {
        status_code: data.status_code,
        data,
      });
    }

    // 8. 응답 데이터 변환
    const results: BusinessStatus[] = cleanedNumbers.map(businessNumber => {
      const businessData = data.data.find(item => item.b_no === businessNumber);

      if (!businessData) {
        return {
          businessNumber,
          isValid: false,
          status: '알 수 없음',
          statusCode: '00',
          taxType: '알 수 없음',
        };
      }

      return {
        businessNumber,
        isValid: businessData.b_stt_cd === '01', // "01": 계속사업자
        status: businessData.b_stt || '알 수 없음',
        statusCode: businessData.b_stt_cd || '00',
        taxType: businessData.tax_type || '알 수 없음',
        endDate: businessData.end_dt || undefined,
        rawData: businessData,
      };
    });

    return results;
  } catch (error) {
    // NtsApiError는 그대로 전달
    if (error instanceof NtsApiError) {
      throw error;
    }

    // 네트워크 에러 등 기타 에러 처리
    throw new NtsApiError('사업자 정보 조회 중 오류가 발생했습니다', 'UNKNOWN_ERROR', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 단일 사업자등록번호 조회 (편의 함수)
 * @param businessNumber 사업자등록번호
 * @returns 사업자 상태 정보
 */
export async function verifySingleBusiness(businessNumber: string): Promise<BusinessStatus> {
  const results = await verifyBusinessRegistration([businessNumber]);
  return results[0];
}
