'use client';

import { GenericCategoryManager } from './GenericCategoryManager';

/**
 * 자료실 카테고리 관리 컴포넌트 (Wrapper)
 * GenericCategoryManager를 자료실 카테고리용으로 설정
 */
export function ResourceCategoryManager() {
  return (
    <GenericCategoryManager
      apiEndpoint="/api/admin/education/resource-categories"
      queryKey={['admin', 'resource-categories']}
      maxCount={20}
      entityName="자료"
      countFieldName="resources"
    />
  );
}
