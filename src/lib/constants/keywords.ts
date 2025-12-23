/**
 * 고객 키워드 상수
 * - 정부지원사업 데이터 분석 기반으로 선정
 * - 관리자 페이지에서 수정 가능 (추후 DB 기반으로 전환 가능)
 */

// 도전과제 키워드 - 고객이 겪고 있는 어려움
export const CHALLENGE_KEYWORDS = [
  '자금 부족',
  '인력 부족',
  '마케팅 역량 부족',
  '기술 개발 어려움',
  '생산성 향상 필요',
  '품질 관리 어려움',
  '디지털 전환 필요',
  '해외 진출 어려움',
  '판로 개척 어려움',
  '시설/공간 부족',
  '브랜드 인지도 부족',
  '경쟁력 약화',
  '신제품 개발 어려움',
  '경영 노하우 부족',
  '네트워크 부족',
  '투자 유치 어려움',
  '사업화 역량 부족',
  '인허가/규제 대응',
] as const;

// 목표 키워드 - 고객이 달성하고 싶은 것
export const GOAL_KEYWORDS = [
  '매출 증대',
  '수출 확대',
  '해외 진출',
  '글로벌 시장 진입',
  '신규 시장 개척',
  '사업 확장',
  '기술 개발',
  'R&D 투자',
  '디지털 전환',
  '생산성 향상',
  '품질 향상',
  '브랜드 강화',
  '인력 양성',
  '자금 확보',
  '시설 확충',
  '투자 유치',
  '사업 안정화',
] as const;

// 선호 지원 유형 키워드 - 원하는 지원 형태
export const SUPPORT_KEYWORDS = [
  // 자금 지원
  '융자',
  '보조금',
  '정책자금',
  '투자 연계',
  // 컨설팅/교육
  '멘토링',
  '컨설팅',
  '창업교육',
  '경영 자문',
  // 시설/공간
  '시설 지원',
  '공간 지원',
  '창업보육센터',
  '입주 지원',
  // 사업화/판로
  '사업화 지원',
  '마케팅 지원',
  '판로 개척',
  '해외 진출 지원',
  '전시회/박람회',
  'IR',
  '투자 매칭',
  // 기타
  '기술 개발 지원',
  'R&D 지원',
  '인력 지원',
  '네트워킹',
  '액셀러레이팅',
] as const;

// 전체 키워드 (카테고리 정보 포함)
export const CUSTOMER_KEYWORDS = {
  challenges: {
    label: '도전과제',
    description: '현재 겪고 있는 어려움을 선택해주세요',
    keywords: CHALLENGE_KEYWORDS,
  },
  goals: {
    label: '목표',
    description: '달성하고 싶은 목표를 선택해주세요',
    keywords: GOAL_KEYWORDS,
  },
  supports: {
    label: '원하는 지원',
    description: '필요한 지원 유형을 선택해주세요',
    keywords: SUPPORT_KEYWORDS,
  },
} as const;

// 모든 키워드 플랫 배열 (검증용)
export const ALL_KEYWORDS = [...CHALLENGE_KEYWORDS, ...GOAL_KEYWORDS, ...SUPPORT_KEYWORDS] as const;

// 타입 정의
export type ChallengeKeyword = (typeof CHALLENGE_KEYWORDS)[number];
export type GoalKeyword = (typeof GOAL_KEYWORDS)[number];
export type SupportKeyword = (typeof SUPPORT_KEYWORDS)[number];
export type CustomerKeyword = (typeof ALL_KEYWORDS)[number];
