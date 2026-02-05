'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: '무료 체험 기간이 있나요?',
    answer: '베타 테스터로 선정되시면 정식 출시 전까지 무료로 모든 기능을 이용하실 수 있습니다.',
  },
  {
    question: '얼마나 많은 고객 정보를 등록할 수 있나요?',
    answer:
      '베타 기간 중에는 제한 없이 고객 정보를 등록하실 수 있습니다. 정식 출시 후에는 요금제에 따라 다른 한도가 적용될 예정입니다.',
  },
  {
    question: 'AI 매칭은 어떻게 작동하나요?',
    answer:
      '고객의 업종, 지역, 관심사 등을 분석하여 정부지원사업 데이터베이스에서 가장 적합한 사업을 자동으로 찾아드립니다. 매칭 정확도는 사용할수록 향상됩니다.',
  },
  {
    question: '이메일과 SMS 발송 비용은 어떻게 되나요?',
    answer: '베타 기간 중에는 월 100건의 이메일과 50건의 SMS를 무료로 발송하실 수 있습니다.',
  },
  {
    question: '데이터 보안은 어떻게 보장되나요?',
    answer:
      '모든 고객 데이터는 암호화되어 저장되며, 산업 표준 보안 프로토콜을 준수합니다. 귀하의 데이터는 철저히 보호됩니다.',
  },
  {
    question: '기존 엑셀 데이터를 가져올 수 있나요?',
    answer:
      '네, CSV 파일을 통해 기존 고객 데이터를 간편하게 가져오실 수 있습니다. 자세한 가이드는 베타 테스터에게 제공됩니다.',
  },
  {
    question: '베타 테스터는 어떤 혜택을 받나요?',
    answer:
      '베타 테스터는 정식 출시 전까지 모든 기능을 무료로 사용하실 수 있으며, 정식 출시 후 최소 6개월간 50% 할인된 요금으로 이용하실 수 있습니다.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            자주 묻는 질문
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            궁금하신 점을 확인해보세요
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="mb-4"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full bg-[var(--bg-gray-50)] hover:bg-[var(--bg-gray-100)] rounded-lg p-6 text-left transition-colors"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] pr-4">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-[var(--primary-blue)]" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
