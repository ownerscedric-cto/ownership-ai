'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Building, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { createClient } from '@/lib/supabase/client';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  companyName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다';
    }
    if (!/[A-Z]/.test(password)) {
      return '비밀번호는 최소 1개의 대문자를 포함해야 합니다';
    }
    if (!/[a-z]/.test(password)) {
      return '비밀번호는 최소 1개의 소문자를 포함해야 합니다';
    }
    if (!/[0-9]/.test(password)) {
      return '비밀번호는 최소 1개의 숫자를 포함해야 합니다';
    }
    return null;
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
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요';
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 최소 2자 이상이어야 합니다';
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

      // Supabase Auth로 회원가입 (이메일 확인 필요)
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company_name: formData.companyName || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      // 성공 메시지 표시
      setIsSuccess(true);
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.' });
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

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 text-[var(--success)] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          이메일을 확인해주세요!
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          {formData.email}로 확인 이메일을 전송했습니다.
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          이메일의 링크를 클릭하여 계정을 활성화한 후 로그인할 수 있습니다.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block">
          <Button variant="secondary">로그인 페이지로 이동</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">회원가입</h2>
          <p className="text-[var(--text-secondary)]">새 계정을 만들어 시작하세요</p>
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
          <User className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
          <Input
            type="text"
            name="name"
            label="이름"
            placeholder="홍길동"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
        </div>

        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
          <Input
            type="text"
            name="companyName"
            label="회사명 (선택)"
            placeholder="회사명을 입력하세요"
            value={formData.companyName}
            onChange={handleChange}
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

        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-[var(--primary-blue)] mt-3" />
          <Input
            type="password"
            name="confirmPassword"
            label="비밀번호 확인"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
        </div>

        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <p>비밀번호 요구사항:</p>
          <ul className="list-disc list-inside ml-2">
            <li>최소 8자 이상</li>
            <li>대문자, 소문자, 숫자 각 1개 이상 포함</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? '가입 중...' : '회원가입'}
        </Button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/auth/login"
            className="text-[var(--primary-blue)] hover:underline font-medium"
          >
            로그인
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
