/**
 * @file CustomerReportPDFTemplate.tsx
 * @description 개별 고객 PDF 리포트 템플릿
 * Phase 6: 대시보드 및 분석 - 고객별 리포트
 */

'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { CustomerReportData } from '@/lib/validations/report';

// 한글 폰트 등록 (Noto Sans KR)
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.0/files/noto-sans-kr-korean-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.0/files/noto-sans-kr-korean-700-normal.woff',
      fontWeight: 700,
    },
  ],
});

// 스타일 정의
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 70,
    fontFamily: 'NotoSansKR',
    fontSize: 10,
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#0052CC',
    borderBottomStyle: 'solid',
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0052CC',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  // 고객 정보 카드
  customerInfoCard: {
    backgroundColor: '#F0F7FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6B7280',
    width: 60,
  },
  infoValue: {
    fontSize: 9,
    color: '#1F2937',
    flex: 1,
  },
  // 요약 그리드
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    width: '23%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1F2937',
  },
  // 키워드 태그
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  keywordTag: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
    fontSize: 8,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  // 테이블
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  tableCell: {
    fontSize: 9,
    color: '#4B5563',
  },
  // 점수 배지
  scoreBadge: {
    fontSize: 8,
    fontWeight: 700,
    padding: 3,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 4,
  },
  scoreHigh: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  scoreMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  scoreLow: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  // 상태 배지
  statusBadge: {
    fontSize: 8,
    padding: 3,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusSoon: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusClosed: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  // 진행사업 상태
  projectPreparing: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  projectSubmitted: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  projectReviewing: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  projectSelected: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  projectRejected: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  projectCancelled: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  projectCompleted: {
    backgroundColor: '#EDE9FE',
    color: '#5B21B6',
  },
  // 차트
  chartContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 10,
  },
  barContainer: {
    marginBottom: 10,
  },
  barLabel: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 4,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  bar: {
    height: 14,
    backgroundColor: '#0052CC',
    borderRadius: 3,
    minWidth: 6,
  },
  barValue: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1F2937',
    width: 50,
    textAlign: 'right',
  },
  // 푸터
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#6B7280',
  },
});

interface CustomerReportPDFTemplateProps {
  data: CustomerReportData;
}

/**
 * 점수에 따른 스타일 반환
 */
function getScoreStyle(score: number) {
  if (score >= 70) return styles.scoreHigh;
  if (score >= 40) return styles.scoreMedium;
  return styles.scoreLow;
}

/**
 * 상태에 따른 스타일 반환
 */
function getStatusStyle(status: string) {
  if (status === '진행중') return styles.statusActive;
  if (status === '마감임박') return styles.statusSoon;
  return styles.statusClosed;
}

/**
 * 진행사업 상태에 따른 스타일 반환
 */
function getProjectStatusStyle(status: string) {
  switch (status) {
    case 'preparing':
      return styles.projectPreparing;
    case 'submitted':
      return styles.projectSubmitted;
    case 'reviewing':
      return styles.projectReviewing;
    case 'selected':
      return styles.projectSelected;
    case 'rejected':
      return styles.projectRejected;
    case 'cancelled':
      return styles.projectCancelled;
    case 'completed':
      return styles.projectCompleted;
    default:
      return styles.projectPreparing;
  }
}

/**
 * 개별 고객 PDF 리포트 템플릿
 */
export function CustomerReportPDFTemplate({ data }: CustomerReportPDFTemplateProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      {/* 1페이지: 고객 정보 + 매칭 요약 + 키워드 분석 */}
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>고객 매칭 리포트</Text>
          <Text style={styles.subtitle}>생성일: {formatDate(data.generatedAt)}</Text>
        </View>

        {/* 고객 정보 카드 */}
        <View style={styles.customerInfoCard}>
          <Text style={styles.customerName}>{data.customer.name}</Text>
          {data.customer.industry && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>업종</Text>
              <Text style={styles.infoValue}>{data.customer.industry}</Text>
            </View>
          )}
          {data.customer.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>지역</Text>
              <Text style={styles.infoValue}>{data.customer.location}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>등록일</Text>
            <Text style={styles.infoValue}>{formatDate(data.customer.createdAt)}</Text>
          </View>
          {data.customer.challenges && data.customer.challenges.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>과제</Text>
              <Text style={styles.infoValue}>{data.customer.challenges.join(', ')}</Text>
            </View>
          )}
          {data.customer.goals && data.customer.goals.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>목표</Text>
              <Text style={styles.infoValue}>{data.customer.goals.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* 매칭 요약 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매칭 요약</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>총 매칭 수</Text>
              <Text style={styles.summaryValue}>{data.matchingSummary.totalMatchings}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>평균 점수</Text>
              <Text style={styles.summaryValue}>{data.matchingSummary.avgScore}점</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>최고 점수</Text>
              <Text style={styles.summaryValue}>{data.matchingSummary.topScore}점</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>관심 목록</Text>
              <Text style={styles.summaryValue}>{data.watchlistPrograms.length}</Text>
            </View>
          </View>

          {/* 매칭 키워드 */}
          {data.matchingSummary.matchedKeywords.length > 0 && (
            <View>
              <Text style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                매칭된 키워드
              </Text>
              <View style={styles.keywordContainer}>
                {data.matchingSummary.matchedKeywords.slice(0, 15).map((keyword, index) => (
                  <Text key={index} style={styles.keywordTag}>
                    {keyword}
                  </Text>
                ))}
                {data.matchingSummary.matchedKeywords.length > 15 && (
                  <Text
                    style={[styles.keywordTag, { backgroundColor: '#E5E7EB', color: '#6B7280' }]}
                  >
                    +{data.matchingSummary.matchedKeywords.length - 15}개
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 키워드 분석 - Top 키워드 */}
        {data.keywordAnalysis.topKeywords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>키워드 분석</Text>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>자주 매칭된 키워드 Top 10</Text>
              {data.keywordAnalysis.topKeywords.map((item, index) => {
                const maxCount = Math.max(...data.keywordAnalysis.topKeywords.map(k => k.count));
                const percentage = Math.max((item.count / maxCount) * 100, 5);

                return (
                  <View key={index} style={styles.barContainer}>
                    <Text style={styles.barLabel}>{item.keyword}</Text>
                    <View style={styles.barWrapper}>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.bar,
                            { width: `${percentage}%`, backgroundColor: '#6366F1' },
                          ]}
                        />
                      </View>
                      <Text style={styles.barValue}>{item.count}회</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 데이터소스별 매칭 분포 */}
        {data.keywordAnalysis.byDataSource.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>데이터소스별 매칭 분포</Text>
            {data.keywordAnalysis.byDataSource.map((item, index) => {
              const maxCount = Math.max(...data.keywordAnalysis.byDataSource.map(d => d.count));
              const percentage = Math.max((item.count / maxCount) * 100, 5);

              return (
                <View key={index} style={styles.barContainer}>
                  <Text style={styles.barLabel}>
                    {item.dataSource} (평균 {item.avgScore}점)
                  </Text>
                  <View style={styles.barWrapper}>
                    <View style={styles.barBackground}>
                      <View
                        style={[
                          styles.bar,
                          { width: `${percentage}%`, backgroundColor: '#10B981' },
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{item.count}건</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.footer} fixed>
          Ownership AI - 정부지원사업 매칭 플랫폼
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* 2페이지: 매칭된 프로그램 목록 */}
      {data.matchedPrograms.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>매칭된 지원사업 목록</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '45%' }]}>프로그램명</Text>
                <Text style={[styles.tableHeaderCell, { width: '18%' }]}>데이터소스</Text>
                <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>
                  점수
                </Text>
                <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>
                  상태
                </Text>
                <Text style={[styles.tableHeaderCell, { width: '13%', textAlign: 'center' }]}>
                  업종/지역
                </Text>
              </View>
              {data.matchedPrograms.slice(0, 15).map((program, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '45%' }]}>
                    {program.title.length > 35
                      ? program.title.substring(0, 35) + '...'
                      : program.title}
                  </Text>
                  <Text style={[styles.tableCell, { width: '18%' }]}>{program.dataSource}</Text>
                  <View style={{ width: '12%', alignItems: 'center' }}>
                    <Text style={[styles.scoreBadge, getScoreStyle(program.score)]}>
                      {program.score}점
                    </Text>
                  </View>
                  <View style={{ width: '12%', alignItems: 'center' }}>
                    <Text style={[styles.statusBadge, getStatusStyle(program.status)]}>
                      {program.status}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, { width: '13%', textAlign: 'center' }]}>
                    {program.matchedIndustry ? '업' : '-'} / {program.matchedLocation ? '지' : '-'}
                  </Text>
                </View>
              ))}
            </View>
            {data.matchedPrograms.length > 15 && (
              <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 10 }}>
                * 상위 15개 프로그램만 표시됩니다. 전체 {data.matchedPrograms.length}개
              </Text>
            )}
          </View>

          <Text style={styles.footer} fixed>
            Ownership AI - 정부지원사업 매칭 플랫폼
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}

      {/* 3페이지: 진행사업 현황 */}
      {data.projects && data.projects.length > 0 && (
        <Page size="A4" style={styles.page}>
          {/* 진행사업 요약 */}
          {data.projectSummary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>사업진행현황</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>총 진행사업</Text>
                  <Text style={styles.summaryValue}>{data.projectSummary.total}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.summaryLabel}>진행중</Text>
                  <Text style={[styles.summaryValue, { color: '#1E40AF' }]}>
                    {data.projectSummary.inProgress}
                  </Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={styles.summaryLabel}>선정/완료</Text>
                  <Text style={[styles.summaryValue, { color: '#065F46' }]}>
                    {data.projectSummary.completed}
                  </Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.summaryLabel}>탈락/취소</Text>
                  <Text style={[styles.summaryValue, { color: '#991B1B' }]}>
                    {data.projectSummary.ended}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 진행사업 목록 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>진행사업 목록</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '40%' }]}>프로그램명</Text>
                <Text style={[styles.tableHeaderCell, { width: '18%' }]}>데이터소스</Text>
                <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>
                  상태
                </Text>
                <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>
                  마감
                </Text>
                <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>
                  시작일
                </Text>
              </View>
              {data.projects.map((project, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>
                    {project.title.length > 30
                      ? project.title.substring(0, 30) + '...'
                      : project.title}
                  </Text>
                  <Text style={[styles.tableCell, { width: '18%' }]}>{project.dataSource}</Text>
                  <View style={{ width: '14%', alignItems: 'center' }}>
                    <Text style={[styles.statusBadge, getProjectStatusStyle(project.status)]}>
                      {project.statusLabel}
                    </Text>
                  </View>
                  <View style={{ width: '14%', alignItems: 'center' }}>
                    <Text
                      style={[
                        styles.statusBadge,
                        project.deadlineStatus === 'closing'
                          ? styles.statusSoon
                          : project.deadlineStatus === 'closed'
                            ? styles.statusClosed
                            : styles.statusActive,
                      ]}
                    >
                      {project.deadlineStatus === 'closing'
                        ? '마감임박'
                        : project.deadlineStatus === 'closed'
                          ? '마감'
                          : '진행중'}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, { width: '14%', textAlign: 'center' }]}>
                    {formatDate(project.startedAt).split(' ').slice(0, 2).join(' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer} fixed>
            Ownership AI - 정부지원사업 매칭 플랫폼
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}

      {/* 4페이지: 관심 목록 */}
      {data.watchlistPrograms.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관심 목록</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '50%' }]}>프로그램명</Text>
                <Text style={[styles.tableHeaderCell, { width: '20%' }]}>데이터소스</Text>
                <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>
                  상태
                </Text>
                <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>
                  추가일
                </Text>
              </View>
              {data.watchlistPrograms.map((program, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '50%' }]}>
                    {program.title.length > 40
                      ? program.title.substring(0, 40) + '...'
                      : program.title}
                  </Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{program.dataSource}</Text>
                  <View style={{ width: '15%', alignItems: 'center' }}>
                    <Text style={[styles.statusBadge, getStatusStyle(program.status)]}>
                      {program.status}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                    {formatDate(program.addedAt).split(' ').slice(0, 2).join(' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer} fixed>
            Ownership AI - 정부지원사업 매칭 플랫폼
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
