'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage('이메일을 입력해주세요');
      setStatus('error');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('유효한 이메일 주소를 입력해주세요');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        setErrorMessage(data.error?.message || '요청 처리 중 오류가 발생했습니다');
        setStatus('error');
      }
    } catch {
      setErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      setStatus('error');
    }
  };

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
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">이메일 발송 완료</h2>
              <p className="text-[var(--text-secondary)]">
                입력하신 이메일 주소로 비밀번호 재설정 링크를 발송했습니다.
                <br />
                이메일을 확인해주세요.
              </p>
              <p className="text-sm text-gray-500">
                이메일이 도착하지 않는다면 스팸함을 확인하거나 다시 시도해주세요.
              </p>
              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStatus('idle');
                    setEmail('');
                  }}
                >
                  다시 요청하기
                </Button>
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

  // 입력 화면
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
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">비밀번호 찾기</h2>
              <p className="text-[var(--text-secondary)]">
                가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>
            </div>

            {status === 'error' && errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
              <Input
                type="email"
                name="email"
                label="이메일"
                placeholder="your@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (status === 'error') {
                    setStatus('idle');
                    setErrorMessage('');
                  }
                }}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={status === 'submitting'}>
              {status === 'submitting' ? '발송 중...' : '재설정 링크 발송'}
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
