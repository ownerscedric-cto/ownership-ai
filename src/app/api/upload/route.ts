import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  uploadFile,
  generateFileName,
  validateFileSize,
  validateFileType,
  STORAGE_BUCKETS,
} from '@/lib/supabase/storage';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

/**
 * POST /api/upload - 파일/이미지 업로드
 * - 노하우 게시글 첨부 파일
 * - 게시글 내 이미지 (에디터)
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

    // 2. FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'image' | 'document'

    if (!file) {
      return errorResponse(ErrorCode.VALIDATION_ERROR, '파일이 제공되지 않았습니다', null, 400);
    }

    if (!type) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '파일 타입이 제공되지 않았습니다',
        null,
        400
      );
    }

    // 3. 파일 타입 및 크기 검증
    let allowedTypes: string[] = [];
    let maxSizeMB = 0;
    let bucketName = '';

    if (type === 'image') {
      // 이미지 타입
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      maxSizeMB = 10; // 10MB
      bucketName = STORAGE_BUCKETS.RESOURCES;
    } else if (type === 'document') {
      // 문서 타입
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/zip',
        'text/plain',
      ];
      maxSizeMB = 50; // 50MB
      bucketName = STORAGE_BUCKETS.RESOURCES;
    } else {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '지원하지 않는 파일 타입입니다 (image, document만 가능)',
        null,
        400
      );
    }

    // 파일 타입 검증
    if (!validateFileType(file, allowedTypes)) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        `허용되지 않은 파일 형식입니다. 허용 형식: ${allowedTypes.join(', ')}`,
        null,
        400
      );
    }

    // 파일 크기 검증
    if (!validateFileSize(file, maxSizeMB)) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        `파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 업로드 가능합니다`,
        null,
        400
      );
    }

    // 4. 파일명 생성 (중복 방지)
    const fileName = generateFileName(file.name);

    // 5. Supabase Storage 업로드
    const uploadResult = await uploadFile(bucketName, fileName, file);

    if (!uploadResult.success || !uploadResult.url) {
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        uploadResult.error || '파일 업로드 중 오류가 발생했습니다',
        null,
        500
      );
    }

    // 6. 성공 응답
    return successResponse(
      {
        fileName,
        url: uploadResult.url,
        size: file.size,
        type: file.type,
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('File upload error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '파일 업로드 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
