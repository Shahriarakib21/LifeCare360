'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-teal-500/20 shadow-lg',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-aqua-500/20 shadow-md',
      ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-50',
      danger: 'bg-error-600 text-white hover:bg-error-700',
      success: 'bg-success-600 text-white hover:bg-success-700',
      accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-orange-500/20 shadow-lg',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base font-semibold',
    };

    const buttonType: 'button' | 'submit' | 'reset' = (type || 'button') as 'button' | 'submit' | 'reset';

    return (
      <motion.button
        ref={ref as any}
        whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        type={buttonType}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
