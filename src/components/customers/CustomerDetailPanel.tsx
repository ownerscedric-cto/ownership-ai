'use client';

import type { Customer } from '@/lib/types/customer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  // MapPin,
  // DollarSign,
  Mail,
  Phone,
  FileText,
  Edit,
  Trash2,
  Target,
} from 'lucide-react';

interface CustomerDetailPanelProps {
  customer: Customer | null;
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CustomerDetailPanel({
  customer,
  isLoading = false,
  onEdit,
  onDelete,
}: CustomerDetailPanelProps) {
  // 빈 상태
  if (!customer && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">고객을 선택하세요</p>
          <p className="text-gray-400 text-sm mt-1">
            왼쪽 목록에서 고객을 클릭하면 상세 정보가 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // customer가 없는 경우 (에러)
  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-red-500">고객 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={customer.businessType === 'CORPORATE' ? 'default' : 'secondary'}>
                {customer.businessType === 'CORPORATE' ? '법인사업자' : '개인사업자'}
              </Badge>
              {customer.industry && <Badge variant="outline">{customer.industry}</Badge>}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(customer.id)}>
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (confirm(`${customer.name}을(를) 삭제하시겠습니까?`)) {
                    onDelete(customer.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* 사업자 정보 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            사업자 정보
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">사업자등록번호</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{customer.businessNumber}</p>
            </div>
            {customer.corporateNumber && (
              <div>
                <p className="text-sm text-gray-500">법인등록번호</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{customer.corporateNumber}</p>
              </div>
            )}
            {customer.companySize && (
              <div>
                <p className="text-sm text-gray-500">기업 규모</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{customer.companySize}</p>
              </div>
            )}
            {customer.location && (
              <div>
                <p className="text-sm text-gray-500">
                  {/* <MapPin className="h-4 w-4 inline mr-1" /> */}
                  위치
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">{customer.location}</p>
              </div>
            )}
            {customer.budget && (
              <div>
                <p className="text-sm text-gray-500">
                  {/* <DollarSign className="h-4 w-4 inline mr-1" /> */}
                  예산
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {customer.budget.toLocaleString()}원
                </p>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* 니즈 정보 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            니즈 정보
          </h2>
          <div className="space-y-4">
            {customer.challenges && customer.challenges.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">해결 과제</p>
                <div className="flex flex-wrap gap-2">
                  {customer.challenges.map((challenge: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {challenge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {customer.goals && customer.goals.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">목표</p>
                <div className="flex flex-wrap gap-2">
                  {customer.goals.map((goal: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {customer.preferredKeywords && customer.preferredKeywords.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">선호 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {customer.preferredKeywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* 연락처 정보 */}
        {(customer.contactEmail || customer.contactPhone) && (
          <>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h2>
              <div className="space-y-3">
                {customer.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a
                      href={`mailto:${customer.contactEmail}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {customer.contactEmail}
                    </a>
                  </div>
                )}
                {customer.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a
                      href={`tel:${customer.contactPhone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {customer.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* 메모 */}
        {customer.notes && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              메모
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
