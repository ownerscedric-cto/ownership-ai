'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

// 국세청 API 응답 타입
interface BusinessStatus {
  businessNumber: string;
  isValid: boolean;
  status: string;
  statusCode: string;
  taxType: string;
  endDate?: string;
}

interface Customer {
  id: string;
  businessNumber: string;
  businessType: string;
  corporateNumber?: string;
  name: string;
  industry?: string;
  companySize?: string;
  location?: string;
  budget?: number;
  keywords: string[];
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export default function CustomerTestPage() {
  const [output, setOutput] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // 사업자등록번호 검증 관련 상태
  const [businessNumber, setBusinessNumber] = useState<string>('');
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');

  const log = (message: string) => {
    setOutput(prev => `${prev}\n${new Date().toLocaleTimeString()} - ${message}`);
  };

  // 사업자등록번호 포맷팅 (입력 시 자동으로 하이픈 추가)
  const formatBusinessNumber = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 10)}`;
  };

  // 사업자등록번호 입력 핸들러
  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setBusinessNumber(formatted);
    // 입력이 변경되면 이전 검증 결과 초기화
    setBusinessStatus(null);
    setVerificationError('');
  };

  // 사업자등록번호 검증 함수
  const verifyBusinessNumber = async () => {
    if (!businessNumber) {
      setVerificationError('사업자등록번호를 입력해주세요');
      return;
    }

    const cleaned = businessNumber.replace(/[-\s]/g, '');
    if (cleaned.length !== 10) {
      setVerificationError('사업자등록번호는 10자리 숫자여야 합니다');
      return;
    }

    log('🔍 사업자등록번호 검증 시작...');
    setIsVerifying(true);
    setVerificationError('');
    setBusinessStatus(null);

    try {
      const response = await fetch('/api/nts/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessNumbers: [cleaned],
        }),
      });

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const status = result.data[0];
        setBusinessStatus(status);

        if (status.isValid) {
          log(`✅ 사업자 검증 성공: ${status.status} (${status.taxType})`);
        } else {
          log(`⚠️ 사업자 검증 완료: ${status.status}`);
          if (status.endDate) {
            log(`   폐업일: ${status.endDate}`);
          }
        }
      } else {
        setVerificationError(result.error?.message || '검증 실패');
        log(`❌ 사업자 검증 실패: ${result.error?.message}`);
      }
    } catch (error) {
      setVerificationError('검증 중 오류가 발생했습니다');
      log(`❌ 검증 요청 실패: ${error}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // 1. POST /api/customers - 고객 생성 테스트
  const testCreateCustomer = async () => {
    // 사업자등록번호 검증 확인
    if (!businessStatus) {
      log('⚠️ 먼저 사업자등록번호를 검증해주세요');
      setVerificationError('사업자등록번호 검증이 필요합니다');
      return;
    }

    if (!businessStatus.isValid) {
      log('⚠️ 유효하지 않은 사업자등록번호입니다');
      setVerificationError('유효한 사업자만 등록할 수 있습니다');
      return;
    }

    log('🔵 [POST] 고객 생성 요청 시작...');
    try {
      const testData = {
        businessNumber: businessStatus.businessNumber, // 검증된 사업자등록번호 사용
        businessType: 'INDIVIDUAL', // 개인사업자
        name: '테스트 고객 ' + Date.now(),
        industry: 'IT 서비스',
        companySize: '10-50명',
        location: '서울',
        budget: 50000000,
        keywords: ['인력 부족', '자금 확보', '매출 증대', 'R&D 지원'], // 통합된 키워드
        contactEmail: 'test@example.com',
        contactPhone: '010-1234-5678',
        notes: `검증된 사업자 - 상태: ${businessStatus.status}, 과세유형: ${businessStatus.taxType}`,
      };

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (result.success && result.data) {
        log(`✅ [POST] 고객 생성 성공! ID: ${result.data.id}`);
        log(`   - 사업자명: ${result.data.name}`);
        log(`   - 사업자등록번호: ${result.data.businessNumber}`);
        setSelectedCustomerId(result.data.id);
      } else {
        log(`❌ [POST] 고객 생성 실패: ${result.error?.message}`);
        log(`   - Error Code: ${result.error?.code}`);
        if (result.error?.details) {
          log(`   - Details: ${JSON.stringify(result.error.details)}`);
        }
      }
    } catch (error) {
      log(`❌ [POST] 요청 실패: ${error}`);
    }
  };

  // 2. GET /api/customers - 고객 목록 조회 테스트
  const testListCustomers = async () => {
    log('🔵 [GET] 고객 목록 조회 요청 시작...');
    try {
      const response = await fetch(
        '/api/customers?page=1&limit=10&sortBy=createdAt&sortOrder=desc'
      );

      const result: ApiResponse<Customer[]> = await response.json();

      if (result.success && result.data) {
        log(`✅ [GET] 고객 목록 조회 성공!`);
        log(`   - 총 고객 수: ${result.metadata?.total}`);
        log(`   - 현재 페이지: ${result.metadata?.page}`);
        log(`   - 페이지당 개수: ${result.metadata?.limit}`);
        log(`   - 총 페이지 수: ${result.metadata?.totalPages}`);
        log(`   - 조회된 고객 수: ${result.data.length}`);

        setCustomers(result.data);

        result.data.forEach((customer, index) => {
          log(`   ${index + 1}. ${customer.name} (${customer.businessNumber})`);
        });
      } else {
        log(`❌ [GET] 고객 목록 조회 실패: ${result.error?.message}`);
      }
    } catch (error) {
      log(`❌ [GET] 요청 실패: ${error}`);
    }
  };

  // 3. GET /api/customers/[id] - 고객 상세 조회 테스트
  const testGetCustomer = async () => {
    if (!selectedCustomerId) {
      log('⚠️ 먼저 고객을 생성하거나 선택해주세요');
      return;
    }

    log(`🔵 [GET] 고객 상세 조회 요청 시작... (ID: ${selectedCustomerId})`);
    try {
      const response = await fetch(`/api/customers/${selectedCustomerId}`);

      const result: ApiResponse<Customer> = await response.json();

      if (result.success && result.data) {
        log(`✅ [GET] 고객 상세 조회 성공!`);
        log(`   - ID: ${result.data.id}`);
        log(`   - 사업자명: ${result.data.name}`);
        log(`   - 사업자등록번호: ${result.data.businessNumber}`);
        log(`   - 업종: ${result.data.industry || '없음'}`);
        log(`   - 위치: ${result.data.location || '없음'}`);
        log(`   - 예산: ${result.data.budget?.toLocaleString() || '없음'}원`);
      } else {
        log(`❌ [GET] 고객 상세 조회 실패: ${result.error?.message}`);
      }
    } catch (error) {
      log(`❌ [GET] 요청 실패: ${error}`);
    }
  };

  // 4. PUT /api/customers/[id] - 고객 수정 테스트
  const testUpdateCustomer = async () => {
    if (!selectedCustomerId) {
      log('⚠️ 먼저 고객을 생성하거나 선택해주세요');
      return;
    }

    log(`🔵 [PUT] 고객 수정 요청 시작... (ID: ${selectedCustomerId})`);
    try {
      const updateData = {
        name: '수정된 고객명 ' + Date.now(),
        industry: '제조업',
        location: '부산',
        budget: 100000000,
        notes: '수정된 노트입니다',
      };

      const response = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (result.success && result.data) {
        log(`✅ [PUT] 고객 수정 성공!`);
        log(`   - 새 사업자명: ${result.data.name}`);
        log(`   - 새 업종: ${result.data.industry}`);
        log(`   - 새 위치: ${result.data.location}`);
        log(`   - 새 예산: ${result.data.budget?.toLocaleString()}원`);
      } else {
        log(`❌ [PUT] 고객 수정 실패: ${result.error?.message}`);
      }
    } catch (error) {
      log(`❌ [PUT] 요청 실패: ${error}`);
    }
  };

  // 5. DELETE /api/customers/[id] - 고객 삭제 테스트
  const testDeleteCustomer = async () => {
    if (!selectedCustomerId) {
      log('⚠️ 먼저 고객을 생성하거나 선택해주세요');
      return;
    }

    if (!confirm(`정말로 고객 (ID: ${selectedCustomerId})을 삭제하시겠습니까?`)) {
      log('⚠️ 삭제 취소됨');
      return;
    }

    log(`🔵 [DELETE] 고객 삭제 요청 시작... (ID: ${selectedCustomerId})`);
    try {
      const response = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<{ message: string }> = await response.json();

      if (result.success) {
        log(`✅ [DELETE] 고객 삭제 성공!`);
        log(`   - ${result.data?.message}`);
        setSelectedCustomerId('');
      } else {
        log(`❌ [DELETE] 고객 삭제 실패: ${result.error?.message}`);
      }
    } catch (error) {
      log(`❌ [DELETE] 요청 실패: ${error}`);
    }
  };

  // 6. 전체 테스트 실행
  const runAllTests = async () => {
    log('🚀 전체 API 테스트 시작...');
    log('═══════════════════════════════════════');

    await testCreateCustomer();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testListCustomers();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testGetCustomer();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testUpdateCustomer();
    await new Promise(resolve => setTimeout(resolve, 500));

    log('═══════════════════════════════════════');
    log('✅ 전체 API 테스트 완료!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Customer API 테스트 페이지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 테스트 버튼 영역 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API 테스트</h2>

            {/* 사업자등록번호 입력 및 검증 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="text-sm font-semibold mb-3">사업자등록번호 검증</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">사업자등록번호</label>
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={handleBusinessNumberChange}
                    placeholder="123-45-67890"
                    maxLength={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isVerifying}
                  />
                  <p className="text-xs text-gray-500 mt-1">10자리 숫자 (하이픈 자동 입력)</p>
                </div>

                <Button
                  onClick={verifyBusinessNumber}
                  className="w-full"
                  disabled={isVerifying || !businessNumber}
                >
                  {isVerifying ? '⏳ 검증 중...' : '🔍 사업자 검증'}
                </Button>

                {/* 검증 결과 표시 */}
                {verificationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">❌ {verificationError}</p>
                  </div>
                )}

                {businessStatus && (
                  <div
                    className={`p-3 border rounded ${
                      businessStatus.isValid
                        ? 'bg-green-50 border-green-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {businessStatus.isValid ? '✅ 유효한 사업자' : '⚠️ ' + businessStatus.status}
                    </p>
                    <p className="text-xs text-gray-600">상태: {businessStatus.status}</p>
                    <p className="text-xs text-gray-600">과세유형: {businessStatus.taxType}</p>
                    {businessStatus.endDate && (
                      <p className="text-xs text-gray-600">폐업일: {businessStatus.endDate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={runAllTests} className="w-full">
                🚀 전체 테스트 실행
              </Button>

              <hr />

              <Button onClick={testCreateCustomer} className="w-full">
                1. POST - 고객 생성
              </Button>

              <Button onClick={testListCustomers} className="w-full">
                2. GET - 고객 목록 조회
              </Button>

              <Button onClick={testGetCustomer} className="w-full">
                3. GET/:id - 고객 상세 조회
              </Button>

              <Button onClick={testUpdateCustomer} className="w-full">
                4. PUT/:id - 고객 수정
              </Button>

              <Button
                onClick={testDeleteCustomer}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                5. DELETE/:id - 고객 삭제
              </Button>

              <hr />

              <Button onClick={() => setOutput('')} variant="secondary" className="w-full">
                🗑️ 로그 지우기
              </Button>
            </div>

            {/* 선택된 고객 ID */}
            {selectedCustomerId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-900">
                  선택된 고객 ID: <span className="font-mono">{selectedCustomerId}</span>
                </p>
              </div>
            )}

            {/* 고객 목록 */}
            {customers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">고객 목록:</h3>
                <div className="space-y-2">
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCustomerId === customer.id ? 'bg-blue-50 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.businessNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 로그 출력 영역 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">실행 로그</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded h-[600px] overflow-y-auto text-xs font-mono whitespace-pre-wrap">
              {output || '로그가 여기에 표시됩니다...'}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
