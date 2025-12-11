import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  STORAGE_BUCKETS,
  generateFileName,
  validateFileSize,
  validateFileType,
} from '@/lib/supabase/storage';

/**
 * POST /api/upload - 파일 업로드 (이미지, 첨부파일)
 * 노하우 게시글 작성 시 이미지/파일 업로드
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('type') as 'image' | 'file' | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'File is required',
          },
        },
        { status: 400 }
      );
    }

    if (!fileType || !['image', 'file'].includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'File type must be "image" or "file"',
          },
        },
        { status: 400 }
      );
    }

    // 3. 파일 타입별 검증
    if (fileType === 'image') {
      // 이미지 파일 검증
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validateFileType(file, allowedImageTypes)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: '이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP)',
            },
          },
          { status: 400 }
        );
      }

      // 이미지 크기 제한: 5MB
      if (!validateFileSize(file, 5)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: '이미지 크기는 5MB 이하여야 합니다',
            },
          },
          { status: 400 }
        );
      }
    } else if (fileType === 'file') {
      // 첨부파일 검증
      const allowedFileTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'text/plain',
      ];

      if (!validateFileType(file, allowedFileTypes)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message:
                '지원하지 않는 파일 형식입니다 (PDF, Word, Excel, PowerPoint, ZIP, TXT만 가능)',
            },
          },
          { status: 400 }
        );
      }

      // 파일 크기 제한: 10MB
      if (!validateFileSize(file, 10)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: '파일 크기는 10MB 이하여야 합니다',
            },
          },
          { status: 400 }
        );
      }
    }

    // 4. 파일 업로드
    const bucket =
      fileType === 'image' ? STORAGE_BUCKETS.KNOWHOW_IMAGES : STORAGE_BUCKETS.KNOWHOW_FILES;
    const fileName = generateFileName(file.name);
    const filePath = `${user.id}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause,
        bucket,
        filePath,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: `Failed to upload file: ${uploadError.message}`,
            details: uploadError.message,
          },
        },
        { status: 500 }
      );
    }

    // 5. Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
