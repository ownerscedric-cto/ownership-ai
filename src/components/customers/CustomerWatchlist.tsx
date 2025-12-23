'use client';

/**
 * @file CustomerWatchlist.tsx
 * @description Display customer's watchlist programs (List format with deadline section)
 */

import {
  Star,
  Trash2,
  ExternalLink,
  Copy,
  CheckCheck,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DeadlineBadge } from '@/components/programs/DeadlineBadge';
import { toast } from 'sonner';
import {
  useWatchlist,
  useRemoveFromWatchlist,
  type WatchlistProgram,
} from '@/lib/hooks/useWatchlist';
import Link from 'next/link';
import { formatDateDot } from '@/lib/utils/date';
import { decodeHtmlEntities } from '@/lib/utils/html';
import { formatProgramsToText } from '@/lib/utils/programTextFormatter';
import { useState, useEffect, useMemo } from 'react';

/**
 * 데이터 소스 이름 정규화 함수
 */
const normalizeDataSource = (dataSource: string): string => {
  if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
    return '한국콘텐츠진흥원';
  }
  return dataSource;
};

/**
 * 데이터 소스별 Badge 색상 매핑
 */
const dataSourceColors: Record<string, string> = {
  기업마당: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'K-Startup': 'bg-green-100 text-green-800 hover:bg-green-200',
  한국콘텐츠진흥원: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
};

/**
 * 마감일까지 남은 일수 계산
 */
const getDaysLeft = (deadline: Date | string | null): number | null => {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays;
};

interface CustomerWatchlistProps {
  customerId: string;
  customerName?: string;
}

export function CustomerWatchlist({ customerId, customerName }: CustomerWatchlistProps) {
  const { data: watchlist, isLoading, error } = useWatchlist(customerId);
  const removeFromWatchlist = useRemoveFromWatchlist();
  const [isCopied, setIsCopied] = useState(false);
  const [addingProgramId, setAddingProgramId] = useState<string | null>(null);
  const [projectProgramIds, setProjectProgramIds] = useState<Set<string>>(new Set());

  // 마감임박(7일 이내) 프로그램과 일반 프로그램 분리
  const { closingPrograms, regularPrograms } = useMemo(() => {
    if (!watchlist || watchlist.items.length === 0) {
      return { closingPrograms: [], regularPrograms: [] };
    }

    const closing: WatchlistProgram[] = [];
    const regular: WatchlistProgram[] = [];

    watchlist.items.forEach(item => {
      const daysLeft = getDaysLeft(item.program.deadline);
      // 7일 이내이면서 아직 마감되지 않은 경우 (daysLeft >= 0)
      if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
        closing.push(item);
      } else {
        regular.push(item);
      }
    });

    // 마감임박은 D-day가 가까운 순으로 정렬
    closing.sort((a, b) => {
      const daysA = getDaysLeft(a.program.deadline) ?? 999;
      const daysB = getDaysLeft(b.program.deadline) ?? 999;
      return daysA - daysB;
    });

    return { closingPrograms: closing, regularPrograms: regular };
  }, [watchlist]);

  // 진행사업 목록 조회 (어떤 프로그램이 이미 진행사업인지 확인)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}/projects`);
        if (response.ok) {
          const result = await response.json();
          const programIds = new Set<string>(
            result.data.items.map((p: { program: { id: string } }) => p.program.id)
          );
          setProjectProgramIds(programIds);
        }
      } catch (err) {
        console.error('진행사업 목록 조회 실패:', err);
      }
    };
    fetchProjects();
  }, [customerId]);

  // 진행사업으로 추가
  const handleStartProject = async (programId: string, programTitle: string) => {
    setAddingProgramId(programId);
    try {
      const response = await fetch(`/api/customers/${customerId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '진행사업 추가에 실패했습니다');
      }

      // 성공 시 진행사업 목록에 추가
      setProjectProgramIds(prev => new Set([...prev, programId]));
      toast.success('진행사업에 추가했습니다', {
        description: `"${programTitle}"을 진행사업에 추가했습니다.`,
      });
    } catch (err) {
      console.error('진행사업 추가 실패:', err);
      toast.error('진행사업 추가 실패', {
        description: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
      });
    } finally {
      setAddingProgramId(null);
    }
  };

  const handleRemove = async (programId: string, programTitle: string) => {
    if (!confirm(`"${programTitle}"을 관심 목록에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await removeFromWatchlist.mutateAsync({
        customerId,
        programId,
      });

      toast.success('관심 목록에서 삭제했습니다', {
        description: `"${programTitle}"를 관심 목록에서 삭제했습니다.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '삭제에 실패했습니다';

      toast.error('삭제 실패', {
        description: errorMessage,
      });
    }
  };

  const handleCopyToClipboard = async () => {
    if (!watchlist || watchlist.items.length === 0) {
      toast.error('복사할 프로그램이 없습니다', {
        description: '관심 목록에 프로그램을 추가해주세요.',
      });
      return;
    }

    try {
      // 프로그램 목록을 텍스트로 변환
      const text = formatProgramsToText(watchlist.items, {
        customerName,
        includeHeader: true,
        includeFooter: true,
      });

      // 클립보드에 복사
      await navigator.clipboard.writeText(text);

      // 복사 성공 상태
      setIsCopied(true);
      toast.success('클립보드에 복사했습니다! 📋', {
        description: `${watchlist.items.length}개의 프로그램을 복사했습니다.`,
      });

      // 2초 후 복사 아이콘 리셋
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      toast.error('복사에 실패했습니다', {
        description: '다시 시도해주세요.',
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">관심 목록을 불러올 수 없습니다</p>
        <p className="text-red-600 text-sm mt-1">
          {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
        </p>
      </div>
    );
  }

  // 빈 상태
  if (!watchlist || watchlist.items.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium mb-2">아직 관심 프로그램이 없습니다</p>
        <p className="text-gray-500 text-sm mb-4">
          AI 매칭 탭에서 별표를 눌러 관심 목록에 추가하거나,
          <br />
          프로그램 상세 페이지에서 &apos;관심 목록에 추가&apos; 버튼을 눌러보세요
        </p>
        <Link href="/programs">
          <Button variant="default">
            <ExternalLink className="w-4 h-4 mr-2" />
            프로그램 둘러보기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 - 텍스트 복사 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{watchlist.total}개</Badge>
        </div>
        <Button
          onClick={handleCopyToClipboard}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={watchlist.items.length === 0}
        >
          {isCopied ? (
            <>
              <CheckCheck className="w-4 h-4 text-green-600" />
              복사됨!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              텍스트 복사
            </>
          )}
        </Button>
      </div>

      {/* 마감임박 섹션 */}
      {closingPrograms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-orange-700">마감임박 (7일 이내)</h3>
            <Badge variant="destructive" className="bg-orange-500">
              {closingPrograms.length}개
            </Badge>
          </div>
          <div className="space-y-2">
            {closingPrograms.map(item => (
              <WatchlistListItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removeFromWatchlist.isPending}
                onStartProject={handleStartProject}
                isStartingProject={addingProgramId === item.program.id}
                isAlreadyProject={projectProgramIds.has(item.program.id)}
                isClosing
              />
            ))}
          </div>
        </div>
      )}

      {/* 전체 목록 섹션 */}
      {regularPrograms.length > 0 && (
        <div className="space-y-3">
          {closingPrograms.length > 0 && <h3 className="font-semibold text-gray-700">전체 목록</h3>}
          <div className="space-y-2">
            {regularPrograms.map(item => (
              <WatchlistListItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removeFromWatchlist.isPending}
                onStartProject={handleStartProject}
                isStartingProject={addingProgramId === item.program.id}
                isAlreadyProject={projectProgramIds.has(item.program.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface WatchlistListItemProps {
  item: WatchlistProgram;
  onRemove: (programId: string, programTitle: string) => void;
  isRemoving: boolean;
  onStartProject: (programId: string, programTitle: string) => void;
  isStartingProject: boolean;
  isAlreadyProject: boolean;
  isClosing?: boolean;
}

function WatchlistListItem({
  item,
  onRemove,
  isRemoving,
  onStartProject,
  isStartingProject,
  isAlreadyProject,
  isClosing = false,
}: WatchlistListItemProps) {
  const { program, addedAt } = item;

  return (
    <div
      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
        isClosing ? 'border-orange-200 bg-orange-50/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* 왼쪽: 프로그램 정보 */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/programs/${program.id}`}
            className="text-base font-semibold text-gray-900 hover:text-[#0052CC] transition-colors line-clamp-1"
          >
            {decodeHtmlEntities(program.title)}
          </Link>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              className={
                dataSourceColors[normalizeDataSource(program.dataSource)] ||
                'bg-gray-100 text-gray-800'
              }
            >
              {normalizeDataSource(program.dataSource)}
            </Badge>
            <DeadlineBadge deadline={program.deadline} rawData={program.rawData} />
            <span className="text-xs text-gray-500">추가: {formatDateDot(addedAt)}</span>
          </div>
        </div>

        {/* 오른쪽: 액션 버튼 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 진행하기/진행중 버튼 */}
          {isAlreadyProject ? (
            <div className="flex items-center gap-1 py-1.5 px-3 bg-green-50 text-green-700 rounded-md text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              진행중
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStartProject(program.id, program.title)}
              disabled={isStartingProject}
              className="bg-green-600 hover:bg-green-700"
            >
              {isStartingProject ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  진행하기
                </>
              )}
            </Button>
          )}

          {/* 삭제 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(program.id, program.title)}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
