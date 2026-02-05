'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Card } from '../common/Card';

const testimonials = [
  {
    name: '정다은',
    role: '경영컨설턴트',
    company: '비전컨설팅',
    content:
      '고객 정보가 엑셀에 흩어져 있어서 매번 찾는 데 시간이 너무 오래 걸렸어요. Ownership AI 덕분에 이제는 클릭 몇 번으로 고객에게 딱 맞는 지원사업을 찾아 알려줄 수 있게 되었습니다.',
    avatar: 'https://ui-avatars.com/api/?name=정다은&background=0052cc&color=fff',
  },
  {
    name: '최민준',
    role: '창업컨설턴트',
    company: '그로스파트너스',
    content:
      '정부지원사업 공고를 일일이 확인하고 고객에게 연락하는 게 정말 힘들었는데, 이제는 AI가 자동으로 매칭해주니 시간도 절약되고 고객 만족도도 훨씬 높아졌어요.',
    avatar: 'https://ui-avatars.com/api/?name=최민준&background=0052cc&color=fff',
  },
  {
    name: '강서연',
    role: 'R&D컨설턴트',
    company: '테크솔루션',
    content:
      '베타 테스터로 참여한 지 3개월 만에 매출이 30% 이상 증가했습니다. 놓쳤던 기회들을 이제는 놓치지 않게 되었고, 고객들도 적시에 정보를 받아서 매우 만족해합니다.',
    avatar: 'https://ui-avatars.com/api/?name=강서연&background=0052cc&color=fff',
  },
];

export const SocialProofSection: React.FC = () => {
  return (
    <section className="py-20 bg-[var(--bg-gray-50)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            베타 테스터들의 이야기
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            먼저 경험한 컨설턴트들의 생생한 후기
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card hover className="h-full p-8">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-[var(--primary-blue)] opacity-20 mb-4" />

                {/* Testimonial Content */}
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                  {testimonial.content}
                </p>

                {/* Author */}
                <div className="flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                    loading="lazy"
                  />
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {testimonial.role} · {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap justify-center items-center gap-8 text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--primary-blue)]">100+</span>
              <span className="text-sm">베타 테스터</span>
            </div>
            <div className="hidden lg:block w-px h-8 bg-[var(--border-gray)]" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--primary-blue)]">95%</span>
              <span className="text-sm">만족도</span>
            </div>
            <div className="hidden lg:block w-px h-8 bg-[var(--border-gray)]" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--primary-blue)]">5,000+</span>
              <span className="text-sm">매칭 성공</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
