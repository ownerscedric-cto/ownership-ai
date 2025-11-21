'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, MapPin, DollarSign, Phone, Mail, Calendar, FileText } from 'lucide-react';
import type { Customer } from '@prisma/client';

interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatBusinessNumber = (number: string) => {
    if (number.length !== 10) return number;
    return `${number.slice(0, 3)}-${number.slice(3, 5)}-${number.slice(5)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              사업자등록번호: {formatBusinessNumber(customer.businessNumber)}
            </p>
            {customer.corporateNumber && (
              <p className="text-sm text-gray-500">법인등록번호: {customer.corporateNumber}</p>
            )}
          </div>
          <Badge variant={customer.businessType === 'CORPORATE' ? 'default' : 'secondary'}>
            {customer.businessType === 'CORPORATE' ? '법인사업자' : '개인사업자'}
          </Badge>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customer.industry && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">업종</p>
                <p className="text-base text-gray-900">{customer.industry}</p>
              </div>
            </div>
          )}

          {customer.companySize && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">기업 규모</p>
                <p className="text-base text-gray-900">{customer.companySize}</p>
              </div>
            </div>
          )}

          {customer.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">지역</p>
                <p className="text-base text-gray-900">{customer.location}</p>
              </div>
            </div>
          )}

          {customer.budget && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">예산</p>
                <p className="text-base text-gray-900">{formatCurrency(customer.budget)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 연락처 정보 */}
      {(customer.contactEmail || customer.contactPhone) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">연락처 정보</h3>
          <div className="space-y-4">
            {customer.contactEmail && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">이메일</p>
                  <a
                    href={`mailto:${customer.contactEmail}`}
                    className="text-base text-blue-600 hover:underline"
                  >
                    {customer.contactEmail}
                  </a>
                </div>
              </div>
            )}

            {customer.contactPhone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">전화번호</p>
                  <a
                    href={`tel:${customer.contactPhone}`}
                    className="text-base text-blue-600 hover:underline"
                  >
                    {customer.contactPhone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 도전과제 & 목표 */}
      {(customer.challenges.length > 0 || customer.goals.length > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">도전과제 & 목표</h3>

          {customer.challenges.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">도전과제</p>
              <div className="flex flex-wrap gap-2">
                {customer.challenges.map((challenge, index) => (
                  <Badge key={index} variant="outline">
                    {challenge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {customer.goals.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">목표</p>
              <div className="flex flex-wrap gap-2">
                {customer.goals.map((goal, index) => (
                  <Badge key={index} variant="secondary">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 선호 키워드 */}
      {customer.preferredKeywords.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">선호 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {customer.preferredKeywords.map((keyword, index) => (
              <Badge key={index} variant="default">
                {keyword}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* 메모 */}
      {customer.notes && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">메모</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 등록 정보 */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">등록 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500">등록일</p>
              <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500">최종 수정일</p>
              <p className="text-gray-900">{formatDate(customer.updatedAt)}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
