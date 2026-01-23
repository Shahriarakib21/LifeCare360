'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    glow?: boolean;
    glowColor?: 'cyan' | 'violet' | 'teal' | 'none';
}

const GlassCard = ({
    children,
    className,
    padding = 'md',
    hover = true,
    glow = false,
    glowColor = 'none',
}: GlassCardProps) => {
    const paddingClasses = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const glowClasses = {
        cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.15)] border-cyan-500/20',
        violet: 'shadow-[0_0_20px_rgba(139,92,246,0.15)] border-violet-500/20',
        teal: 'shadow-[0_0_20px_rgba(20,184,166,0.15)] border-teal-500/20',
        none: 'border-white/10',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
            className={cn(
                'relative overflow-hidden backdrop-blur-xl bg-white/5 rounded-2xl border transition-all duration-300',
                paddingClasses[padding],
                glow && glowClasses[glowColor],
                hover && 'hover:bg-white/10 hover:border-white/20',
                className
            )}
        >
            {/* Abstract background highlight */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

export default GlassCard;
