'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { createClient } from '@/lib/supabase/client';

type PageStatus = 'loading' | 'ready' | 'submitting' | 'success' | 'error';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 페이지 로드 시 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setStatus('ready');
      } else {
        // 세션이 없으면 이메일 링크가 유효하지 않음
        setStatus('error');
        setErrors({
          general: '유효하지 않거나 만료된 링크입니다. 비밀번호 재설정을 다시 요청해주세요.',
        });
      }
    };

    checkSession();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = '새 비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (!/[A-Za-z]/.test(formData.password)) {
      newErrors.password = '비밀번호에 영문자가 포함되어야 합니다';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = '비밀번호에 숫자가 포함되어야 합니다';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus('submitting');
    setErrors({});

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setErrors({ general: data.error?.message || '비밀번호 변경에 실패했습니다' });
        setStatus('ready');
      }
    } catch {
      setErrors({ general: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' });
      setStatus('ready');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // 로딩 화면
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-dark)] p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-highlight)] mb-2">Ownership AI</h1>
            <p className="text-white/90">컨설턴트를 위한 스마트한 고객 관리</p>
          </div>
          <Card className="w-full max-w-md">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-blue)] mx-auto"></div>
              <p className="mt-4 text-[var(--text-secondary)]">링크 확인 중...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 에러 화면 (세션 없음)
  if (status === 'error' && errors.general && !formData.password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-dark)] p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-highlight)] mb-2">Ownership AI</h1>
            <p className="text-white/90">컨설턴트를 위한 스마트한 고객 관리</p>
          </div>
          <Card className="w-full max-w-md">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">링크 만료</h2>
              <p className="text-[var(--text-secondary)]">{errors.general}</p>
              <div className="pt-4 space-y-3">
                <Link href="/auth/forgot-password" className="block">
                  <Button className="w-full">비밀번호 재설정 다시 요청</Button>
                </Link>
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    로그인으로 돌아가기
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 성공 화면
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-dark)] p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--text-highlight)] mb-2">Ownership AI</h1>
            <p className="text-white/90">컨설턴트를 위한 스마트한 고객 관리</p>
          </div>
          <Card className="w-full max-w-md">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">비밀번호 변경 완료</h2>
              <p className="text-[var(--text-secondary)]">
                비밀번호가 성공적으로 변경되었습니다.
                <br />
                잠시 후 로그인 페이지로 이동합니다.
              </p>
              <div className="pt-4">
                <Link href="/auth/login" className="block">
                  <Button className="w-full">로그인하기</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 비밀번호 입력 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-dark)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-highlight)] mb-2">Ownership AI</h1>
          <p className="text-white/90">컨설턴트를 위한 스마트한 고객 관리</p>
        </div>
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                새 비밀번호 설정
              </h2>
              <p className="text-[var(--text-secondary)]">안전한 새 비밀번호를 입력해주세요.</p>
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
              <div className="flex-1 relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  label="새 비밀번호"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
              <div className="flex-1 relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  label="비밀번호 확인"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>비밀번호 조건:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                  최소 8자 이상
                </li>
                <li className={/[A-Za-z]/.test(formData.password) ? 'text-green-600' : ''}>
                  영문자 포함
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  숫자 포함
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={status === 'submitting'}>
              {status === 'submitting' ? '변경 중...' : '비밀번호 변경'}
            </Button>

            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>로그인으로 돌아가기</span>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
