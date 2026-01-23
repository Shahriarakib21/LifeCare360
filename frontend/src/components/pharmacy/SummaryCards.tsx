'use client';

import { Pill, AlertTriangle, ShoppingBag, FileClock, TrendingUp } from 'lucide-react';

interface Stat {
    name: string;
    value: string | number;
    change: number;
    changeType: 'neutral' | 'warning' | 'increase' | 'decrease';
    icon: any;
    color: string;
    bgColor: string;
    subtitle?: string;
}

interface SummaryCardsProps {
    stats: Stat[];
}

export function SummaryCards({ stats }: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div key={stat.name} className="card hover:shadow-md transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-secondary-500">{stat.name}</p>
                                <h3 className="text-2xl font-bold text-secondary-900 mt-2">
                                    {stat.value.toLocaleString()}
                                </h3>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            {stat.subtitle ? (
                                <span className={`font-medium ${stat.changeType === 'warning' ? 'text-warning-600' : 'text-secondary-600'
                                    }`}>
                                    {stat.subtitle}
                                </span>
                            ) : (
                                <>
                                    <span className={`font-medium flex items-center gap-1 ${stat.changeType === 'increase'
                                        ? 'text-success-600'
                                        : 'text-secondary-500'
                                        }`}>
                                        {stat.changeType === 'increase' && <TrendingUp className="w-4 h-4" />}
                                        {stat.change > 0 ? '+' : ''}{stat.change}%
                                    </span>
                                    <span className="text-secondary-400 ml-2">from yesterday</span>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
