'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '../common/Card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card hover className="h-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--gradient-end)] rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{title}</h3>
        <p className="text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </Card>
    </motion.div>
  );
};
