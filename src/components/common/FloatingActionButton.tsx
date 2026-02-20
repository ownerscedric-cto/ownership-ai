'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Phone,
  Globe,
  MessageSquare,
  Mail,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

interface FloatingActionButtonProps {
  contactInfo: ContactInfo;
}

export function FloatingActionButton({ contactInfo }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // 회사 소개 정보가 있는지 확인
  const hasCompanyInfo =
    contactInfo.company &&
    (contactInfo.company.name ||
      contactInfo.company.slogan ||
      contactInfo.company.description ||
      (contactInfo.company.services && contactInfo.company.services.length > 0));

  const menuItems = [
    {
      id: 'company',
      label: '회사 소개',
      icon: Building2,
      onClick: () => {
        setIsOpen(false);
        setShowCompanyModal(true);
      },
      color: 'bg-purple-500 hover:bg-purple-600',
      disabled: !hasCompanyInfo,
    },
    {
      id: 'contact',
      label: '문의하기',
      icon: Phone,
      onClick: () => {
        setIsOpen(false);
        setShowContactModal(true);
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'homepage',
      label: '홈페이지',
      icon: Globe,
      onClick: () => {
        if (contactInfo.homepageUrl) {
          window.open(contactInfo.homepageUrl, '_blank', 'noopener,noreferrer');
        }
        setIsOpen(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600',
      disabled: !contactInfo.homepageUrl,
    },
    {
      id: 'kakao',
      label: '카카오톡 오픈채팅',
      icon: MessageSquare,
      onClick: () => {
        if (contactInfo.kakaoOpenChatUrl) {
          window.open(contactInfo.kakaoOpenChatUrl, '_blank', 'noopener,noreferrer');
        }
        setIsOpen(false);
      },
      color: 'bg-yellow-500 hover:bg-yellow-600',
      disabled: !contactInfo.kakaoOpenChatUrl,
    },
  ];

  // 활성화된 메뉴 아이템만 필터링
  const activeMenuItems = menuItems.filter(item => !item.disabled);

  return (
    <>
      {/* 플로팅 버튼 컨테이너 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* 메뉴 아이템들 */}
        <AnimatePresence>
          {isOpen && (
            <>
              {activeMenuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  {/* 라벨 */}
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                  {/* 아이콘 버튼 */}
                  <button
                    onClick={item.onClick}
                    className={`w-12 h-12 rounded-full ${item.color} text-white shadow-lg flex items-center justify-center transition-all duration-200`}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* 메인 플로팅 버튼 */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-[#0052CC] hover:bg-[#003d99] text-white shadow-lg flex items-center justify-center transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* 배경 오버레이 (메뉴 열렸을 때) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 z-40"
          />
        )}
      </AnimatePresence>

      {/* 문의하기 모달 */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">문의하기</DialogTitle>
            {/* 문의하기 슬로건 */}
            {contactInfo.slogan && (
              <p className="text-center text-base text-gray-500 mt-1">{contactInfo.slogan}</p>
            )}
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 전화번호 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">대표번호</p>
                {contactInfo.phone ? (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-lg font-semibold text-gray-900 hover:text-[#0052CC] transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                ) : (
                  <p className="text-base text-gray-500">등록된 전화번호가 없습니다</p>
                )}
              </div>
            </div>

            {/* 담당자 연락처 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">담당자</p>
                {contactInfo.contacts && contactInfo.contacts.length > 0 ? (
                  <div className="space-y-3">
                    {contactInfo.contacts.map((contact, index) => (
                      <div key={index} className="space-y-0.5">
                        {/* 이름과 직급 */}
                        {(contact.name || contact.position) && (
                          <p className="text-base text-gray-700">
                            {contact.name && <span className="font-semibold">{contact.name}</span>}
                            {contact.name && contact.position && ' '}
                            {contact.position && (
                              <span className="text-gray-500">{contact.position}</span>
                            )}
                          </p>
                        )}
                        {/* 이메일 */}
                        <a
                          href={`mailto:${contact.email}`}
                          className="block text-base font-medium text-gray-900 hover:text-[#0052CC] transition-colors"
                        >
                          {contact.email}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-gray-500">등록된 담당자가 없습니다</p>
                )}
              </div>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setShowContactModal(false)} className="px-8">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 회사 소개 모달 (옵션 2) */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {contactInfo.company?.name || '회사 소개'}
            </DialogTitle>
            {contactInfo.company?.slogan && (
              <p className="text-center text-base text-[#0052CC] font-medium mt-1">
                {contactInfo.company.slogan}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 회사 소개 문구 */}
            {contactInfo.company?.description && (
              <div
                className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contactInfo.company.description }}
              />
            )}

            {/* 주요 서비스 */}
            {contactInfo.company?.services && contactInfo.company.services.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">주요 서비스</p>
                <ul className="space-y-2">
                  {contactInfo.company.services.map((service, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#0052CC] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCompanyModal(false)} className="px-6">
              닫기
            </Button>
            <Button
              onClick={() => {
                setShowCompanyModal(false);
                setShowContactModal(true);
              }}
              className="px-6 bg-[#0052CC] hover:bg-[#003d99]"
            >
              문의하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
