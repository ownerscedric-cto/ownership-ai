'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Building, User, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';

interface FormData {
  email: string;
  name: string;
  companyName: string;
}

interface FormErrors {
  email?: string;
  name?: string;
}

export const InvitationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요';
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

    try {
      const response = await fetch('/api/invitation/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // 서버에서 반환한 에러 메시지 사용
        setErrors({ email: data.error || '신청에 실패했습니다' });
        return;
      }

      setIsSuccess(true);
      setFormData({ email: '', name: '', companyName: '' });
    } catch (error) {
      console.error('Invitation submission error:', error);
      setErrors({ email: '신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (isSuccess) {
    return (
      <section id="invitation" className="py-20 bg-[var(--bg-gray-50)]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="text-center">
              <CheckCircle2 className="w-16 h-16 text-[var(--success)] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                신청이 완료되었습니다!
              </h3>
              <p className="text-[var(--text-secondary)]">
                입력하신 이메일로 초대 안내를 보내드리겠습니다.
                <br />
                빠른 시일 내에 연락드리겠습니다.
              </p>
              <Button className="mt-6" onClick={() => setIsSuccess(false)}>
                추가 신청하기
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="invitation-form" className="py-20 bg-[var(--bg-gray-50)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4">
            베타 테스터를 모집합니다
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            초대 기반 서비스로 운영됩니다. 이메일 주소를 남겨주시면
            <br />
            우선 초대 안내를 보내드립니다.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl mx-auto"
        >
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? '신청 중...' : '초대 신청하기'}
              </Button>

              <p className="text-xs text-[var(--text-secondary)] text-center">
                신청하시면 개인정보 처리방침에 동의하는 것으로 간주됩니다
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
