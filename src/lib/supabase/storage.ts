/**
 * Supabase Storage 유틸리티
 * - 파일 업로드/다운로드
 * - Storage 버킷 관리
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Storage 버킷 이름
 */
export const STORAGE_BUCKETS = {
  EDUCATION_VIDEOS: 'education-videos',
  RESOURCES: 'resources',
  KNOWHOW_IMAGES: 'knowhow-images', // 노하우 게시글 이미지
  KNOWHOW_FILES: 'knowhow-files', // 노하우 게시글 첨부파일
} as const;

/**
 * 파일 업로드
 */
export async function uploadFile(
  bucketName: string,
  path: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 파일 업로드
    const { data, error } = await supabase.storage.from(bucketName).upload(path, file, {
      cacheControl: '3600',
      upsert: false, // 덮어쓰기 방지
    });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload file error:', error);
    return { success: false, error: '파일 업로드 중 오류가 발생했습니다' };
  }
}

/**
 * 파일 다운로드 URL 생성
 */
export async function getDownloadUrl(
  bucketName: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Get download URL error:', error);
    return { success: false, error: '다운로드 URL 생성 중 오류가 발생했습니다' };
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(
  bucketName: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage.from(bucketName).remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    return { success: false, error: '파일 삭제 중 오류가 발생했습니다' };
  }
}

/**
 * 파일 이름 생성 (중복 방지)
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

  // 파일명 sanitize (특수문자 제거, 공백 → 언더스코어)
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣]/g, '_');

  return `${sanitized}_${timestamp}_${random}.${extension}`;
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 파일 타입 검증
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}
