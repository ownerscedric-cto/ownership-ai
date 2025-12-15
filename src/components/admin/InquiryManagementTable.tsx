'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { useInquiries, useUpdateInquiryStatus } from '@/hooks/useInquiries';
import type { PremiumInquiry, InquiryStatus } from '@/lib/validations/inquiry';

/**
 * 관리자용 업그레이드 문의 관리 테이블
 */
export function InquiryManagementTable() {
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('pending');
  const [page, setPage] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<PremiumInquiry | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading, error } = useInquiries({
    status: statusFilter,
    page,
    limit: 20,
  });

  const updateStatus = useUpdateInquiryStatus();

  const handleApprove = async () => {
    if (!selectedInquiry) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedInquiry.id,
        status: 'approved',
        adminNote: adminNote || undefined,
      });
      setSelectedInquiry(null);
      setAdminNote('');
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleReject = async () => {
    if (!selectedInquiry) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedInquiry.id,
        status: 'rejected',
        adminNote: adminNote || undefined,
      });
      setSelectedInquiry(null);
      setAdminNote('');
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            승인됨
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            거절됨
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">문의 목록을 불러오는데 실패했습니다.</div>
    );
  }

  const inquiries = data?.data || [];
  const total = data?.metadata.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={value => {
            setStatusFilter(value as typeof statusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="approved">승인됨</SelectItem>
            <SelectItem value="rejected">거절됨</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">총 {total}건</span>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>신청자</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>현재 등급</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  문의가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map(inquiry => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">{inquiry.userName}</TableCell>
                  <TableCell className="text-gray-600">{inquiry.userEmail}</TableCell>
                  <TableCell>{inquiry.currentRole}</TableCell>
                  <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(inquiry.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInquiry(inquiry);
                        setAdminNote('');
                      }}
                    >
                      {inquiry.status === 'pending' ? '처리' : '상세'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* 상세/처리 모달 */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>업그레이드 문의 상세</DialogTitle>
            <DialogDescription>
              {selectedInquiry?.userName}님의 프리미엄 업그레이드 신청
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">신청자</span>
                  <p className="font-medium">{selectedInquiry.userName}</p>
                </div>
                <div>
                  <span className="text-gray-500">이메일</span>
                  <p className="font-medium">{selectedInquiry.userEmail}</p>
                </div>
                <div>
                  <span className="text-gray-500">현재 등급</span>
                  <p className="font-medium">{selectedInquiry.currentRole}</p>
                </div>
                <div>
                  <span className="text-gray-500">상태</span>
                  <p>{getStatusBadge(selectedInquiry.status)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">신청일</span>
                  <p className="font-medium">{formatDate(selectedInquiry.createdAt)}</p>
                </div>
              </div>

              {selectedInquiry.message && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    문의 내용
                  </div>
                  <p className="text-sm">{selectedInquiry.message}</p>
                </div>
              )}

              {selectedInquiry.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">관리자 메모 (선택)</label>
                  <Textarea
                    placeholder="처리 관련 메모를 입력하세요"
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {selectedInquiry.adminNote && selectedInquiry.status !== 'pending' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">관리자 메모</div>
                  <p className="text-sm">{selectedInquiry.adminNote}</p>
                </div>
              )}

              {selectedInquiry.processedAt && (
                <div className="text-sm text-gray-500">
                  처리일: {formatDate(selectedInquiry.processedAt)}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedInquiry?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={updateStatus.isPending}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      거절
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={updateStatus.isPending}
                  className="bg-[#0052CC] hover:bg-[#0052CC]/90"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      승인
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setSelectedInquiry(null)}>닫기</Button>
            )}
          </DialogFooter>

          {updateStatus.isError && (
            <p className="text-sm text-red-600 text-center">{updateStatus.error.message}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
