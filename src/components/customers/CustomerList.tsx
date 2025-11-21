'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Customer } from '@prisma/client';

interface CustomerListProps {
  customers: Customer[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function CustomerList({ customers, isLoading, onDelete }: CustomerListProps) {
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
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">등록된 고객이 없습니다.</p>
        <Link href="/customers/new" className="mt-4 inline-block">
          <Button>첫 고객 등록하기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>고객명</TableHead>
            <TableHead>사업자등록번호</TableHead>
            <TableHead>구분</TableHead>
            <TableHead>업종</TableHead>
            <TableHead>지역</TableHead>
            <TableHead>예산</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead className="text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map(customer => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/customers/${customer.id}`}
                  className="hover:underline hover:text-blue-600"
                >
                  {customer.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatBusinessNumber(customer.businessNumber)}
              </TableCell>
              <TableCell>
                <Badge variant={customer.businessType === 'CORPORATE' ? 'default' : 'secondary'}>
                  {customer.businessType === 'CORPORATE' ? '법인' : '개인'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{customer.industry || '-'}</TableCell>
              <TableCell className="text-sm text-gray-600">{customer.location || '-'}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {customer.budget ? formatCurrency(customer.budget) : '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(customer.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Link href={`/customers/${customer.id}`}>
                    <Button variant="outline" size="sm">
                      상세
                    </Button>
                  </Link>
                  <Link href={`/customers/${customer.id}/edit`}>
                    <Button variant="default" size="sm">
                      수정
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button variant="destructive" size="sm" onClick={() => onDelete(customer.id)}>
                      삭제
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
