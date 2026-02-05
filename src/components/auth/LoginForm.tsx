'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { createClient } from '@/lib/supabase/client';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setErrors({ general: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.' });
        } else if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      // 로그인 성공 - 대시보드로 리디렉션
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">로그인</h2>
          <p className="text-[var(--text-secondary)]">계정에 로그인하여 시작하세요</p>
        </div>

        {errors.general && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
          <Input
            type="email"
            name="email"
            label="이메일"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
        </div>

        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
          <Input
            type="password"
            name="password"
            label="비밀번호"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
        </div>

        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-[var(--primary-blue)] hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          계정이 없으신가요?{' '}
          <Link
            href="/auth/signup"
            className="text-[var(--primary-blue)] hover:underline font-medium"
          >
            회원가입
          </Link>
        </p>

        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>
      </form>
    </Card>
  );
};
