/**
 * @file ProgramRoadmap.tsx
 * @description 정부지원사업 연간 로드맵 컴포넌트 (모달 형식)
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Award, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type RoadmapTab = 'grants' | 'programs' | 'certifications';

interface ProgramItem {
  name: string;
  amount: string;
  target: string;
  selfFund: string;
}

interface MonthData {
  month: string;
  programs: ProgramItem[];
}

/**
 * 무상지원금 로드맵 데이터
 */
const grantsRoadmap: MonthData[] = [
  {
    month: '1월',
    programs: [
      { name: '생애최초 창업', amount: '7천만원', target: '만29세 이하, 예비창업', selfFund: '-' },
      {
        name: '청년창업사관학교',
        amount: '1억',
        target: '만39세 이하, 예비·초기창업',
        selfFund: '-',
      },
      { name: '공공기술 창업', amount: '7천만원', target: '만39세 이하, 예비창업', selfFund: '-' },
      { name: '창업패키지', amount: '1억', target: '예비·초기창업', selfFund: '-' },
      { name: '창업도약패키지 (대기업협업)', amount: '2억', target: '업력 3~7년', selfFund: '-' },
      { name: '창업중심대학', amount: '1억', target: '예비·초기창업', selfFund: '-' },
      { name: '글로벌창업사관학교', amount: '1.5억', target: '7년 이내', selfFund: '-' },
      { name: '재도전 성공패키지', amount: '1억', target: '예비·초기창업', selfFund: '-' },
      { name: '수출바우처 (중기부)', amount: '3천~1억', target: '-', selfFund: '30~50%' },
      { name: '선도형 스마트공장', amount: '0.5억~2억', target: '-', selfFund: '50%' },
    ],
  },
  {
    month: '2월',
    programs: [
      { name: '신사업창업사관학교', amount: '4천만원', target: '예비창업', selfFund: '-' },
      { name: '강한소상공인 Ⅰ 로컬브랜드', amount: '1억 (6천+4천)', target: '-', selfFund: '-' },
      { name: '강한소상공인 Ⅱ 온라인셀러', amount: '5천만원', target: '-', selfFund: '-' },
      {
        name: '희망리턴패키지 1차',
        amount: '경영개선 4천 / 재창업 4,400',
        target: '-',
        selfFund: '국비50%, 현물600만원',
      },
      { name: '로컬크리에이터', amount: '5천만원', target: '-', selfFund: '1천만원' },
      { name: '창업도약패키지', amount: '2~3억', target: '업력 3~7년', selfFund: '-' },
      { name: '관광기업 혁신바우처', amount: '2천~1억', target: '-', selfFund: '-' },
      {
        name: '스마트제조 소상공인',
        amount: '4,200만원',
        target: '제조·가공·물류 DX전환',
        selfFund: '30%',
      },
      { name: '디딤돌(R&D) 1차', amount: '상세 참조', target: '7년 이내', selfFund: '트랙별 상이' },
      {
        name: '스마트공장',
        amount: '과제당 1억, 최대 7억',
        target: '신규 or 고도화',
        selfFund: '30%',
      },
      {
        name: '데이터바우처',
        amount: '구매 500 / 일반 3,200 / AI 5,400',
        target: '-',
        selfFund: '-',
      },
      { name: '판로개척 소상공인', amount: '2천만원', target: '-', selfFund: '20%' },
    ],
  },
  {
    month: '3월',
    programs: [
      {
        name: '청년식품창업패키지',
        amount: '900만원',
        target: '만39세 이하, 예비창업',
        selfFund: '-',
      },
      { name: '강한소상공인 Ⅲ 글로벌유형', amount: '1억 (6천+4천)', target: '-', selfFund: '-' },
      { name: '팁스 (TIPS)', amount: '5천~5억', target: '-', selfFund: '30% (현금10%)' },
      { name: '프리팁스 시드트랙', amount: '5천만원', target: '0~3년', selfFund: '-' },
      { name: '프리팁스 지역트랙', amount: '1억', target: '1~3년', selfFund: '-' },
      { name: '포스트팁스', amount: '5억', target: '7년 이내', selfFund: '-' },
      { name: 'O2O플랫폼 소상공인', amount: '50만원', target: '-', selfFund: '-' },
      { name: '혁신(제조)바우처 2차', amount: '5천만원', target: '-', selfFund: '15~60%' },
      { name: '클라우드바우처', amount: '일반 1,550 / 집중 5,000', target: '-', selfFund: '20%' },
    ],
  },
  {
    month: '4월',
    programs: [
      {
        name: '희망리턴패키지 2차',
        amount: '경영개선 4천 / 재창업 4,400',
        target: '-',
        selfFund: '국비50%, 현물600만원',
      },
      { name: '스마트상점', amount: '500~1천만원', target: '소상공인', selfFund: '20~50%' },
      { name: '수출바우처 (중기부)', amount: '3천~1억', target: '-', selfFund: '30~50%' },
    ],
  },
  {
    month: '5월',
    programs: [
      { name: '디딤돌(R&D) 2차', amount: '상세 참조', target: '7년 이내', selfFund: '트랙별 상이' },
      { name: '해외규격인증획득 지원', amount: '-', target: '중소벤처기업부', selfFund: '-' },
    ],
  },
  {
    month: '6월',
    programs: [
      { name: '팁스 (TIPS)', amount: '5천~5억', target: '-', selfFund: '30% (현금10%)' },
      { name: '프리팁스 시드트랙', amount: '5천만원', target: '0~3년', selfFund: '-' },
      { name: '프리팁스 지역트랙', amount: '1억', target: '1~3년', selfFund: '-' },
      { name: '포스트팁스', amount: '5억', target: '7년 이내', selfFund: '-' },
    ],
  },
  {
    month: '7월',
    programs: [
      {
        name: '혁신형 중소기업 방송광고 2차',
        amount: 'TV 4,500만(50%) / 라디오 300만(70%)',
        target: '메인비즈 기업',
        selfFund: '-',
      },
    ],
  },
  {
    month: '8월',
    programs: [
      { name: '디딤돌(R&D) 3차', amount: '상세 참조', target: '7년 이내', selfFund: '트랙별 상이' },
      { name: '해외규격인증획득 지원', amount: '-', target: '중소벤처기업부', selfFund: '-' },
    ],
  },
  {
    month: '9~10월',
    programs: [],
  },
  {
    month: '11월',
    programs: [
      { name: '혁신(제조)바우처 1차', amount: '5천만원', target: '-', selfFund: '15~60%' },
    ],
  },
  {
    month: '12월',
    programs: [
      { name: '수출바우처 (산업부) 1차', amount: '3천~1억', target: '-', selfFund: '30~50%' },
    ],
  },
  {
    month: '연중 상시',
    programs: [
      { name: 'HACCP', amount: '-', target: '식육가공·포장처리업, 매출5억 이하', selfFund: '-' },
      {
        name: '기술보호 지원사업 (기술임치)',
        amount: '500만원',
        target: '기업당 3건',
        selfFund: '-',
      },
      { name: '판로개척 마케팅 / 라이브커머스', amount: '-', target: '-', selfFund: '-' },
      { name: '국내외 박람회', amount: '-', target: '-', selfFund: '-' },
      { name: '지자체 창업사업화 지원금', amount: '-', target: '지자체별 상이', selfFund: '-' },
      { name: '지재권(특허) IP나래 / IP바로지원', amount: '-', target: '-', selfFund: '-' },
      { name: '국내외 인증 (ISO 등)', amount: '-', target: '-', selfFund: '-' },
    ],
  },
];

/**
 * 디딤돌 R&D 상세 정보
 */
const didimDolDetails = [
  { track: '창업성장기술개발', amount: '1.2억', period: '1년', govRatio: '80%', selfFund: '20%' },
  { track: '수출', amount: '20억', period: '4년', govRatio: '65%', selfFund: '35%' },
  { track: '시장확대', amount: '6억', period: '2년', govRatio: '75%', selfFund: '25%' },
  { track: '시장대응', amount: '5억', period: '2년', govRatio: '75%', selfFund: '25%' },
];

/**
 * 기업인증 데이터
 */
const certifications = [
  {
    name: '기업부설 연구전담부서 / 연구소',
    benefits: ['인력 1명당 2,500만원 세액공제', 'R&D 지원자격 부여'],
    target: '-',
  },
  {
    name: '벤처기업 (벤처인증)',
    benefits: ['법인설립 3년 미만 시 5년간 법인세 50% 감면', '사옥 설립 시 취등록세 75% 감면'],
    target: '-',
  },
  {
    name: '기술혁신형 기업 (이노비즈)',
    benefits: ['사옥 취득세 중과세 감면', '법인세 10% 공제', '대출금리 우대', '정기세무조사 유예'],
    target: '업력 3년 이상, 제조업/건설업/소프트웨어업 등',
  },
  {
    name: '경영혁신형 기업 (메인비즈)',
    benefits: [
      '세무조사 유예 (수도권 2년, 지방 3년)',
      '대출금리 우대',
      '보증한도 확대',
      '정책자금 가점',
    ],
    target: '업력 3년 이상, 경영혁신 역량 우수기업',
  },
];

export function ProgramRoadmap() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RoadmapTab>('grants');
  const [selectedMonth, setSelectedMonth] = useState(0);

  const currentMonthData = grantsRoadmap[selectedMonth];

  const handlePrevMonth = () => {
    setSelectedMonth(prev => (prev > 0 ? prev - 1 : grantsRoadmap.length - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => (prev < grantsRoadmap.length - 1 ? prev + 1 : 0));
  };

  const tabs = [
    { id: 'grants' as const, label: '무상지원금', icon: Award },
    { id: 'programs' as const, label: '정부지원사업', icon: Calendar },
    { id: 'certifications' as const, label: '기업인증', icon: Building2 },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-white hover:bg-blue-50 border-[#0052CC]/20 hover:border-[#0052CC] transition-colors"
        >
          <Calendar className="w-5 h-5 text-[#0052CC]" />
          <span className="font-medium text-gray-900">주요 지원사업 연간 일정 (로드맵)</span>
          <Badge variant="secondary" className="ml-auto">
            월별 일정 보기
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#0052CC] to-[#003d99]">
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            주요 지원사업 연간 일정 (로드맵)
          </DialogTitle>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex border-b bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-[#0052CC] border-b-2 border-[#0052CC] bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 영역 (스크롤 가능) */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* 무상지원금 탭 */}
          {activeTab === 'grants' && (
            <div className="p-6">
              {/* 월 선택 */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#0052CC]">{currentMonthData.month}</span>
                  <Badge variant="secondary">{currentMonthData.programs.length}개 사업</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* 월 네비게이션 (가로 스크롤, 가운데 정렬) */}
              <div className="flex justify-center gap-1 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                {grantsRoadmap.map((data, index) => (
                  <button
                    key={data.month}
                    onClick={() => setSelectedMonth(index)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                      selectedMonth === index
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {data.month}
                  </button>
                ))}
              </div>

              {/* 사업 목록 */}
              {currentMonthData.programs.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b sticky top-0 bg-white text-center">
                    <div className="col-span-4">사업명</div>
                    <div className="col-span-3">지원금액</div>
                    <div className="col-span-3">대상/조건</div>
                    <div className="col-span-2">자부담</div>
                  </div>
                  {currentMonthData.programs.map((program, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors text-center"
                    >
                      <div className="col-span-4 font-medium text-gray-900">{program.name}</div>
                      <div className="col-span-3 text-[#0052CC] font-semibold">
                        {program.amount}
                      </div>
                      <div className="col-span-3 text-gray-600 text-xs">{program.target}</div>
                      <div className="col-span-2 text-gray-500 text-xs">{program.selfFund}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  별도 신규 공고 없음 (연중사업 계속 진행)
                </div>
              )}

              {/* 디딤돌 R&D 상세 (2, 5, 8월에만 표시) */}
              {['2월', '5월', '8월'].includes(currentMonthData.month) && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    디딤돌(R&D) 상세 (업력 7년 이내)
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 pb-2 border-b border-blue-200">
                    <div>트랙</div>
                    <div>지원금액</div>
                    <div>지원기간</div>
                    <div>정부출연</div>
                    <div>자부담</div>
                  </div>
                  {didimDolDetails.map((detail, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-5 gap-2 text-sm py-2 border-b border-blue-100"
                    >
                      <div className="font-medium">{detail.track}</div>
                      <div className="text-[#0052CC]">{detail.amount}</div>
                      <div>{detail.period}</div>
                      <div>{detail.govRatio}</div>
                      <div>{detail.selfFund}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 자부담 기준 */}
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">기업 자부담 기준</h3>
                <div className="text-xs text-gray-500 mb-2">
                  * 모든 지원사업 부가세 별도, 재무제표 잡이익 처리
                </div>
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b text-center">
                  <div className="col-span-3">사업 유형</div>
                  <div className="col-span-2 text-center">자부담 비율</div>
                  <div className="col-span-7">비고</div>
                </div>
                <div className="grid grid-cols-12 gap-2 text-sm py-2 border-b text-center">
                  <div className="col-span-3">일반 (초기창업)</div>
                  <div className="col-span-2 text-center">30%</div>
                  <div className="col-span-7 text-gray-600 text-xs">
                    현금10%, 현물20% / 예비창업은 자부담 없음
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-2 text-sm py-2 border-b text-center">
                  <div className="col-span-3">강한소상공인</div>
                  <div className="col-span-2 text-center">없음</div>
                  <div className="col-span-7 text-gray-600 text-xs">-</div>
                </div>
                <div className="grid grid-cols-12 gap-2 text-sm py-2 border-b text-center">
                  <div className="col-span-3">로컬크리에이터</div>
                  <div className="col-span-2 text-center">20%</div>
                  <div className="col-span-7 text-gray-600 text-xs">현금 또는 현물</div>
                </div>
                <div className="grid grid-cols-12 gap-2 text-sm py-2 border-b text-center">
                  <div className="col-span-3">희망리턴패키지</div>
                  <div className="col-span-2 text-center">50%</div>
                  <div className="col-span-7 text-gray-600 text-xs">
                    국비 50%, 현물 600만원 필수
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 정부지원사업 탭 - 정책자금 대출 취급기관 */}
          {activeTab === 'programs' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">정책자금 대출 취급기관</h3>
              <div className="text-xs text-gray-500 mb-4">
                * 통상적인 기본 매뉴얼 기준이며, 예외 적용이 많음
              </div>
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b text-center">
                <div className="col-span-4">기관</div>
                <div className="col-span-2">약칭</div>
                <div className="col-span-2">기능</div>
                <div className="col-span-4">대상 기준</div>
              </div>
              {[
                {
                  org: '신용보증기금',
                  abbr: '신보',
                  func: '보증서 발급',
                  target: '연매출 최소 3억 이상',
                },
                {
                  org: '기술보증기금',
                  abbr: '기보',
                  func: '보증서 발급',
                  target: '기술력 보유기업',
                },
                {
                  org: '중소벤처기업진흥공단',
                  abbr: '중진공',
                  func: '직접 대출',
                  target: '상시근로자 5인 이상',
                },
                {
                  org: '소상공인시장진흥공단',
                  abbr: '소진공',
                  func: '직접 대출',
                  target: '상시근로자 5인 미만',
                },
                { org: '신용보증재단', abbr: '재단', func: '보증서 발급', target: '대부분의 기업' },
                {
                  org: '서민금융진흥원',
                  abbr: '미소금융',
                  func: '보증서 발급',
                  target: 'NICE 744 이하 또는 KCB 700 이하',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 text-sm py-3 border-b hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="col-span-4 font-medium">{item.org}</div>
                  <div className="col-span-2 text-[#0052CC] font-semibold">{item.abbr}</div>
                  <div className="col-span-2">{item.func}</div>
                  <div className="col-span-4 text-gray-600 text-xs">{item.target}</div>
                </div>
              ))}
            </div>
          )}

          {/* 기업인증 탭 */}
          {activeTab === 'certifications' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">인증 및 세제혜택 (상시)</h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-[#0052CC] mb-2">{cert.name}</h4>
                    {cert.target !== '-' && (
                      <p className="text-xs text-gray-500 mb-2">대상: {cert.target}</p>
                    )}
                    <ul className="space-y-1">
                      {cert.benefits.map((benefit, benefitIndex) => (
                        <li
                          key={benefitIndex}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <span className="text-[#0052CC] mt-1">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
