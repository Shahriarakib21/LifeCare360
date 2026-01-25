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

import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function SummaryCards({ stats }: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="p-8 flex items-center justify-between bg-white border border-secondary-100 shadow-soft group hover:shadow-xl transition-all duration-500 rounded-[2.5rem] relative overflow-hidden">
                            <div className="relative z-10 space-y-2">
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">{stat.name}</p>
                                <p className="text-4xl font-black text-secondary-900 tracking-tighter">{stat.value.toLocaleString()}</p>
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    stat.changeType === 'warning' ? 'text-error-500' : 'text-primary-500'
                                )}>
                                    {stat.subtitle || 'Active Inventory'}
                                </p>
                            </div>
                            <div className={cn(
                                "relative z-10 w-16 h-16 rounded-3xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500",
                                stat.bgColor.replace('bg-', 'from-').replace('-100', '-500') + ' to-' + stat.bgColor.replace('bg-', '').replace('-100', '-600')
                            )}>
                                <Icon className="w-8 h-8 text-white" />
                            </div>

                            {/* Subtle Watermark */}
                            <div className="absolute -bottom-4 -left-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                                <Icon className="w-24 h-24" />
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
