'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CustomerSidebar } from '@/components/customers/CustomerSidebar';
import { CustomerDetailPanel } from '@/components/customers/CustomerDetailPanel';
import { CustomerProgressPanel } from '@/components/customers/CustomerProgressPanel';
import { CustomerMatchingPanel } from '@/components/customers/CustomerMatchingPanel';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { Button } from '@/components/ui/button';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { Plus, Upload, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

function CustomersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedIdFromUrl = useMemo(() => searchParams.get('selected'), [searchParams]);
  const tabFromUrl = useMemo(
    () => searchParams.get('tab') as 'detail' | 'progress' | 'matching' | null,
    [searchParams]
  );
  const subtabFromUrl = useMemo(
    () => searchParams.get('subtab') as 'ai-matching' | 'watchlist' | null,
    [searchParams]
  );
  const actionFromUrl = useMemo(() => searchParams.get('action'), [searchParams]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(selectedIdFromUrl);

  // 뷰 상태 관리 ('detail' | 'progress' | 'matching')
  // URL에서 탭 정보를 읽어 초기값 설정
  const [currentView, setCurrentView] = useState<'detail' | 'progress' | 'matching'>(
    tabFromUrl || 'detail'
  );

  // Dialog 상태 관리
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // 모바일 사이드바 토글 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 고객 목록 조회
  const { data, isLoading, error } = useCustomers({});
  const deleteCustomerMutation = useDeleteCustomer();

  // URL 파라미터와 동기화 (고객 ID)
  useEffect(() => {
    if (selectedIdFromUrl && selectedIdFromUrl !== selectedCustomerId) {
      setSelectedCustomerId(selectedIdFromUrl);
    }
  }, [selectedIdFromUrl, selectedCustomerId]);

  // URL 파라미터와 동기화 (탭)
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== currentView) {
      setCurrentView(tabFromUrl);
    }
  }, [tabFromUrl, currentView]);

  // URL 파라미터로 모달 자동 열기 (action=new)
  useEffect(() => {
    if (actionFromUrl === 'new' && !dialogOpen) {
      setEditingCustomerId(null);
      setDialogOpen(true);
      // URL에서 action 파라미터 제거 (모달 열린 후)
      router.replace('/customers', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFromUrl]);

  // 고객 선택 시 URL 업데이트 (항상 기본 정보로 리셋)
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setCurrentView('detail'); // 새 고객 선택 시 항상 기본 정보로 리셋
    setIsSidebarOpen(false); // 모바일에서 사이드바 닫기
    router.push(`/customers?selected=${id}&tab=detail`, { scroll: false });
  };

  // 고객 삭제
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomerMutation.mutateAsync(id);
      // 삭제된 고객이 선택되어 있었다면 선택 해제
      if (selectedCustomerId === id) {
        setSelectedCustomerId(null);
        router.push('/customers', { scroll: false });
      }
    } catch {
      alert('고객 삭제에 실패했습니다');
    }
  };

  // 선택된 고객 정보 찾기
  const selectedCustomer =
    selectedCustomerId && data?.customers
      ? data.customers.find(c => c.id === selectedCustomerId) || null
      : null;

  // 수정할 고객 정보 찾기
  const editingCustomer =
    editingCustomerId && data?.customers
      ? data.customers.find(c => c.id === editingCustomerId) || null
      : null;

  // 고객 추가 핸들러
  const handleAddCustomer = () => {
    setEditingCustomerId(null); // 등록 모드
    setDialogOpen(true);
  };

  // 고객 수정 핸들러
  const handleEditCustomer = (id: string) => {
    setEditingCustomerId(id); // 수정 모드
    setDialogOpen(true);
  };

  // Dialog 성공 시 콜백
  const handleDialogSuccess = () => {
    // Dialog가 닫힌 후 상태 초기화는 Dialog 내부에서 처리됨
    setEditingCustomerId(null);
  };

  // 뷰 전환 핸들러
  const handleViewChange = (customerId: string, view: 'detail' | 'progress' | 'matching') => {
    setSelectedCustomerId(customerId);
    setCurrentView(view);
    router.push(`/customers?selected=${customerId}&tab=${view}`, { scroll: false });
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* 헤더 */}
        <div className="border-b bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          {/* 왼쪽: 햄버거 버튼 (모바일만) + 제목 */}
          <div className="flex items-center gap-3">
            {/* 햄버거 버튼 (모바일에서만 표시) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2"
              aria-label="고객 목록 열기"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">고객 관리</h1>
              <p className="text-sm text-gray-600 mt-1">총 {data?.metadata.total || 0}명의 고객</p>
            </div>
          </div>

          {/* 오른쪽: 액션 버튼들 */}
          <div className="flex gap-3">
            {/* 일괄 등록 버튼 (모바일: 숨김, 데스크톱: 표시) */}
            <Link href="/customers/bulk-upload" className="hidden sm:block">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                일괄 등록
              </Button>
            </Link>

            {/* 고객 추가 버튼 (모바일: 아이콘만, 데스크톱: 아이콘+텍스트) */}
            <Button size="sm" onClick={handleAddCustomer}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">고객 추가</span>
            </Button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <p className="text-sm text-red-800">
              ❌ {error instanceof Error ? error.message : '고객 목록을 불러오는데 실패했습니다'}
            </p>
          </div>
        )}

        {/* Split View */}
        <div className="flex-1 overflow-hidden relative flex">
          {/* 모바일 백드롭 (사이드바 열렸을 때만 표시) */}
          {isSidebarOpen && (
            <div
              className="fixed top-16 bottom-0 left-0 right-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="사이드바 닫기"
            />
          )}

          {/* 왼쪽: 고객 목록 사이드바 */}
          <div
            className={`
              fixed top-16 bottom-0 left-0 z-50 w-full transform transition-transform duration-300 ease-in-out
              lg:relative lg:top-0 lg:translate-x-0 lg:w-80
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            {/* 모바일 닫기 버튼 (사이드바 내부 상단) */}
            <div className="lg:hidden absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
                className="p-2"
                aria-label="사이드바 닫기"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <CustomerSidebar
              customers={data?.customers || []}
              selectedId={selectedCustomerId}
              onSelect={handleSelectCustomer}
              onViewChange={handleViewChange}
              isLoading={isLoading}
            />
          </div>

          {/* 오른쪽: 패널 (상세 정보 또는 매칭 결과 또는 사업진행현황) */}
          {currentView === 'detail' ? (
            <CustomerDetailPanel
              customer={selectedCustomer}
              isLoading={isLoading}
              onEdit={handleEditCustomer}
              onDelete={handleDelete}
            />
          ) : currentView === 'matching' ? (
            <CustomerMatchingPanel
              customer={selectedCustomer}
              isLoading={isLoading}
              defaultSubtab={subtabFromUrl || 'ai-matching'}
            />
          ) : (
            <CustomerProgressPanel customer={selectedCustomer} isLoading={isLoading} />
          )}
        </div>

        {/* 고객 등록/수정 Dialog */}
        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editingCustomer}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </AppLayout>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={<div className="h-screen flex items-center justify-center">로딩 중...</div>}
    >
      <CustomersPageContent />
    </Suspense>
  );
}
