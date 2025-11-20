import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-[var(--border-gray)] p-6 transition-all duration-300 ${
        hover ? 'hover:shadow-lg hover:border-[var(--primary-blue)] hover:-translate-y-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
