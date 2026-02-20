import { createClient } from '@/lib/supabase/server';
import { FloatingActionButtonClient } from './FloatingActionButtonClient';

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

// 기본 연락처 정보 (DB에 설정이 없을 경우)
const DEFAULT_CONTACT_INFO = {
  phone: '',
  slogan: '', // 문의하기용 슬로건
  contacts: [] as ContactPerson[],
  homepageUrl: '',
  kakaoOpenChatUrl: '',
  company: {
    name: '',
    slogan: '', // 회사소개용 슬로건
    description: '',
    services: [] as string[],
  } as CompanyInfo,
};

export async function FloatingActionButtonWrapper() {
  const supabase = await createClient();

  // site_settings 테이블에서 연락처 및 회사 정보 가져오기
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'contact_phone',
      'contact_slogan',
      'contact_emails',
      'homepage_url',
      'kakao_openchat_url',
      'company_name',
      'company_slogan',
      'company_description',
      'company_services',
    ]);

  // 설정값을 객체로 변환
  const settingsMap = new Map<string, string>();
  settings?.forEach(s => settingsMap.set(s.key, s.value));

  // contact_emails 파싱 (기존 문자열 배열 형식 호환)
  let contacts: ContactPerson[] = DEFAULT_CONTACT_INFO.contacts;
  const contactsJson = settingsMap.get('contact_emails');
  if (contactsJson) {
    try {
      const parsed = JSON.parse(contactsJson);
      if (Array.isArray(parsed)) {
        contacts = parsed.map((item: string | ContactPerson) => {
          if (typeof item === 'string') {
            return { email: item };
          }
          return item;
        });
      }
    } catch {
      contacts = [];
    }
  }

  // company_services 파싱
  let services: string[] = DEFAULT_CONTACT_INFO.company.services;
  const servicesJson = settingsMap.get('company_services');
  if (servicesJson) {
    try {
      const parsed = JSON.parse(servicesJson);
      if (Array.isArray(parsed)) {
        services = parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      services = [];
    }
  }

  const contactInfo = {
    phone: settingsMap.get('contact_phone') || DEFAULT_CONTACT_INFO.phone,
    slogan: settingsMap.get('contact_slogan') || DEFAULT_CONTACT_INFO.slogan,
    contacts,
    homepageUrl: settingsMap.get('homepage_url') || DEFAULT_CONTACT_INFO.homepageUrl,
    kakaoOpenChatUrl:
      settingsMap.get('kakao_openchat_url') || DEFAULT_CONTACT_INFO.kakaoOpenChatUrl,
    company: {
      name: settingsMap.get('company_name') || DEFAULT_CONTACT_INFO.company.name,
      slogan: settingsMap.get('company_slogan') || DEFAULT_CONTACT_INFO.company.slogan,
      description:
        settingsMap.get('company_description') || DEFAULT_CONTACT_INFO.company.description,
      services,
    },
  };

  return <FloatingActionButtonClient contactInfo={contactInfo} />;
}
