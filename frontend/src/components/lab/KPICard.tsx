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
    color?: string; // allow any string for flexibility
    suffix?: string;
    delay?: number;
}

const colorClasses: Record<string, any> = {
    blue: {
        bg: 'from-blue-500 to-cyan-500',
        light: 'bg-blue-50',
        text: 'text-blue-600',
        shadow: 'shadow-blue-500/20',
    },
    teal: {
        bg: 'from-teal-500 to-cyan-500',
        light: 'bg-teal-50',
        text: 'text-teal-600',
        shadow: 'shadow-teal-500/20',
    },
    green: {
        bg: 'from-green-500 to-emerald-500',
        light: 'bg-green-50',
        text: 'text-green-600',
        shadow: 'shadow-green-500/20',
    },
    red: {
        bg: 'from-red-500 to-rose-500',
        light: 'bg-red-50',
        text: 'text-red-600',
        shadow: 'shadow-red-500/20',
    },
    yellow: {
        bg: 'from-yellow-500 to-orange-500',
        light: 'bg-yellow-50',
        text: 'text-yellow-600',
        shadow: 'shadow-yellow-500/20',
    },
};

const defaultColors = colorClasses.blue;

export default function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    suffix = '',
    delay = 0
}: KPICardProps) {
    const valueRef = useRef<HTMLDivElement>(null);

    // Determine colors: check if it's a predefined key or a custom gradient
    const isPredefined = color in colorClasses;
    const colors = isPredefined ? colorClasses[color] : defaultColors;

    // If color is not predefined but looks like a gradient string, use it for the bg
    const customBg = !isPredefined && color.includes('from-') ? color : colors.bg;

    // Animated counter effect with delay support
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
                element.textContent = Math.floor(current).toLocaleString() + suffix;

                if (step >= steps) {
                    clearInterval(timer);
                    element.textContent = value.toLocaleString() + suffix;
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
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 z-10 relative",
                colors.light
            )}>
                <Icon className={cn("w-6 h-6", colors.text)} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Title */}
                <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>

                {/* Value */}
                <div
                    ref={valueRef}
                    className="text-3xl font-bold text-gray-900 mb-2 tracking-tight"
                >
                    {typeof value === 'number' ? '0' + suffix : value}
                </div>

                {/* Trend */}
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-sm font-semibold",
                        trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-current bg-opacity-10">
                            {trend.isPositive ? '↑' : '↓'}
                        </span>
                        <span>{Math.abs(trend.value)}%</span>
                        <span className="text-gray-400 font-normal">vs last month</span>
                    </div>
                )}
            </div>

            {/* Decorative gradient */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-2xl",
                customBg
            )} />
        </div>
    );
}
