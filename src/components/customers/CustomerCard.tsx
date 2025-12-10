'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, DollarSign, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import type { Customer } from "@/lib/types/program";

interface CustomerCardProps {
  customer: Customer;
  onDelete?: (id: string) => void;
}

export function CustomerCard({ customer, onDelete }: CustomerCardProps) {
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

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* 헤더: 이름 & 사업자 구분 */}
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/customers/${customer.id}`} className="hover:underline">
              <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              {formatBusinessNumber(customer.businessNumber)}
            </p>
          </div>
          <Badge variant={customer.businessType === 'CORPORATION' ? 'default' : 'secondary'}>
            {customer.businessType === 'CORPORATION' ? '법인' : '개인'}
          </Badge>
        </div>

        {/* 기본 정보 */}
        <div className="space-y-2">
          {customer.industry && (
            <div className="flex items-center text-sm text-gray-600">
              <Building2 className="h-4 w-4 mr-2" />
              {customer.industry}
            </div>
          )}

          {customer.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {customer.location}
            </div>
          )}

          {customer.budget && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2" />
              {formatCurrency(customer.budget)}
            </div>
          )}
        </div>

        {/* 연락처 정보 */}
        {(customer.contactEmail || customer.contactPhone) && (
          <div className="space-y-2 pt-2 border-t">
            {customer.contactEmail && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <a href={`mailto:${customer.contactEmail}`} className="hover:underline">
                  {customer.contactEmail}
                </a>
              </div>
            )}

            {customer.contactPhone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <a href={`tel:${customer.contactPhone}`} className="hover:underline">
                  {customer.contactPhone}
                </a>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Link href={`/customers/${customer.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              상세보기
            </Button>
          </Link>
          <Link href={`/customers/${customer.id}/edit`} className="flex-1">
            <Button variant="default" className="w-full">
              수정
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(customer.id)}
              title="삭제"
            >
              🗑️
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
