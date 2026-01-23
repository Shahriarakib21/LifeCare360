'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FuturisticBadgeProps {
    children: React.ReactNode;
    variant?: 'cyan' | 'violet' | 'teal' | 'red' | 'gray';
    glow?: boolean;
    className?: string;
}

const FuturisticBadge = ({
    children,
    variant = 'cyan',
    glow = true,
    className,
}: FuturisticBadgeProps) => {
    const variantClasses = {
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
        teal: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
        red: 'bg-red-500/10 text-red-400 border-red-500/30',
        gray: 'bg-white/5 text-gray-400 border-white/10',
    };

    const glowClasses = {
        cyan: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
        violet: 'shadow-[0_0_10px_rgba(139,92,246,0.3)]',
        teal: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
        red: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
        gray: '',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all duration-300',
                variantClasses[variant],
                glow && glowClasses[variant],
                className
            )}
        >
            <span className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse',
                variant === 'cyan' && 'bg-cyan-400',
                variant === 'violet' && 'bg-violet-400',
                variant === 'teal' && 'bg-teal-400',
                variant === 'red' && 'bg-red-400',
                variant === 'gray' && 'bg-gray-400',
            )} />
            {children}
        </span>
    );
};

export default FuturisticBadge;
