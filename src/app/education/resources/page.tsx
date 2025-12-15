'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResourceList } from '@/components/education/ResourceList';
import { useResources } from '@/hooks/useEducation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Resource } from '@/hooks/useEducation';

/**
 * 자료실 페이지
 * - 타입별 필터링 (템플릿, 체크리스트, 문서)
 * - 검색 기능
 * - 게시판(테이블) 형식 레이아웃
 */
export default function ResourcesPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // React Query 데이터 조회
  const { data, isLoading, error } = useResources({
    type: selectedType,
    search,
    page,
    limit,
  });

  // 타입 목록
  const types = [
    { value: 'template', label: '템플릿' },
    { value: 'checklist', label: '체크리스트' },
    { value: 'document', label: '문서' },
  ];

  // 검색 실행
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1); // 검색 시 첫 페이지로
  };

  // 엔터 키 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 타입 필터 변경
  const handleTypeChange = (type: string | undefined) => {
    setSelectedType(type);
    setPage(1); // 필터 변경 시 첫 페이지로
  };

  // 다운로드 핸들러 - 직접 파일 URL로 이동 + 카운트 증가
  const handleDownload = async (resource: Resource) => {
    // 1. 백그라운드에서 다운로드 카운트 증가
    fetch(`/api/education/resources/${resource.id}/download`, {
      method: 'GET',
    }).catch(() => {
      // 카운트 증가 실패해도 다운로드는 진행
    });

    // 2. 파일 직접 다운로드 (새 탭에서 열기)
    window.open(resource.fileUrl, '_blank');
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 뒤로가기 버튼 */}
        <Button onClick={() => router.push('/education')} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          교육 센터로
        </Button>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">자료실</h1>
          <p className="text-gray-600">신청서 템플릿, 체크리스트, 참고 문서를 다운로드하세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          {/* 검색창 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="자료 검색..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-[#0052CC] hover:bg-[#0052CC]/90">
              검색
            </Button>
          </div>

          {/* 타입 필터 */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedType === undefined ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedType === undefined ? 'bg-[#0052CC]' : ''}`}
              onClick={() => handleTypeChange(undefined)}
            >
              전체
            </Badge>
            {types.map(({ value, label }) => (
              <Badge
                key={value}
                variant={selectedType === value ? 'default' : 'outline'}
                className={`cursor-pointer ${selectedType === value ? 'bg-[#0052CC]' : ''}`}
                onClick={() => handleTypeChange(value)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-600 font-semibold mb-2">
              자료를 불러오는 중 오류가 발생했습니다
            </p>
            <p className="text-gray-600 text-sm">{error.message}</p>
          </div>
        )}

        {/* 자료 목록 (게시판 형식) */}
        {!error && (
          <ResourceList
            resources={data?.data || []}
            total={data?.metadata.total || 0}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onDownload={handleDownload}
            isLoading={isLoading}
          />
        )}
      </div>
    </AppLayout>
  );
}
