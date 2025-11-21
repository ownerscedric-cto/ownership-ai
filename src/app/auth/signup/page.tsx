import React from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-dark)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-highlight)] mb-2">Ownership AI</h1>
          <p className="text-white/90">컨설턴트를 위한 스마트한 고객 관리</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
