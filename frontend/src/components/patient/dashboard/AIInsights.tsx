'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Sparkles, ArrowRight, BrainCircuit, Activity } from 'lucide-react';

export default function AIInsights() {
    return (
        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <BrainCircuit className="w-32 h-32 text-white" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <h2 className="text-lg font-bold">AI Health Insights</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-start gap-3">
                            <Activity className="w-5 h-5 text-amber-300 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-sm text-white mb-1">Attention Required</h3>
                                <p className="text-xs text-indigo-100 leading-relaxed">
                                    Your Hb% levels (11.2 g/dL) are slightly lower than last month. Consider increasing iron-rich foods like spinach and lentils.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs">
                                ↑
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-white mb-1">Good Progress!</h3>
                                <p className="text-xs text-indigo-100 leading-relaxed">
                                    Your BMI has improved by 0.5 points this month. Keep up the daily walking routine!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="mt-6 w-full py-2.5 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group">
                    View Full Health Analysis
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </Card>
    );
}
