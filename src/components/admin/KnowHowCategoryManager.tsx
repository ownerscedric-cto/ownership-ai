'use client';

import { GenericCategoryManager } from './GenericCategoryManager';

/**
 * 노하우 카테고리 관리 컴포넌트 (Wrapper)
 * GenericCategoryManager를 노하우 카테고리용으로 설정
 */
export function KnowHowCategoryManager() {
  return (
    <GenericCategoryManager
      apiEndpoint="/api/admin/education/knowhow/categories"
      queryKey={['admin', 'knowhow-categories']}
      maxCount={10}
      entityName="노하우"
      countFieldName="knowhows"
    />
  );
}
