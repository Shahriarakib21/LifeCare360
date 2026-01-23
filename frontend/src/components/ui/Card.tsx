'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'large';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      hover = false,
      padding = 'md',
      shadow = 'soft',
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const shadowClasses = {
      none: '',
      soft: 'shadow-soft',
      medium: 'shadow-medium',
      large: 'shadow-lg',
    };

    const Component = (hover ? motion.div : 'div') as any;
    const motionProps = hover
      ? {
        whileHover: { y: -2 },
        transition: { duration: 0.2 },
      }
      : {};

    return (
      <Component
        ref={ref}
        className={cn(
          'bg-white rounded-2xl border border-secondary-100',
          paddingClasses[padding],
          shadowClasses[shadow],
          hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-medium',
          className
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;

