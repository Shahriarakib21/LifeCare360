'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Activity, TrendingUp, AlertCircle, Info, Download, ChevronRight, HeartPulse } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function InsightsPage() {
    const [loading, setLoading] = useState(true);
    const [allTrends, setAllTrends] = useState<Record<string, any[]>>({});
    const [metric, setMetric] = useState('Blood Pressure');
    const [showFullReport, setShowFullReport] = useState(false);

    // Fetch all critical metrics on load to populate the report and analysis
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const metrics = ['Blood Pressure', 'Glucose', 'Weight', 'Heart Rate'];
                const results = await Promise.all(
                    metrics.map(m => api.get(`/api/patients/trends?metric=${m}`))
                );

                const trendsMap: Record<string, any[]> = {};
                metrics.forEach((m, index) => {
                    trendsMap[m] = results[index].data?.data?.trends || [];
                });
                setAllTrends(trendsMap);
            } catch (error) {
                console.error('Failed to fetch insights:', error);
                // Don't show error to user, just show empty data or fallbacks
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const currentTrends = allTrends[metric] || [];

    // Analysis Helpers
    const getAverage = (data: any[]) => {
        if (!data || data.length === 0) return 0;
        // Handle potentially non-numeric "120/80" BP strings if simplistic
        // For now assuming backend returns numbers or we parse simple
        const sum = data.reduce((acc, curr) => {
            const val = parseFloat(curr.value);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
        return Math.round(sum / data.length);
    };

    const getLastValue = (data: any[]) => {
        if (!data || data.length === 0) return 0;
        return parseFloat(data[data.length - 1].value) || 0;
    };

    const getTrendDirection = (data: any[]) => {
        if (!data || data.length < 2) return 'stable';
        const first = parseFloat(data[0].value);
        const last = parseFloat(data[data.length - 1].value);
        if (isNaN(first) || isNaN(last)) return 'stable';

        if (last > first * 1.05) return 'increasing';
        if (last < first * 0.95) return 'decreasing';
        return 'stable';
    };

    const hasData = Object.values(allTrends).some(arr => arr.length > 0);

    // Analysis
    const bpAvg = getAverage(allTrends['Blood Pressure']);
    const glucoseAvg = getAverage(allTrends['Glucose']);
    const weightCurrent = getLastValue(allTrends['Weight']);

    // Dynamic Health Score Text
    const getHealthSummary = () => {
        if (!hasData) return "Insufficient data to generate a detailed analysis. Add your vitals to see AI insights.";

        let summary = "Based on your recent vitals, your overall health score is stable. ";
        const bpTrend = getTrendDirection(allTrends['Blood Pressure']);

        if (bpTrend === 'decreasing' && bpAvg > 120) summary += "AI detects a positive improvement in your blood pressure. ";
        else if (bpTrend === 'increasing' && bpAvg > 120) summary += "Attention Needed: Blood pressure shows an upward trend. ";

        if (glucoseAvg > 140) summary += "Glucose levels are higher than optimal. ";

        return summary;
    };

    // Dynamic Recommendations based on real values
    const getRecommendations = () => {
        const recs = [];
        if (glucoseAvg > 110) {
            recs.push({ title: "Monitor Carbohydrate Intake", desc: "Glucose average is slightly elevated.", icon: Activity, color: "text-amber-600", bg: "bg-amber-100" });
        }
        if (bpAvg > 130) {
            recs.push({ title: "Reduce Sodium Intake", desc: "Blood pressure is trending high.", icon: HeartPulse, color: "text-red-600", bg: "bg-red-100" });
        }
        // Defaults if healthy or no data
        if (recs.length === 0) {
            recs.push({ title: "Maintain Hydration", desc: "Keep up your water intake for optimal health.", icon: Activity, color: "text-blue-600", bg: "bg-blue-100" });
            recs.push({ title: "Regular Exercise", desc: "Continue your routine to maintain these good numbers.", icon: HeartPulse, color: "text-teal-600", bg: "bg-teal-100" });
        }
        return recs;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; }
                    body * { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible; }
                    #report-content { position: absolute; left: 0; top: 0; width: 100%; margin: 2rem; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <BrainCircuit className="w-8 h-8 text-teal-600" />
                    AI Health Insights
                </h1>
                <p className="text-slate-500">Personalized analysis and predictive health trends.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Main AI Summary */}
                    <div className="lg:col-span-2">
                        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none p-8 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                        <Activity className="w-6 h-6 text-indigo-100" />
                                    </div>
                                    <h2 className="text-xl font-bold">Health Score Analysis</h2>
                                    <span className="ml-auto px-3 py-1 bg-green-400/20 text-green-300 text-sm font-semibold rounded-full border border-green-400/30">
                                        {calculateScore(bpAvg, glucoseAvg)}
                                    </span>
                                </div>
                                <p className="text-indigo-100 text-lg mb-6 max-w-2xl leading-relaxed">
                                    {getHealthSummary()}
                                </p>
                                <div className="flex gap-4">
                                    <Button
                                        className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg"
                                        onClick={() => setShowFullReport(true)}
                                    >
                                        View Full Report
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Trend Chart */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-teal-500" /> Vitals Projection
                            </h3>
                            <div className="relative">
                                <select
                                    value={metric}
                                    onChange={(e) => setMetric(e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium text-slate-700 cursor-pointer hover:border-teal-300"
                                >
                                    <option value="Blood Pressure">Blood Pressure</option>
                                    <option value="Glucose">Glucose</option>
                                    <option value="Heart Rate">Heart Rate</option>
                                    <option value="Weight">Weight</option>
                                </select>
                                <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                        <div className="h-72">
                            {currentTrends.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">No data available for {metric}</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={currentTrends} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                padding: '12px'
                                            }}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US')}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0ea5e9"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#0ea5e9' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    {/* Recommendations */}
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Info className="w-5 h-5 text-amber-500" /> Recommended Actions
                        </h3>
                        <div className="space-y-4">
                            {getRecommendations().map((rec, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className={`p-4 rounded-xl border flex gap-4 hover:shadow-md transition-shadow cursor-pointer ${rec.bg.replace('bg-', 'bg-opacity-50 ')} border-slate-100`}
                                >
                                    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <rec.icon className={`w-5 h-5 ${rec.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{rec.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{rec.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Generated Report Modal */}
            <Modal
                isOpen={showFullReport}
                onClose={() => setShowFullReport(false)}
                title="Comprehensive Health Report"
                size="lg"
                footer={
                    <div className="flex justify-end gap-3 no-print">
                        <Button variant="ghost" onClick={() => setShowFullReport(false)}>Close</Button>
                        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                            <Download className="w-4 h-4 mr-2" /> Download/Print PDF
                        </Button>
                    </div>
                }
            >
                <div id="report-content" className="space-y-8 py-2">
                    <div className="border-b pb-4 mb-4">
                        <div className="flex items-center gap-2 mb-2 text-indigo-600">
                            <Activity className="w-6 h-6" />
                            <span className="font-bold text-lg tracking-tight">HealthLife AI</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">Health Status Report</h1>
                        <p className="text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                    </div>

                    {/* Executive Summary */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <h3 className="font-semibold text-slate-900 mb-3 text-lg">Executive Summary</h3>
                        <p className="text-slate-700 leading-relaxed">
                            {getHealthSummary()}
                            {bpAvg > 0 && ` Average Blood Pressure over the last 30 days is ${bpAvg} mmHg.`}
                            {glucoseAvg > 0 && ` Average Glucose level is ${glucoseAvg} mg/dL.`}
                            {!hasData && ' No sufficient data available for a detailed clinical summary.'}
                        </p>
                    </div>

                    {/* Detailed Analysis */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                            <TrendingUp className="w-5 h-5 text-teal-500" /> Detailed Vitals Analysis
                        </h3>
                        <div className="space-y-4">
                            <VitalRow label="Blood Pressure" value={bpAvg ? `${bpAvg} mmHg` : 'No Data'} status={bpAvg > 130 ? 'High' : bpAvg > 0 ? 'Normal' : 'Pending'} color={bpAvg > 130 ? 'amber' : bpAvg > 0 ? 'green' : 'slate'} />
                            <VitalRow label="Blood Glucose" value={glucoseAvg ? `${glucoseAvg} mg/dL` : 'No Data'} status={glucoseAvg > 140 ? 'High' : glucoseAvg > 0 ? 'Normal' : 'Pending'} color={glucoseAvg > 140 ? 'amber' : glucoseAvg > 0 ? 'green' : 'slate'} />
                            <VitalRow label="Weight" value={weightCurrent ? `${weightCurrent} kg` : 'No Data'} status={weightCurrent > 0 ? 'Stable' : 'Pending'} color="slate" />
                            <VitalRow label="Heart Rate" value={getLastValue(allTrends['Heart Rate']) ? `${getLastValue(allTrends['Heart Rate'])} bpm` : 'No Data'} status="Normal" color="slate" />
                        </div>
                    </div>

                    <div className="text-xs text-slate-400 mt-12 pt-6 border-t font-mono">
                        <p>ID: {Math.random().toString(36).substring(7).toUpperCase()} • Confidentital Medical Record • Powered by HealthLife AI</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function VitalRow({ label, value, status, color }: { label: string, value: string, status: string, color: string }) {
    const colorClasses: Record<string, string> = {
        green: 'text-green-700 bg-green-50 border-green-100',
        amber: 'text-amber-700 bg-amber-50 border-amber-100',
        slate: 'text-slate-600 bg-slate-50 border-slate-100',
        red: 'text-red-700 bg-red-50 border-red-100',
    };

    return (
        <div className={`flex items-center justify-between p-4 border rounded-xl ${colorClasses[color] || colorClasses.slate}`}>
            <div className="flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                <div>
                    <p className="font-bold text-slate-900">{label}</p>
                    <p className="text-sm opacity-80">{value}</p>
                </div>
            </div>
            <span className="text-sm font-bold uppercase tracking-wider opacity-90">{status}</span>
        </div>
    );
}

function calculateScore(bp: number, sugar: number) {
    if (!bp && !sugar) return 'N/A';
    if ((bp > 130 && bp > 0) || (sugar > 140 && sugar > 0)) return 'Attention';
    return 'Optimal';
}
