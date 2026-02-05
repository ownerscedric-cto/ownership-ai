import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-[var(--primary-blue)] text-white hover:bg-[var(--gradient-end)] focus:ring-2 focus:ring-[var(--primary-blue)] focus:ring-offset-2',
    secondary:
      'bg-[var(--primary-dark)] text-white hover:bg-gray-800 focus:ring-2 focus:ring-[var(--primary-dark)] focus:ring-offset-2',
    outline:
      'border-2 border-[var(--primary-blue)] text-[var(--primary-blue)] hover:bg-[var(--primary-blue)] hover:text-white focus:ring-2 focus:ring-[var(--primary-blue)] focus:ring-offset-2',
    ghost:
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
