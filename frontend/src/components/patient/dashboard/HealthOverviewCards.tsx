import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Activity, Heart, Droplets, Scale, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';

const VitalCard = ({ label, value, unit, trend, trendValue, status, icon: Icon, color, delay }: any) => {
    const statusColors = {
        normal: 'bg-primary-50 text-primary-700 border-primary-100',
        warning: 'bg-warning-50 text-warning-700 border-warning-100',
        critical: 'bg-error-50 text-error-700 border-error-100',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="h-full"
        >
            <Card className="flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-xl transition-all duration-500 border-secondary-100 bg-white rounded-[2rem] p-6">
                <div className={`absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12`}>
                    <Icon className="w-24 h-24" />
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={cn("p-4 rounded-2xl bg-gradient-to-br shadow-lg", color)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className={cn("text-[10px] font-black uppercase tracking-tighter px-2 py-0.5", statusColors[status as keyof typeof statusColors])}>
                        {status}
                    </Badge>
                </div>

                <div className="relative z-10 space-y-1">
                    <p className="text-secondary-500 text-xs font-black uppercase tracking-widest leading-none">{label}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-secondary-900 tracking-tight">{value}</span>
                        <span className="text-sm text-secondary-400 font-bold uppercase">{unit}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-tight",
                            trend === 'down' ? 'bg-primary-50 text-primary-600' : trend === 'up' ? 'bg-error-50 text-error-600' : 'bg-secondary-50 text-secondary-500'
                        )}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                        </div>
                        <span className="text-[10px] text-secondary-400 font-bold uppercase tracking-tighter">vs Last visit</span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default function HealthOverviewCards({ vitalsData = [] }: { vitalsData?: any[] }) {

    // Helper to find metric value in latest record
    const getValue = (key: string, defaultValue: string) => {
        if (!vitalsData.length) return defaultValue;
        const latest = vitalsData[0]?.data?.vitals;
        if (!latest) return defaultValue;

        const foundKey = Object.keys(latest).find(k => k.toLowerCase().includes(key.toLowerCase()));
        return foundKey ? latest[foundKey] : defaultValue;
    };

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

    const vitals = [
        {
            label: 'Blood Sugar',
            value: getValue('sugar', 'N/A'),
            unit: 'mg/dL',
            trend: sugarTrend.dir,
            trendValue: sugarTrend.val,
            status: getValue('sugar', 'N/A') === 'N/A' ? 'normal' : parseFloat(getValue('sugar', '0')) > 140 ? 'warning' : 'normal',
            icon: Droplets,
            color: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Blood Pressure',
            value: getValue('bp', 'N/A'),
            unit: 'mmHg',
            trend: bpTrend.dir,
            trendValue: bpTrend.val,
            status: 'normal',
            icon: Activity,
            color: 'from-teal-500 to-teal-600',
        },
        {
            label: 'Heart Rate',
            value: getValue('heart', 'N/A'),
            unit: 'bpm',
            trend: heartTrend.dir,
            trendValue: heartTrend.val,
            status: 'normal',
            icon: Heart,
            color: 'from-rose-500 to-rose-600',
        },
        {
            label: 'Weight',
            value: getValue('weight', 'N/A'),
            unit: 'kg',
            trend: weightTrend.dir,
            trendValue: weightTrend.val,
            status: 'normal',
            icon: Scale,
            color: 'from-cyan-500 to-cyan-600',
        },
        {
            label: 'Hemoglobin',
            value: getValue('hemo', 'N/A'),
            unit: 'g/dL',
            trend: 'stable',
            trendValue: '0%',
            status: 'normal',
            icon: FlaskConical,
            color: 'from-indigo-500 to-indigo-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {vitals.map((vital, index) => (
                <VitalCard key={index} {...vital} delay={index * 0.1} />
            ))}
        </div>
    );
}
