'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

const benefits = [
  '정식 출시 전까지 모든 기능 무료 사용',
  '정식 출시 후 6개월간 50% 할인',
  '전담 고객 지원 및 우선 피드백',
  '신규 기능 먼저 체험',
];

export const FinalCTASection: React.FC = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById('invitation-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--gradient-end)] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              <span className="text-[var(--text-highlight)]">지금 시작하세요</span>
              <br />
              <span className="text-[var(--text-highlight)]">미래를 먼저 경험하는 기회</span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              베타 테스터로 선정되어 Ownership AI를 먼저 경험해보세요
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center justify-center md:justify-start gap-3 text-left"
              >
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center bg-white text-[var(--primary-blue)] hover:bg-gray-100 font-bold px-8 py-4 text-lg rounded-lg transition-all duration-200 group"
            >
              베타 테스터 신청하기
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Limited Offer Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-white/80 text-sm"
          >
            ⏰ 베타 테스터 모집은 선착순 100명으로 제한됩니다
          </motion.p>
        </div>
      </div>
    </section>
  );
};
