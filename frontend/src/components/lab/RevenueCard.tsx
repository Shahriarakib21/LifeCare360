'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RevenueCardProps {
    title: string;
    amount: number;
    currency?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    period?: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
    blue: {
        bg: 'from-blue-500 to-cyan-500',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-600',
    },
    green: {
        bg: 'from-green-500 to-emerald-500',
        icon: 'bg-green-100 text-green-600',
        text: 'text-green-600',
    },
    purple: {
        bg: 'from-purple-500 to-pink-500',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-600',
    },
    orange: {
        bg: 'from-orange-500 to-amber-500',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-600',
    },
};

export default function RevenueCard({
    title,
    amount,
    currency = '৳',
    trend,
    period,
    icon: Icon = DollarSign,
    color = 'green',
}: RevenueCardProps) {
    const colors = colorClasses[color];

    // Format number with commas
    const formatAmount = (num: number) => {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 opacity-10">
                <div className="w-32 h-32 rounded-full bg-white -mr-8 -mt-8"></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.icon} bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {period && (
                        <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            {period}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-white/80 mb-2">{title}</h3>

                {/* Amount */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold">
                        {currency}{formatAmount(amount)}
                    </span>
                </div>

                {/* Trend */}
                {trend && (
                    <div className="flex items-center gap-2">
                        {trend.isPositive ? (
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-semibold">+{Math.abs(trend.value)}%</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                                <TrendingDown className="w-4 h-4" />
                                <span className="text-xs font-semibold">-{Math.abs(trend.value)}%</span>
                            </div>
                        )}
                        <span className="text-xs text-white/70">vs last {period?.toLowerCase() || 'period'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
