/**
 * @file ReportGenerator.tsx
 * @description 리포트 생성 UI 컴포넌트
 * Phase 6: 대시보드 및 분석 - 리포트 생성
 */

'use client';

import { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileDown, Loader2, Calendar, AlertCircle, Users, BarChart3 } from 'lucide-react';
import { ReportPDFTemplate } from './ReportPDFTemplate';
import { CustomerReportPDFTemplate } from './CustomerReportPDFTemplate';
import type { ReportData, CustomerReportData } from '@/lib/validations/report';

interface CustomerOption {
  id: string;
  name: string;
  industry?: string;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 기본 날짜 범위 (지난 30일)
 */
function getDefaultDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(endDate),
  };
}

interface ReportGeneratorProps {
  className?: string;
}

/**
 * 리포트 생성 컴포넌트
 */
export function ReportGenerator({ className }: ReportGeneratorProps) {
  const defaultRange = getDefaultDateRange();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 리포트 타입 및 고객 선택 상태
  const [reportType, setReportType] = useState<'activity' | 'customer'>('activity');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // 폼 상태
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [includeCustomers, setIncludeCustomers] = useState(true);
  const [includePrograms, setIncludePrograms] = useState(true);
  const [includeMatchings, setIncludeMatchings] = useState(true);

  /**
   * 다이얼로그 열릴 때 고객 목록 로드
   */
  useEffect(() => {
    if (open && customers.length === 0) {
      fetchCustomers();
    }
  }, [open, customers.length]);

  /**
   * 고객 목록 조회
   */
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const response = await fetch('/api/customers?limit=100');
      if (response.ok) {
        const result = await response.json();
        setCustomers(
          result.data.map((c: { id: string; name: string; industry?: string }) => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
          }))
        );
      }
    } catch (err) {
      console.error('고객 목록 로드 실패:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  /**
   * 전체 활동 리포트 생성
   */
  const handleGenerateActivityReport = async () => {
    const response = await fetch('/api/analytics/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        includeCustomers,
        includePrograms,
        includeMatchings,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '리포트 생성에 실패했습니다');
    }

    const result = await response.json();
    const reportData: ReportData = result.data;

    // PDF 생성
    const blob = await pdf(<ReportPDFTemplate data={reportData} />).toBlob();

    // 다운로드
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `활동리포트_${startDate}_${endDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 고객별 리포트 생성
   */
  const handleGenerateCustomerReport = async () => {
    if (!selectedCustomerId) {
      throw new Error('고객을 선택해주세요');
    }

    const response = await fetch(`/api/analytics/report/customer/${selectedCustomerId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '고객 리포트 생성에 실패했습니다');
    }

    const result = await response.json();
    const reportData: CustomerReportData = result.data;

    // PDF 생성
    const blob = await pdf(<CustomerReportPDFTemplate data={reportData} />).toBlob();

    // 다운로드
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const customerName = selectedCustomer?.name || '고객';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customerName}_매칭리포트_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 리포트 생성 및 다운로드
   */
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (reportType === 'activity') {
        await handleGenerateActivityReport();
      } else {
        await handleGenerateCustomerReport();
      }

      // 성공 시 다이얼로그 닫기
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 빠른 기간 선택
   */
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <FileDown className="w-4 h-4 mr-2" />
          리포트 다운로드
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-[#0052CC]" />
            리포트 생성
          </DialogTitle>
          <DialogDescription>리포트 유형을 선택하고 PDF를 생성하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 리포트 유형 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">리포트 유형</Label>
            <Select
              value={reportType}
              onValueChange={(value: 'activity' | 'customer') => {
                setReportType(value);
                setError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="리포트 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>전체 활동 리포트</span>
                  </div>
                </SelectItem>
                <SelectItem value="customer">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>고객별 매칭 리포트</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 고객 선택 (고객별 리포트인 경우) */}
          {reportType === 'customer' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">고객 선택</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
                disabled={isLoadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingCustomers ? '로딩 중...' : '고객을 선택하세요'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <span>{customer.name}</span>
                      {customer.industry && (
                        <span className="text-gray-500 ml-2">({customer.industry})</span>
                      )}
                    </SelectItem>
                  ))}
                  {customers.length === 0 && !isLoadingCustomers && (
                    <div className="py-2 px-3 text-sm text-gray-500">등록된 고객이 없습니다</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 활동 리포트 옵션 (전체 활동 리포트인 경우) */}
          {reportType === 'activity' && (
            <>
              {/* 기간 선택 */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  기간 선택
                </Label>

                {/* 빠른 선택 버튼 */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickRange(7)}
                  >
                    최근 7일
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickRange(30)}
                  >
                    최근 30일
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickRange(90)}
                  >
                    최근 90일
                  </Button>
                </div>

                {/* 날짜 입력 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs text-gray-500">
                      시작일
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs text-gray-500">
                      종료일
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 포함 항목 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">포함 항목</Label>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCustomers"
                      checked={includeCustomers}
                      onCheckedChange={(checked: boolean) => setIncludeCustomers(checked)}
                    />
                    <label
                      htmlFor="includeCustomers"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      고객 통계 (업종별 분포, Top 고객)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePrograms"
                      checked={includePrograms}
                      onCheckedChange={(checked: boolean) => setIncludePrograms(checked)}
                    />
                    <label
                      htmlFor="includePrograms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      프로그램 통계 (데이터소스별, Top 프로그램)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMatchings"
                      checked={includeMatchings}
                      onCheckedChange={(checked: boolean) => setIncludeMatchings(checked)}
                    />
                    <label
                      htmlFor="includeMatchings"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      매칭 통계 (점수 분포, 일별 추이)
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 생성 버튼 */}
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading || (reportType === 'customer' && !selectedCustomerId)}
            className="w-full bg-[#0052CC] hover:bg-[#0052CC]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                {reportType === 'activity' ? 'PDF 활동 리포트 생성' : 'PDF 고객 리포트 생성'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 대시보드 카드 형태의 리포트 생성기
 */
export function ReportGeneratorCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FileDown className="h-5 w-5 text-gray-500" />
          리포트
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">활동 데이터를 PDF 리포트로 다운로드하세요.</p>
        <ReportGenerator className="w-full" />
      </CardContent>
    </Card>
  );
}
