/**
 * @file ReportPDFTemplate.tsx
 * @description PDF 리포트 템플릿 컴포넌트
 * Phase 6: 대시보드 및 분석 - 리포트 생성
 */

'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { ReportData } from '@/lib/validations/report';

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

// 스타일 정의 - height 제거, margin으로 간격 조정
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryCard: {
    width: '30%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 9,
    color: '#10B981',
  },
  table: {
    marginTop: 15,
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

interface ReportPDFTemplateProps {
  data: ReportData;
}

/**
 * PDF 리포트 템플릿
 */
export function ReportPDFTemplate({ data }: ReportPDFTemplateProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  return (
    <Document>
      {/* 1페이지: 요약 + 고객 통계 */}
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>활동 리포트</Text>
          <Text style={styles.subtitle}>
            기간: {formatDate(data.period.startDate)} ~ {formatDate(data.period.endDate)}
          </Text>
          <Text style={styles.subtitle}>생성일: {formatDate(data.period.generatedAt)}</Text>
        </View>

        {/* 요약 통계 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>요약</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>총 고객 수</Text>
              <Text style={styles.summaryValue}>{formatNumber(data.summary.totalCustomers)}</Text>
              <Text style={styles.summaryChange}>
                +{formatNumber(data.summary.newCustomers)} 신규
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>총 프로그램 수</Text>
              <Text style={styles.summaryValue}>{formatNumber(data.summary.totalPrograms)}</Text>
              <Text style={styles.summaryChange}>
                {formatNumber(data.summary.activePrograms)} 진행중
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>총 매칭 수</Text>
              <Text style={styles.summaryValue}>{formatNumber(data.summary.totalMatchings)}</Text>
              <Text style={styles.summaryChange}>
                +{formatNumber(data.summary.newMatchings)} 기간 내
              </Text>
            </View>
          </View>
        </View>

        {/* 고객 통계 */}
        {data.customerStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>고객 통계</Text>

            {/* 업종별 고객 분포 */}
            {data.customerStats.byIndustry.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>업종별 고객 분포</Text>
                {data.customerStats.byIndustry.slice(0, 5).map((item, index) => {
                  const maxCount = Math.max(...data.customerStats!.byIndustry.map(i => i.count));
                  const percentage = Math.max((item.count / maxCount) * 100, 5);

                  return (
                    <View key={index} style={styles.barContainer}>
                      <Text style={styles.barLabel}>{item.industry}</Text>
                      <View style={styles.barWrapper}>
                        <View style={styles.barBackground}>
                          <View style={[styles.bar, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.barValue}>{item.count}명</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Top 고객 */}
            {data.customerStats.topCustomers.length > 0 && (
              <View style={styles.table}>
                <Text style={styles.chartTitle}>매칭 활성 고객 Top 5</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: '60%' }]}>고객명</Text>
                  <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'right' }]}>
                    매칭 수
                  </Text>
                </View>
                {data.customerStats.topCustomers.map((customer, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '60%' }]}>{customer.name}</Text>
                    <Text style={[styles.tableCell, { width: '40%', textAlign: 'right' }]}>
                      {customer.matchCount}건
                    </Text>
                  </View>
                ))}
              </View>
            )}
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

      {/* 2페이지: 프로그램 통계 */}
      {data.programStats && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>프로그램 통계</Text>

            {/* 데이터소스별 프로그램 분포 */}
            {data.programStats.byDataSource.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>데이터소스별 프로그램 수</Text>
                {data.programStats.byDataSource.map((item, index) => {
                  const maxCount = Math.max(...data.programStats!.byDataSource.map(i => i.count));
                  const percentage = maxCount > 0 ? Math.max((item.count / maxCount) * 100, 3) : 3;

                  return (
                    <View key={index} style={styles.barContainer}>
                      <Text style={styles.barLabel}>{item.dataSource}</Text>
                      <View style={styles.barWrapper}>
                        <View style={styles.barBackground}>
                          <View
                            style={[
                              styles.bar,
                              { width: `${percentage}%`, backgroundColor: '#10B981' },
                            ]}
                          />
                        </View>
                        <Text style={styles.barValue}>{formatNumber(item.count)}개</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Top 프로그램 */}
            {data.programStats.topPrograms.length > 0 && (
              <View style={styles.table}>
                <Text style={styles.chartTitle}>인기 프로그램 Top 5</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: '70%' }]}>프로그램명</Text>
                  <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>
                    매칭 수
                  </Text>
                </View>
                {data.programStats.topPrograms.map((program, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '70%' }]}>
                      {program.title.length > 45
                        ? program.title.substring(0, 45) + '...'
                        : program.title}
                    </Text>
                    <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>
                      {program.matchCount}건
                    </Text>
                  </View>
                ))}
              </View>
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

      {/* 3페이지: 매칭 통계 */}
      {data.matchingStats && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>매칭 통계</Text>

            {/* 평균 점수 */}
            <View style={[styles.summaryCard, { width: '100%', marginBottom: 20 }]}>
              <Text style={styles.summaryLabel}>평균 매칭 점수</Text>
              <Text style={styles.summaryValue}>{data.matchingStats.averageScore}점</Text>
            </View>

            {/* 점수 분포 */}
            {data.matchingStats.scoreDistribution.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>매칭 점수 분포</Text>
                {data.matchingStats.scoreDistribution.map((item, index) => {
                  const maxCount = Math.max(
                    ...data.matchingStats!.scoreDistribution.map(i => i.count)
                  );
                  const percentage = maxCount > 0 ? Math.max((item.count / maxCount) * 100, 3) : 3;

                  // 점수대별 색상
                  const colors: Record<string, string> = {
                    '0-30': '#EF4444',
                    '31-50': '#F59E0B',
                    '51-70': '#FBBF24',
                    '71-85': '#34D399',
                    '86-100': '#10B981',
                  };

                  return (
                    <View key={index} style={styles.barContainer}>
                      <Text style={styles.barLabel}>{item.range}점</Text>
                      <View style={styles.barWrapper}>
                        <View style={styles.barBackground}>
                          <View
                            style={[
                              styles.bar,
                              {
                                width: `${percentage}%`,
                                backgroundColor: colors[item.range] || '#0052CC',
                              },
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

            {/* 일별 매칭 추이 */}
            {data.matchingStats.dailyMatchings.length > 0 && (
              <View style={styles.table}>
                <Text style={styles.chartTitle}>일별 매칭 추이</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: '50%' }]}>날짜</Text>
                  <Text style={[styles.tableHeaderCell, { width: '50%', textAlign: 'right' }]}>
                    매칭 수
                  </Text>
                </View>
                {data.matchingStats.dailyMatchings.slice(0, 10).map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '50%' }]}>
                      {formatDate(item.date)}
                    </Text>
                    <Text style={[styles.tableCell, { width: '50%', textAlign: 'right' }]}>
                      {item.count}건
                    </Text>
                  </View>
                ))}
              </View>
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

      {/* 4페이지: 고객별 매칭 키워드 */}
      {data.customerStats?.customerKeywords && data.customerStats.customerKeywords.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>고객별 매칭 키워드 분석</Text>

            {data.customerStats.customerKeywords.map((customer, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 15,
                  padding: 12,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 6,
                }}
              >
                {/* 고객 정보 헤더 */}
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}
                >
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#1F2937' }}>
                      {customer.customerName}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>
                      {customer.industry}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 9, color: '#374151' }}>
                      매칭 {customer.matchCount}건
                    </Text>
                    <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>
                      평균 {customer.avgScore}점
                    </Text>
                  </View>
                </View>

                {/* 키워드 태그 */}
                {customer.matchedKeywords.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {customer.matchedKeywords.map((keyword, kwIndex) => (
                      <Text
                        key={kwIndex}
                        style={{
                          fontSize: 8,
                          color: '#4338CA',
                          backgroundColor: '#E0E7FF',
                          padding: 3,
                          paddingLeft: 6,
                          paddingRight: 6,
                          borderRadius: 8,
                          marginRight: 4,
                          marginBottom: 4,
                        }}
                      >
                        {keyword}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
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
