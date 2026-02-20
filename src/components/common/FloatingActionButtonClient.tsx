'use client';

import { usePathname } from 'next/navigation';
import { FloatingActionButton } from './FloatingActionButton';

interface ContactPerson {
  name?: string;
  position?: string;
  email: string;
}

interface CompanyInfo {
  name: string;
  slogan: string;
  description: string;
  services: string[];
}

interface ContactInfo {
  phone: string;
  slogan: string; // 문의하기용 슬로건
  contacts: ContactPerson[];
  homepageUrl: string;
  kakaoOpenChatUrl: string;
  company?: CompanyInfo;
}

interface FloatingActionButtonClientProps {
  contactInfo: ContactInfo;
}

// FAB를 표시하지 않을 경로 패턴
const EXCLUDED_PATHS = [
  '/admin', // 관리자 페이지
  '/auth', // 인증 페이지
];

export function FloatingActionButtonClient({ contactInfo }: FloatingActionButtonClientProps) {
  const pathname = usePathname();

  // 제외 경로에 해당하면 렌더링하지 않음
  const shouldHide = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));

  if (shouldHide) {
    return null;
  }

  // 회사 소개 정보가 있는지 확인
  const hasCompanyInfo =
    contactInfo.company &&
    (contactInfo.company.name ||
      contactInfo.company.slogan ||
      contactInfo.company.description ||
      (contactInfo.company.services && contactInfo.company.services.length > 0));

  // 설정이 하나도 없으면 렌더링하지 않음
  const hasAnySettings =
    contactInfo.phone ||
    (contactInfo.contacts && contactInfo.contacts.length > 0) ||
    contactInfo.homepageUrl ||
    contactInfo.kakaoOpenChatUrl ||
    hasCompanyInfo;

  if (!hasAnySettings) {
    return null;
  }

  return <FloatingActionButton contactInfo={contactInfo} />;
}
