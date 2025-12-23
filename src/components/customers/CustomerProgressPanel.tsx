'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Customer } from '@/lib/types/customer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Play,
  FileText,
  Send,
  Search,
  Trophy,
  XCircle,
  Pause,
  Check,
  BarChart3,
  ArrowUpDown,
} from 'lucide-react';

// 진행사업 상태 타입
type ProjectStatus =
  | 'preparing'
  | 'submitted'
  | 'reviewing'
  | 'selected'
  | 'rejected'
  | 'cancelled'
  | 'completed';

// 진행사업 아이템 타입
interface ProjectItem {
  id: string;
  programId: string;
  title: string;
  dataSource: string;
  deadline: string | null;
  deadlineStatus: 'active' | 'closing' | 'closed';
  deadlineLabel: string;
  daysLeft: number | null;
  status: ProjectStatus;
  statusLabel: string;
  statusColor: string;
  notes: string | null;
  startedAt: string;
  submittedAt: string | null;
  resultAt: string | null;
  updatedAt: string;
}

interface ProgressData {
  customer: {
    id: string;
    name: string;
  };
  stats: {
    totalMatched: number;
    activeCount: number;
    closingCount: number;
    watchlistCount: number;
    avgScore: number;
    // 진행사업 통계
    projectsTotal: number;
    projectsInProgress: number;
    projectsCompleted: number;
    projectsEnded: number;
  };
  // 진행사업 데이터
  projects: ProjectItem[];
  projectsByStatus: {
    inProgress: ProjectItem[];
    completed: ProjectItem[];
    ended: ProjectItem[];
  };
}

interface CustomerProgressPanelProps {
  customer: Customer | null;
  isLoading?: boolean;
}

/**
 * 데이터소스 정규화 (KOCCA 계열은 한국콘텐츠진흥원으로 통일)
 */
function normalizeDataSource(dataSource: string): string {
  if (dataSource === 'KOCCA-PIMS' || dataSource === 'KOCCA-Finance') {
    return '한국콘텐츠진흥원';
  }
  return dataSource;
}

/**
 * 데이터소스 컬러 (ProgramCard와 동일한 색상 체계)
 */
const dataSourceColors: Record<string, string> = {
  기업마당: 'bg-blue-100 text-blue-800',
  'K-Startup': 'bg-green-100 text-green-800',
  한국콘텐츠진흥원: 'bg-purple-100 text-purple-800',
};

function getDataSourceColor(dataSource: string): string {
  const normalized = normalizeDataSource(dataSource);
  return dataSourceColors[normalized] || 'bg-gray-100 text-gray-700';
}

/**
 * 진행사업 상태별 스타일 정보
 */
const PROJECT_STATUS_STYLES: Record<
  ProjectStatus,
  { bg: string; text: string; icon: React.ReactNode; borderColor: string }
> = {
  preparing: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: <FileText className="h-4 w-4" />,
    borderColor: 'border-gray-300',
  },
  submitted: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <Send className="h-4 w-4" />,
    borderColor: 'border-blue-300',
  },
  reviewing: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: <Search className="h-4 w-4" />,
    borderColor: 'border-yellow-300',
  },
  selected: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: <Trophy className="h-4 w-4" />,
    borderColor: 'border-green-300',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <XCircle className="h-4 w-4" />,
    borderColor: 'border-red-300',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    icon: <Pause className="h-4 w-4" />,
    borderColor: 'border-gray-300',
  },
  completed: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    icon: <Check className="h-4 w-4" />,
    borderColor: 'border-purple-300',
  },
};

/**
 * 진행사업 상태 옵션 목록
 */
const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'preparing', label: '서류준비' },
  { value: 'submitted', label: '신청완료' },
  { value: 'reviewing', label: '심사중' },
  { value: 'selected', label: '선정' },
  { value: 'rejected', label: '탈락' },
  { value: 'cancelled', label: '취소/보류' },
  { value: 'completed', label: '완료' },
];

/**
 * 진행 중인 사업 정렬 옵션
 */
type InProgressSortType = 'status' | 'startedAt' | 'deadline';

const IN_PROGRESS_SORT_OPTIONS: Array<{ value: InProgressSortType; label: string }> = [
  { value: 'status', label: '단계순' },
  { value: 'startedAt', label: '시작일순' },
  { value: 'deadline', label: '마감일순' },
];

/**
 * 상태 우선순위 (단계 진행 순서)
 */
const STATUS_PRIORITY: Record<ProjectStatus, number> = {
  preparing: 1,
  submitted: 2,
  reviewing: 3,
  selected: 4,
  rejected: 5,
  cancelled: 6,
  completed: 7,
};

/**
 * 단계별 현황 카드
 */
interface StatusSummaryCardProps {
  status: ProjectStatus;
  label: string;
  count: number;
  isActive?: boolean;
}

function StatusSummaryCard({ status, label, count, isActive = false }: StatusSummaryCardProps) {
  const style = PROJECT_STATUS_STYLES[status];
  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
        isActive ? `${style.bg} ${style.borderColor}` : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className={`mb-1 ${isActive ? style.text : 'text-gray-400'}`}>{style.icon}</div>
      <div className={`text-2xl font-bold ${isActive ? style.text : 'text-gray-400'}`}>{count}</div>
      <div className={`text-xs ${isActive ? style.text : 'text-gray-400'}`}>{label}</div>
    </div>
  );
}

export function CustomerProgressPanel({ customer, isLoading = false }: CustomerProgressPanelProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);
  const [inProgressSort, setInProgressSort] = useState<InProgressSortType>('status');

  /**
   * 사업진행현황 데이터 로드
   */
  const fetchProgressData = async () => {
    if (!customer) return;

    setIsLoadingData(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customer.id}/progress`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '데이터를 불러올 수 없습니다');
      }

      const result = await response.json();
      setProgressData(result.data);
    } catch (err) {
      console.error('사업진행현황 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setIsLoadingData(false);
    }
  };

  /**
   * 진행사업 상태 변경
   */
  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    if (!customer) return;

    setUpdatingProjectId(projectId);
    try {
      const response = await fetch(`/api/customers/${customer.id}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '상태 변경에 실패했습니다');
      }

      // 데이터 새로고침
      await fetchProgressData();
    } catch (err) {
      console.error('상태 변경 실패:', err);
      alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다');
    } finally {
      setUpdatingProjectId(null);
    }
  };

  /**
   * 진행사업 삭제 (관심목록으로 되돌리기)
   */
  const handleRemoveProject = async (projectId: string) => {
    if (!customer) return;
    if (!confirm('이 사업을 진행목록에서 제거하시겠습니까?')) return;

    setUpdatingProjectId(projectId);
    try {
      const response = await fetch(`/api/customers/${customer.id}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '삭제에 실패했습니다');
      }

      // 데이터 새로고침
      await fetchProgressData();
    } catch (err) {
      console.error('진행사업 삭제 실패:', err);
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setUpdatingProjectId(null);
    }
  };

  useEffect(() => {
    if (customer) {
      fetchProgressData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  // 상태별 카운트 계산
  const getStatusCount = (status: ProjectStatus): number => {
    if (!progressData?.projects) return 0;
    return progressData.projects.filter(p => p.status === status).length;
  };

  // 진행 중인 사업 정렬
  const sortedInProgressProjects = (() => {
    const projects = progressData?.projectsByStatus?.inProgress || [];
    if (projects.length === 0) return [];

    return [...projects].sort((a, b) => {
      switch (inProgressSort) {
        case 'status':
          // 단계순 (preparing → submitted → reviewing)
          return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        case 'startedAt':
          // 시작일순 (최신순)
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        case 'deadline':
          // 마감일순 (임박한 순, null은 맨 뒤로)
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });
  })();

  // 빈 상태
  if (!customer && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">고객을 선택하세요</p>
          <p className="text-gray-400 text-sm mt-1">
            왼쪽 목록에서 고객을 클릭하면 사업진행현황이 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading || isLoadingData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#0052CC] animate-spin mx-auto mb-3" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-2">오류가 발생했습니다</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProgressData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
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

  const stats = progressData?.stats;
  const totalProjects = stats?.projectsTotal ?? 0;

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white border-b px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사업진행현황</h1>
            <p className="text-sm text-gray-600 mt-1">{customer.name}</p>
          </div>

          {/* 전체 통계 요약 */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
              <p className="text-xs text-gray-500">전체 진행사업</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProgressData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* 단계별 현황 요약 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0052CC]" />
            단계별 현황
          </h2>
          <div className="grid grid-cols-7 gap-2">
            <StatusSummaryCard
              status="preparing"
              label="서류준비"
              count={getStatusCount('preparing')}
              isActive={getStatusCount('preparing') > 0}
            />
            <StatusSummaryCard
              status="submitted"
              label="신청완료"
              count={getStatusCount('submitted')}
              isActive={getStatusCount('submitted') > 0}
            />
            <StatusSummaryCard
              status="reviewing"
              label="심사중"
              count={getStatusCount('reviewing')}
              isActive={getStatusCount('reviewing') > 0}
            />
            <StatusSummaryCard
              status="selected"
              label="선정"
              count={getStatusCount('selected')}
              isActive={getStatusCount('selected') > 0}
            />
            <StatusSummaryCard
              status="rejected"
              label="탈락"
              count={getStatusCount('rejected')}
              isActive={getStatusCount('rejected') > 0}
            />
            <StatusSummaryCard
              status="cancelled"
              label="취소/보류"
              count={getStatusCount('cancelled')}
              isActive={getStatusCount('cancelled') > 0}
            />
            <StatusSummaryCard
              status="completed"
              label="완료"
              count={getStatusCount('completed')}
              isActive={getStatusCount('completed') > 0}
            />
          </div>
        </section>

        <Separator />

        {/* 진행 중인 사업 (서류준비, 신청완료, 심사중) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              진행 중인 사업
              {sortedInProgressProjects.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {sortedInProgressProjects.length}건
                </Badge>
              )}
            </h2>
            {/* 정렬 드롭다운 */}
            {sortedInProgressProjects.length > 0 && (
              <Select
                value={inProgressSort}
                onValueChange={value => setInProgressSort(value as InProgressSortType)}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IN_PROGRESS_SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {sortedInProgressProjects.length > 0 ? (
            <div className="space-y-3">
              {sortedInProgressProjects.map(project => {
                const statusStyle = PROJECT_STATUS_STYLES[project.status];
                return (
                  <div
                    key={project.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/programs/${project.programId}`}
                          className="font-medium text-gray-900 hover:text-[#0052CC] truncate block"
                        >
                          {project.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={getDataSourceColor(project.dataSource)}
                          >
                            {normalizeDataSource(project.dataSource)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              project.deadlineStatus === 'closing'
                                ? 'text-amber-600 border-amber-200'
                                : 'text-green-600 border-green-200'
                            }
                          >
                            {project.deadlineLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(project.startedAt).toLocaleDateString('ko-KR')}에 시작
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {/* 상태 드롭다운 */}
                        <Select
                          value={project.status}
                          onValueChange={value =>
                            handleStatusChange(project.id, value as ProjectStatus)
                          }
                          disabled={updatingProjectId === project.id}
                        >
                          <SelectTrigger
                            className={`w-28 h-8 text-xs ${statusStyle.bg} ${statusStyle.text} border-0`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_STATUS_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProject(project.id)}
                          disabled={updatingProjectId === project.id}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-400">
              <Play className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">진행 중인 사업이 없습니다</p>
              <p className="text-xs mt-1">
                매칭 결과 탭의 관심목록에서 &apos;진행하기&apos; 버튼을 눌러 사업을 시작하세요
              </p>
            </div>
          )}
        </section>

        {/* 선정된 사업 */}
        {progressData?.projectsByStatus?.completed &&
          progressData.projectsByStatus.completed.length > 0 && (
            <>
              <Separator />
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  선정된 사업
                  <Badge className="ml-2 bg-green-100 text-green-700">
                    {progressData.projectsByStatus.completed.length}건
                  </Badge>
                </h2>
                <div className="space-y-2">
                  {progressData.projectsByStatus.completed.map(project => (
                    <Link
                      key={project.id}
                      href={`/programs/${project.programId}`}
                      className="block border border-green-200 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 truncate block">
                            {project.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getDataSourceColor(project.dataSource)}
                            >
                              {normalizeDataSource(project.dataSource)}
                            </Badge>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 ml-4">
                          {project.statusLabel}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}

        {/* 종료된 사업 */}
        {progressData?.projectsByStatus?.ended &&
          progressData.projectsByStatus.ended.length > 0 && (
            <>
              <Separator />
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  종료된 사업
                  <Badge variant="secondary" className="ml-2">
                    {progressData.projectsByStatus.ended.length}건
                  </Badge>
                </h2>
                <div className="space-y-2">
                  {progressData.projectsByStatus.ended.map(project => (
                    <div
                      key={project.id}
                      className="border border-gray-200 bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-600 truncate block">{project.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getDataSourceColor(project.dataSource)}
                            >
                              {normalizeDataSource(project.dataSource)}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {project.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
      </div>
    </div>
  );
}
