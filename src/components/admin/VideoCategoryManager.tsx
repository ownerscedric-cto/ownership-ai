'use client';

import { GenericCategoryManager } from './GenericCategoryManager';

/**
 * 비디오 카테고리 관리 컴포넌트 (Wrapper)
 * GenericCategoryManager를 비디오 카테고리용으로 설정
 */
export function VideoCategoryManager() {
  return (
    <GenericCategoryManager
      apiEndpoint="/api/admin/education/categories"
      queryKey={['admin', 'video-categories']}
      entityName="비디오"
      countFieldName="videos"
    />
  );
}
