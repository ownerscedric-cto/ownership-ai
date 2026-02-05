'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--primary-dark)] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-[var(--text-highlight)]">Ownership AI</h3>
            <p className="text-gray-300">컨설턴트를 위한 스마트한 고객 관리 플랫폼</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">문의하기</h4>
            <p className="text-gray-300">이메일: contact@ownership-ai.com</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">시작하기</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="/auth/login" className="hover:text-white transition-colors">
                  로그인
                </a>
              </li>
              <li>
                <a href="/auth/signup" className="hover:text-white transition-colors">
                  회원가입
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  개인정보 처리방침
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  이용약관
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Ownership AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
