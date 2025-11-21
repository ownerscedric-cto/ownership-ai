'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

interface BusinessStatus {
  businessNumber: string;
  isValid: boolean;
  status: string;
  statusCode: string;
  taxType: string;
  endDate?: string;
}

interface ApiResponse {
  success: boolean;
  data?: BusinessStatus[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export default function NtsTestPage() {
  const [output, setOutput] = useState<string>('');
  const [businessNumber, setBusinessNumber] = useState<string>('');
  const [results, setResults] = useState<BusinessStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setBusinessNumber(formatted);
  };

  // 1. 단일 사업자등록번호 조회 테스트
  const testSingleVerification = async () => {
    if (!businessNumber) {
      log('⚠️ 사업자등록번호를 입력해주세요');
      return;
    }

    log('🔵 [POST] 사업자등록번호 진위확인 요청 시작...');
    log(`   - 입력: ${businessNumber}`);
    setIsLoading(true);

    try {
      const response = await fetch('/api/nts/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessNumbers: [businessNumber.replace(/[-\s]/g, '')],
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const business = result.data[0];
        log(`✅ [POST] 사업자 정보 조회 성공!`);
        log(`   - 사업자등록번호: ${business.businessNumber}`);
        log(`   - 유효 여부: ${business.isValid ? '✅ 유효' : '❌ 유효하지 않음'}`);
        log(`   - 사업자 상태: ${business.status} (코드: ${business.statusCode})`);
        log(`   - 과세 유형: ${business.taxType}`);
        if (business.endDate) {
          log(`   - 폐업일: ${business.endDate}`);
        }
        setResults([business]);
      } else {
        log(`❌ [POST] 사업자 정보 조회 실패: ${result.error?.message}`);
        log(`   - Error Code: ${result.error?.code}`);
        if (result.error?.details) {
          log(`   - Details: ${JSON.stringify(result.error.details)}`);
        }
      }
    } catch (error) {
      log(`❌ [POST] 요청 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 여러 사업자등록번호 일괄 조회 테스트
  const testBatchVerification = async () => {
    const testNumbers = [
      '1234567890', // 테스트용 (실제 존재하지 않을 수 있음)
      '1068627903', // 예시 사업자등록번호
      '2208800549', // 예시 사업자등록번호
    ];

    log('🔵 [POST] 일괄 사업자등록번호 진위확인 요청 시작...');
    log(`   - 입력: ${testNumbers.join(', ')}`);
    setIsLoading(true);

    try {
      const response = await fetch('/api/nts/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessNumbers: testNumbers,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        log(`✅ [POST] 일괄 조회 성공! (총 ${result.data.length}개)`);
        log('═══════════════════════════════════════');

        result.data.forEach((business, index) => {
          log(`${index + 1}. ${business.businessNumber}`);
          log(`   - 유효 여부: ${business.isValid ? '✅ 유효' : '❌ 유효하지 않음'}`);
          log(`   - 사업자 상태: ${business.status}`);
          log(`   - 과세 유형: ${business.taxType}`);
          if (business.endDate) {
            log(`   - 폐업일: ${business.endDate}`);
          }
          log('───────────────────────────────────────');
        });

        setResults(result.data);
      } else {
        log(`❌ [POST] 일괄 조회 실패: ${result.error?.message}`);
        log(`   - Error Code: ${result.error?.code}`);
        if (result.error?.details) {
          log(`   - Details: ${JSON.stringify(result.error.details)}`);
        }
      }
    } catch (error) {
      log(`❌ [POST] 요청 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 유효하지 않은 형식 테스트
  const testInvalidFormat = async () => {
    const invalidNumber = '12345'; // 10자리가 아닌 숫자

    log('🔵 [POST] 유효하지 않은 형식 테스트...');
    log(`   - 입력: ${invalidNumber}`);
    setIsLoading(true);

    try {
      const response = await fetch('/api/nts/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessNumbers: [invalidNumber],
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        log(`✅ [POST] 예상치 못한 성공`);
      } else {
        log(`✅ [POST] 예상대로 실패함`);
        log(`   - Error Code: ${result.error?.code}`);
        log(`   - Message: ${result.error?.message}`);
      }
    } catch (error) {
      log(`❌ [POST] 요청 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 전체 테스트 실행
  const runAllTests = async () => {
    log('🚀 전체 API 테스트 시작...');
    log('═══════════════════════════════════════');

    // 테스트 1: 단일 조회 (유효한 번호 필요)
    setBusinessNumber('106-86-27903');
    await new Promise(resolve => setTimeout(resolve, 500));
    await testSingleVerification();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 테스트 2: 일괄 조회
    await testBatchVerification();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 테스트 3: 유효하지 않은 형식
    await testInvalidFormat();

    log('═══════════════════════════════════════');
    log('✅ 전체 API 테스트 완료!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">국세청 사업자등록정보 API 테스트</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 테스트 버튼 영역 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API 테스트</h2>

            {/* 사업자등록번호 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">사업자등록번호</label>
              <input
                type="text"
                value={businessNumber}
                onChange={handleInputChange}
                placeholder="123-45-67890"
                maxLength={12}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">10자리 숫자 (하이픈 자동 입력)</p>
            </div>

            <div className="space-y-3">
              <Button onClick={runAllTests} className="w-full" disabled={isLoading}>
                🚀 전체 테스트 실행
              </Button>

              <hr />

              <Button
                onClick={testSingleVerification}
                className="w-full"
                disabled={isLoading || !businessNumber}
              >
                1. POST - 단일 사업자 조회
              </Button>

              <Button onClick={testBatchVerification} className="w-full" disabled={isLoading}>
                2. POST - 일괄 사업자 조회 (3개)
              </Button>

              <Button onClick={testInvalidFormat} className="w-full" disabled={isLoading}>
                3. POST - 유효하지 않은 형식 테스트
              </Button>

              <hr />

              <Button
                onClick={() => {
                  setOutput('');
                  setResults([]);
                }}
                variant="secondary"
                className="w-full"
                disabled={isLoading}
              >
                🗑️ 로그 지우기
              </Button>
            </div>

            {/* 로딩 표시 */}
            {isLoading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-900">⏳ API 요청 중...</p>
              </div>
            )}

            {/* 조회 결과 목록 */}
            {results.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">조회 결과:</h3>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded ${
                        result.isValid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {result.businessNumber} {result.isValid ? '✅' : '❌'}
                      </p>
                      <p className="text-xs text-gray-600">{result.status}</p>
                      <p className="text-xs text-gray-500">{result.taxType}</p>
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

        {/* API 정보 */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">API 정보</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>엔드포인트:</strong> POST /api/nts/verify
            </p>
            <p>
              <strong>요청 형식:</strong> JSON
            </p>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(
                {
                  businessNumbers: ['1234567890', '9876543210'],
                },
                null,
                2
              )}
            </pre>
            <p>
              <strong>응답 형식:</strong> JSON
            </p>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(
                {
                  success: true,
                  data: [
                    {
                      businessNumber: '1234567890',
                      isValid: true,
                      status: '계속사업자',
                      statusCode: '01',
                      taxType: '부가가치세 일반과세자',
                    },
                  ],
                },
                null,
                2
              )}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
