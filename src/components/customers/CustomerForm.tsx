'use client';

import { useState, useEffect } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { createCustomerSchema, type CreateCustomerInput } from '@/lib/validations/customer';
import type { Customer } from '@/lib/types/customer';
import { LOCATIONS } from '@/lib/constants/locations';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CreateCustomerInput) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const [businessNumber, setBusinessNumber] = useState(customer?.businessNumber || '');
  const [businessStatus, setBusinessStatus] = useState<{
    isValid: boolean;
    status: string;
    taxType: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // 태그 입력을 위한 state
  const [challengeInput, setChallengeInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      businessNumber: customer?.businessNumber || '',
      businessType: (customer?.businessType as 'INDIVIDUAL' | 'CORPORATE') || 'INDIVIDUAL',
      corporateNumber: customer?.corporateNumber || '',
      name: customer?.name || '',
      industry: customer?.industry || '',
      companySize: customer?.companySize || '',
      location: customer?.location || '',
      budget: customer?.budget || undefined,
      challenges: customer?.challenges || [],
      goals: customer?.goals || [],
      preferredKeywords: customer?.preferredKeywords || [],
      contactEmail: customer?.contactEmail || '',
      contactPhone: customer?.contactPhone || '',
      notes: customer?.notes || '',
    },
  });

  // 사업자등록번호 포맷팅
  const formatBusinessNumber = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 10)}`;
  };

  // 사업자등록번호 검증
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

        if (!status.isValid) {
          setVerificationError(`${status.status} - 등록이 제한될 수 있습니다`);
        }
      } else {
        setVerificationError(result.error?.message || '검증 실패');
      }
    } catch {
      setVerificationError('검증 중 오류가 발생했습니다');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBusinessNumberChange = (value: string) => {
    const formatted = formatBusinessNumber(value);
    setBusinessNumber(formatted);
    form.setValue('businessNumber', formatted.replace(/[-\s]/g, ''));
    setBusinessStatus(null);
    setVerificationError('');
  };

  // customer가 변경되면 form 초기화
  useEffect(() => {
    if (customer) {
      const formattedNumber = formatBusinessNumber(customer.businessNumber);
      setBusinessNumber(formattedNumber);

      form.reset({
        businessNumber: customer.businessNumber,
        businessType: customer.businessType as 'INDIVIDUAL' | 'CORPORATE',
        corporateNumber: customer.corporateNumber || '',
        name: customer.name,
        industry: customer.industry || '',
        companySize: customer.companySize || '',
        location: customer.location || '',
        budget: customer.budget || undefined,
        challenges: customer.challenges || [],
        goals: customer.goals || [],
        preferredKeywords: customer.preferredKeywords || [],
        contactEmail: customer.contactEmail || '',
        contactPhone: customer.contactPhone || '',
        notes: customer.notes || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]); // customer.id가 변경될 때만 form 초기화

  const handleSubmit = (data: CreateCustomerInput) => {
    onSubmit(data);
  };

  const handleInvalidSubmit = (errors: FieldErrors<CreateCustomerInput>) => {
    console.error('Form validation error:', errors);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)} className="space-y-6">
        {/* 사업자등록번호 & 검증 */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-sm">사업자등록번호 검증 *</h3>

          <div className="flex gap-2">
            <Input
              value={businessNumber}
              onChange={e => handleBusinessNumberChange(e.target.value)}
              placeholder="123-45-67890"
              maxLength={12}
              disabled={isVerifying || !!customer}
            />
            <Button
              type="button"
              onClick={verifyBusinessNumber}
              disabled={isVerifying || !businessNumber || !!customer}
              variant="outline"
            >
              {isVerifying ? '⏳ 검증 중...' : '🔍 검증'}
            </Button>
          </div>

          {verificationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              ❌ {verificationError}
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
            </div>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업자 구분 *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">개인사업자</SelectItem>
                    <SelectItem value="CORPORATE">법인사업자</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 법인등록번호 (법인사업자만) */}
          {form.watch('businessType') === 'CORPORATE' && (
            <FormField
              control={form.control}
              name="corporateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>법인등록번호</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890123 (13자리)"
                      maxLength={13}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>고객명 (회사명) *</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동 or 주식회사 ABC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>업종</FormLabel>
                <FormControl>
                  <Input placeholder="IT 서비스, 제조업 등" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>기업 규모</FormLabel>
                <FormControl>
                  <Input placeholder="10명 미만, 10-50명 등" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>지역 *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="지역을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LOCATIONS.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예산</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000000"
                    value={field.value ?? ''}
                    onChange={e =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormDescription>원 단위로 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 연락처 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>전화번호</FormLabel>
                <FormControl>
                  <Input placeholder="010-1234-5678" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 도전과제 */}
        <FormField
          control={form.control}
          name="challenges"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도전과제</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="도전과제 입력 후 엔터"
                    value={challengeInput}
                    onChange={e => setChallengeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    onKeyUp={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        const trimmed = challengeInput.trim();
                        if (trimmed && !field.value?.includes(trimmed)) {
                          field.onChange([...(field.value || []), trimmed]);
                          setChallengeInput('');
                        }
                      }
                    }}
                  />
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((item, index) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          {item}
                          <button
                            type="button"
                            onClick={() => {
                              const newArray = field.value?.filter((_, i) => i !== index);
                              field.onChange(newArray);
                            }}
                            className="ml-1 hover:bg-gray-200 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>입력 후 엔터키를 눌러 추가하세요</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 목표 */}
        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>목표</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="목표 입력 후 엔터"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        const trimmed = goalInput.trim();
                        if (trimmed && !field.value?.includes(trimmed)) {
                          field.onChange([...(field.value || []), trimmed]);
                          setGoalInput('');
                        }
                      }
                    }}
                  />
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((item, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {item}
                          <button
                            type="button"
                            onClick={() => {
                              const newArray = field.value?.filter((_, i) => i !== index);
                              field.onChange(newArray);
                            }}
                            className="ml-1 hover:bg-gray-200 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>입력 후 엔터키를 눌러 추가하세요</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 선호 키워드 */}
        <FormField
          control={form.control}
          name="preferredKeywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>선호 키워드</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="키워드 입력 후 엔터"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        const trimmed = keywordInput.trim();
                        if (trimmed && !field.value?.includes(trimmed)) {
                          field.onChange([...(field.value || []), trimmed]);
                          setKeywordInput('');
                        }
                      }
                    }}
                  />
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((item, index) => (
                        <Badge key={index} variant="default" className="gap-1">
                          {item}
                          <button
                            type="button"
                            onClick={() => {
                              const newArray = field.value?.filter((_, i) => i !== index);
                              field.onChange(newArray);
                            }}
                            className="ml-1 hover:bg-blue-700 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>입력 후 엔터키를 눌러 추가하세요</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 메모 */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="고객 관련 메모를 입력하세요"
                  rows={4}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={isLoading || (!customer && !businessStatus?.isValid)}>
            {isLoading ? '저장 중...' : customer ? '수정하기' : '등록하기'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
