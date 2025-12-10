'use client';

import { GenericCategoryManager } from './GenericCategoryManager';

/**
 * 노하우 카테고리 관리 컴포넌트
 * GenericCategoryManager를 재사용하는 wrapper 컴포넌트
 */
export function KnowHowCategoryManager() {
  return (
    <GenericCategoryManager
      apiEndpoint="/api/admin/education/knowhow-categories"
      queryKey={['admin', 'knowhow-categories']}
      maxCount={20}
      entityName="게시글"
      countFieldName="posts"
    />
  );
}
