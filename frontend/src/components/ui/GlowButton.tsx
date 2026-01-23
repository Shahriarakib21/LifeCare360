'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'cyan' | 'violet' | 'teal' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
    isLoading?: boolean;
}

const GlowButton = ({
    children,
    className,
    variant = 'cyan',
    size = 'md',
    glow = true,
    isLoading,
    ...props
}: GlowButtonProps) => {
    const sizeClasses = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    const variantClasses = {
        cyan: 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
        violet: 'bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]',
        teal: 'bg-teal-500 text-black hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]',
        outline: 'bg-transparent border border-white/20 text-white hover:bg-white/10 shadow-none',
    };

    const MotionButton = motion.button as any;

    return (
        <MotionButton
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'relative overflow-hidden inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />

            {/* Inner glow effect on hover */}
            <motion.div
                className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
            />

            <span className="relative z-10">{children}</span>
        </MotionButton>
    );
};

export default GlowButton;
