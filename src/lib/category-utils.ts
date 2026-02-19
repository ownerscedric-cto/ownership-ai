/**
 * 카테고리 유틸리티 함수
 * 계층형 카테고리 처리를 위한 공통 함수들
 */

// 계층형 카테고리 타입 (API 응답 형식)
export interface HierarchicalCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  parentId: string | null;
  _count?: {
    posts: number;
    archives: number;
  };
  children?: HierarchicalCategory[];
}

// 플랫 카테고리 타입 (Select 옵션용)
export interface FlatCategory {
  id: string;
  name: string;
  displayName: string;
  parentId: string | null;
  depth: number;
}

/**
 * 계층형 카테고리를 플랫 리스트로 변환
 * 하위 카테고리는 "ㄴ " 접두사로 들여쓰기 표시
 * 계층형 데이터(children) 또는 플랫 데이터(parentId) 모두 지원
 * @param categories 카테고리 배열
 * @param depth 깊이 (재귀 호출용)
 * @returns 플랫 카테고리 배열
 */
export function flattenCategories(
  categories: HierarchicalCategory[],
  depth: number = 0
): FlatCategory[] {
  // 이미 계층형(children)인 경우 기존 로직 사용
  const hasChildren = categories.some(c => c.children && c.children.length > 0);
  if (hasChildren) {
    return flattenCategoriesHierarchical(categories, depth);
  }

  // 플랫 데이터(parentId)인 경우 계층형으로 변환 후 처리
  return flattenCategoriesFromFlat(categories);
}

/**
 * 계층형 카테고리(children)를 플랫 리스트로 변환
 * 하위 카테고리는 "ㄴ " 접두사로 들여쓰기 표시
 */
function flattenCategoriesHierarchical(
  categories: HierarchicalCategory[],
  depth: number = 0
): FlatCategory[] {
  const result: FlatCategory[] = [];

  categories.forEach(category => {
    // depth가 0이면 상위 카테고리, 1 이상이면 하위 카테고리
    const displayName = depth > 0 ? `ㄴ ${category.name}` : category.name;

    result.push({
      id: category.id,
      name: category.name,
      displayName,
      parentId: category.parentId,
      depth,
    });

    // 하위 카테고리 처리
    if (category.children && category.children.length > 0) {
      const childCategories = flattenCategoriesHierarchical(category.children, depth + 1);
      result.push(...childCategories);
    }
  });

  return result;
}

/**
 * 플랫 카테고리(parentId)를 계층 구조로 정렬하여 반환
 * 상위 카테고리 다음에 하위 카테고리가 들여쓰기와 함께 표시됨
 */
function flattenCategoriesFromFlat(categories: HierarchicalCategory[]): FlatCategory[] {
  const result: FlatCategory[] = [];
  const categoryMap = new Map<string, HierarchicalCategory>();

  // ID로 카테고리 맵 생성
  categories.forEach(cat => categoryMap.set(cat.id, cat));

  // 상위 카테고리 먼저 처리 (parentId가 null인 것들)
  const rootCategories = categories.filter(c => !c.parentId);
  const childCategories = categories.filter(c => c.parentId);

  rootCategories.forEach(category => {
    // 상위 카테고리 추가
    result.push({
      id: category.id,
      name: category.name,
      displayName: category.name,
      parentId: category.parentId,
      depth: 0,
    });

    // 해당 상위 카테고리의 하위 카테고리들 추가
    const children = childCategories.filter(c => c.parentId === category.id);
    children.forEach(child => {
      result.push({
        id: child.id,
        name: child.name,
        displayName: `ㄴ ${child.name}`,
        parentId: child.parentId,
        depth: 1,
      });
    });
  });

  // parentId가 있지만 해당 부모가 목록에 없는 경우 (orphan) 처리
  const addedIds = new Set(result.map(r => r.id));
  childCategories.forEach(child => {
    if (!addedIds.has(child.id)) {
      result.push({
        id: child.id,
        name: child.name,
        displayName: `ㄴ ${child.name}`,
        parentId: child.parentId,
        depth: 1,
      });
    }
  });

  return result;
}

/**
 * 카테고리 ID로 카테고리 찾기 (계층형 구조에서)
 * @param categories 계층형 카테고리 배열
 * @param categoryId 찾을 카테고리 ID
 * @returns 찾은 카테고리 또는 undefined
 */
export function findCategoryById(
  categories: HierarchicalCategory[],
  categoryId: string
): HierarchicalCategory | undefined {
  for (const category of categories) {
    if (category.id === categoryId) {
      return category;
    }
    if (category.children && category.children.length > 0) {
      const found = findCategoryById(category.children, categoryId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * 카테고리 ID로 표시 이름 가져오기
 * @param categories 계층형 카테고리 배열
 * @param categoryId 찾을 카테고리 ID
 * @returns 표시 이름 (대분류 > 중분류 형식)
 */
export function getCategoryDisplayName(
  categories: HierarchicalCategory[],
  categoryId: string
): string {
  const flatList = flattenCategories(categories);
  const found = flatList.find(c => c.id === categoryId);
  return found?.displayName || '';
}
