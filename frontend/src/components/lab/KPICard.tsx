'use client';

import React, { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'teal' | 'green' | 'red' | 'yellow';
    suffix?: string;
}

const colorClasses = {
    blue: {
        bg: 'from-blue-500 to-cyan-500',
        light: 'bg-blue-100',
        text: 'text-blue-600',
        shadow: 'shadow-blue-500/20',
    },
    teal: {
        bg: 'from-teal-500 to-cyan-500',
        light: 'bg-teal-100',
        text: 'text-teal-600',
        shadow: 'shadow-teal-500/20',
    },
    green: {
        bg: 'from-green-500 to-emerald-500',
        light: 'bg-green-100',
        text: 'text-green-600',
        shadow: 'shadow-green-500/20',
    },
    red: {
        bg: 'from-red-500 to-rose-500',
        light: 'bg-red-100',
        text: 'text-red-600',
        shadow: 'shadow-red-500/20',
    },
    yellow: {
        bg: 'from-yellow-500 to-orange-500',
        light: 'bg-yellow-100',
        text: 'text-yellow-600',
        shadow: 'shadow-yellow-500/20',
    },
};

export default function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    suffix = ''
}: KPICardProps) {
    const valueRef = useRef<HTMLDivElement>(null);
    const colors = colorClasses[color];

    // Animated counter effect
    useEffect(() => {
        if (typeof value === 'number' && valueRef.current) {
            const element = valueRef.current;
            const duration = 1000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;
            let step = 0;

            const timer = setInterval(() => {
                step++;
                current = Math.min(increment * step, value);
                element.textContent = Math.floor(current).toString() + suffix;

                if (step >= steps) {
                    clearInterval(timer);
                    element.textContent = value.toString() + suffix;
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [value, suffix]);

    return (
        <div className={cn(
            "relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100",
            colors.shadow
        )}>
            {/* Icon */}
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                colors.light
            )}>
                <Icon className={cn("w-6 h-6", colors.text)} />
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

            {/* Value */}
            <div
                ref={valueRef}
                className="text-3xl font-bold text-gray-900 mb-2"
            >
                {typeof value === 'number' ? '0' + suffix : value}
            </div>

            {/* Trend */}
            {trend && (
                <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                    <span>{trend.isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value)}%</span>
                    <span className="text-gray-500 font-normal">from yesterday</span>
                </div>
            )}

            {/* Decorative gradient */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-2xl",
                colors.bg
            )} />
        </div>
    );
}
