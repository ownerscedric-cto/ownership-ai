import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCustomerSchema } from '@/lib/validations/customer';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';
import * as XLSX from 'xlsx';

// 엑셀 행 에러 타입
interface RowError {
  row: number;
  field: string;
  message: string;
}

// 엑셀 데이터 파싱 결과 타입
interface ParsedCustomerData {
  businessNumber: string;
  businessType: string;
  corporateNumber?: string | null;
  name: string;
  industry?: string;
  companySize?: string;
  location?: string;
  budget?: number;
  challenges?: string[];
  goals?: string[];
  preferredKeywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

/**
 * 배열 필드 파싱 (쉼표로 구분된 문자열 → 배열)
 */
function parseArrayField(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return trimmed
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 숫자 필드 파싱
 */
function parseNumberField(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * 문자열 필드 파싱 (빈 문자열 처리)
 */
function parseStringField(value: unknown): string | undefined {
  if (!value) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
}

/**
 * POST /api/customers/bulk
 * 엑셀 파일 업로드로 고객 데이터 일괄 등록
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. FormData로 파일 받기
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse(ErrorCode.INVALID_INPUT, '업로드할 파일을 선택해주세요', null, 400);
    }

    // 3. 파일 확장자 검증
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return errorResponse(
        ErrorCode.INVALID_INPUT,
        '엑셀 파일(.xlsx 또는 .xls)만 업로드 가능합니다',
        null,
        400
      );
    }

    // 4. 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. xlsx로 파일 파싱
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 6. 시트 데이터를 JSON으로 변환 (헤더 행은 1번째 행)
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });

    // 7. 헤더 행 제거 (첫 2개 행: 헤더 + 안내)
    const dataRows = rawData.slice(2);

    if (dataRows.length === 0) {
      return errorResponse(ErrorCode.INVALID_INPUT, '업로드할 데이터가 없습니다', null, 400);
    }

    // 8. 각 행 데이터 파싱 및 검증
    const parsedCustomers: ParsedCustomerData[] = [];
    const errors: RowError[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 3; // 실제 엑셀 행 번호 (헤더 2개 + 0-based index)

      // 빈 행 스킵
      if (!row || row.length === 0 || !row[0]) {
        continue;
      }

      try {
        // 행 데이터 추출 (템플릿 순서대로)
        const customerData: ParsedCustomerData = {
          businessNumber: String(row[0] || '').trim(),
          businessType: String(row[1] || '').trim(),
          corporateNumber: parseStringField(row[2]) || null,
          name: String(row[3] || '').trim(),
          industry: parseStringField(row[4]),
          companySize: parseStringField(row[5]),
          location: parseStringField(row[6]),
          budget: parseNumberField(row[7]),
          challenges: parseArrayField(row[8]),
          goals: parseArrayField(row[9]),
          preferredKeywords: parseArrayField(row[10]),
          contactEmail: parseStringField(row[11]),
          contactPhone: parseStringField(row[12]),
          notes: parseStringField(row[13]),
        };

        // Zod 검증
        createCustomerSchema.parse(customerData);

        parsedCustomers.push(customerData);
      } catch (error) {
        if (error instanceof ZodError) {
          // Zod 검증 에러를 RowError로 변환
          error.issues.forEach(issue => {
            errors.push({
              row: rowNumber,
              field: issue.path.join('.') || 'unknown',
              message: issue.message,
            });
          });
        } else {
          errors.push({
            row: rowNumber,
            field: 'unknown',
            message: error instanceof Error ? error.message : '알 수 없는 오류',
          });
        }
      }
    }

    // 9. 업로드 파일 내 중복 체크 (businessNumber)
    const businessNumbers = new Set<string>();
    const duplicatesInFile: number[] = [];

    parsedCustomers.forEach((customer, index) => {
      if (businessNumbers.has(customer.businessNumber)) {
        duplicatesInFile.push(index);
        errors.push({
          row: index + 3,
          field: 'businessNumber',
          message: '업로드 파일 내에 중복된 사업자등록번호가 있습니다',
        });
      } else {
        businessNumbers.add(customer.businessNumber);
      }
    });

    // 중복된 행 제거
    const uniqueCustomers = parsedCustomers.filter((_, index) => !duplicatesInFile.includes(index));

    // 10. 기존 DB 중복 체크
    if (uniqueCustomers.length > 0) {
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('businessNumber')
        .in('businessNumber', uniqueCustomers.map(c => c.businessNumber));

      const existingBusinessNumbers = new Set((existingCustomers || []).map((c: { businessNumber: string }) => c.businessNumber));

      const duplicatesInDB: number[] = [];
      uniqueCustomers.forEach((customer, index) => {
        if (existingBusinessNumbers.has(customer.businessNumber)) {
          duplicatesInDB.push(index);
          // 원래 행 번호 찾기
          const originalIndex = parsedCustomers.findIndex(
            c => c.businessNumber === customer.businessNumber
          );
          errors.push({
            row: originalIndex + 3,
            field: 'businessNumber',
            message: '이미 등록된 사업자등록번호입니다',
          });
        }
      });

      // DB 중복 제거
      const validCustomers = uniqueCustomers.filter((_, index) => !duplicatesInDB.includes(index));

      // 11. Supabase로 일괄 생성
      let successCount = 0;
      if (validCustomers.length > 0) {
        const customersToInsert = validCustomers.map(customer => ({
          userId: user.id,
          ...customer,
        }));

        const { data: created, error: insertError } = await supabase
          .from('customers')
          .insert(customersToInsert)
          .select();

        if (insertError) {
          console.error('Bulk insert error:', insertError);
          return errorResponse(
            ErrorCode.DATABASE_ERROR,
            '데이터 저장 중 오류가 발생했습니다',
            insertError.message,
            500
          );
        }

        successCount = created?.length || 0;
      }

      // 12. 성공/실패 통계 반환
      return successResponse(
        {
          total: dataRows.filter(row => row && row.length > 0 && row[0]).length,
          success: successCount,
          failed: errors.length,
          errors: errors.sort((a, b) => a.row - b.row), // 행 번호 순 정렬
        },
        undefined,
        201
      );
    }

    // 모든 데이터가 중복이거나 검증 실패한 경우
    return successResponse(
      {
        total: dataRows.filter(row => row && row.length > 0 && row[0]).length,
        success: 0,
        failed: errors.length,
        errors: errors.sort((a, b) => a.row - b.row),
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('엑셀 업로드 오류:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '파일 처리 중 오류가 발생했습니다',
      error instanceof Error ? error.message : '알 수 없는 오류',
      500
    );
  }
}
