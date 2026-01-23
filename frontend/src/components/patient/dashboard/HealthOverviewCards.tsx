'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Activity, Heart, Droplets, Scale, Timer, FlaskConical } from 'lucide-react';

interface VitalProps {
    label: string;
    value: string;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    trendValue: string;
    status: 'normal' | 'warning' | 'critical';
    icon: any;
    color: string;
}

const VitalCard = ({ label, value, unit, trend, trendValue, status, icon: Icon, color }: VitalProps) => {
    const statusColors = {
        normal: 'bg-teal-50 text-teal-700',
        warning: 'bg-amber-50 text-amber-700',
        critical: 'bg-red-50 text-red-700',
    };

    return (
        <Card className="flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.02)]">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-16 h-16" />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status]}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </div>

            <div className="relative z-10">
                <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{value}</span>
                    <span className="text-sm text-slate-400 font-medium">{unit}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                    <span className={`${trend === 'down' ? 'text-teal-500' : trend === 'up' ? 'text-rose-500' : 'text-slate-500'} flex items-center bg-slate-50 px-1.5 py-0.5 rounded-md`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                    </span>
                    <span className="text-slate-400">vs last visit</span>
                </div>
            </div>
        </Card>
    );
};

export default function HealthOverviewCards({ vitalsData = [] }: { vitalsData?: any[] }) {

    // Helper to find metric value in latest record
    const getValue = (key: string, defaultValue: string) => {
        if (!vitalsData.length) return defaultValue;
        const latest = vitalsData[0]?.data?.vitals;
        if (!latest) return defaultValue;

        // Case insensitive search
        const foundKey = Object.keys(latest).find(k => k.toLowerCase().includes(key.toLowerCase()));
        return foundKey ? latest[foundKey] : defaultValue;
    };

    // Calculate Trend (simplified)
    // In a real app, compare vitalsData[0] and vitalsData[1]
    const getTrend = (key: string): { dir: 'up' | 'down' | 'stable', val: string } => {
        if (vitalsData.length < 2) return { dir: 'stable', val: '0%' };

        const latest = vitalsData[0]?.data?.vitals;
        const prev = vitalsData[1]?.data?.vitals;

        if (!latest || !prev) return { dir: 'stable', val: '0%' };

        const k1 = Object.keys(latest).find(k => k.toLowerCase().includes(key.toLowerCase()));
        const k2 = Object.keys(prev).find(k => k.toLowerCase().includes(key.toLowerCase()));

        if (k1 && k2) {
            const v1 = parseFloat(latest[k1]);
            const v2 = parseFloat(prev[k2]);
            if (!isNaN(v1) && !isNaN(v2) && v2 !== 0) {
                const diff = ((v1 - v2) / v2) * 100;
                const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
                return { dir, val: Math.abs(diff).toFixed(1) + '%' };
            }
        }
        return { dir: 'stable', val: '0%' };
    };

    const sugarTrend = getTrend('sugar');
    const bpTrend = getTrend('bp');
    const weightTrend = getTrend('weight');
    const heartTrend = getTrend('heart');

    const vitals: VitalProps[] = [
        {
            label: 'Blood Sugar (RBS)',
            value: getValue('sugar', 'N/A'),
            unit: 'mg/dL',
            trend: sugarTrend.dir,
            trendValue: sugarTrend.val,
            status: getValue('sugar', 'N/A') === 'N/A' ? 'normal' : parseFloat(getValue('sugar', '0')) > 140 ? 'warning' : 'normal',
            icon: Droplets,
            color: 'bg-blue-500 text-blue-500',
        },
        {
            label: 'Blood Pressure',
            value: getValue('bp', 'N/A'), // matches 'bp' or 'blood pressure'
            unit: 'mmHg',
            trend: bpTrend.dir,
            trendValue: bpTrend.val,
            status: 'normal', // Complex parsing needed for BP status (120/80)
            icon: Activity,
            color: 'bg-rose-500 text-rose-500',
        },
        {
            label: 'Heart Rate',
            value: getValue('heart', 'N/A'),
            unit: 'bpm',
            trend: heartTrend.dir,
            trendValue: heartTrend.val,
            status: 'normal',
            icon: Heart,
            color: 'bg-red-500 text-red-500',
        },
        {
            label: 'Weight',
            value: getValue('weight', 'N/A'),
            unit: 'kg',
            trend: weightTrend.dir,
            trendValue: weightTrend.val,
            status: 'normal',
            icon: Scale,
            color: 'bg-teal-500 text-teal-500',
        },
        {
            label: 'Hemoglobin',
            value: getValue('hemo', 'N/A'),
            unit: 'g/dL',
            trend: 'stable',
            trendValue: '0%',
            status: 'normal',
            icon: FlaskConical,
            color: 'bg-indigo-500 text-indigo-500',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {vitals.map((vital, index) => (
                <VitalCard key={index} {...vital} />
            ))}
        </div>
    );
}
