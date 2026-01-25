'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Sparkles, ArrowRight, BrainCircuit, Activity } from 'lucide-react';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button'; // Added this import for the new Button component

export default function AIInsights() {
    return (
        <Card className="bg-gradient-to-br from-secondary-800 to-secondary-900 text-white border-none shadow-xl relative overflow-hidden rounded-[2.5rem] p-8">
            {/* Animated Background Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                        <Sparkles className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight leading-none uppercase text-xs text-primary-400 mb-1">AI Diagnostics</h2>
                        <h2 className="text-lg font-black text-white leading-none">Smart Health Insights</h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-1 h-12 bg-accent-500 rounded-full group-hover:h-14 transition-all" />
                            <div>
                                <h3 className="font-black text-sm text-accent-400 uppercase tracking-widest mb-1">Attention Required</h3>
                                <p className="text-sm text-secondary-200 leading-relaxed font-medium">
                                    Your Hb% levels (11.2 g/dL) are slightly lower than last month. Consider increasing iron-rich foods.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-1 h-12 bg-primary-500 rounded-full group-hover:h-14 transition-all" />
                            <div>
                                <h3 className="font-black text-sm text-primary-400 uppercase tracking-widest mb-1">Good Progress!</h3>
                                <p className="text-sm text-secondary-200 leading-relaxed font-medium">
                                    Your BMI has improved by 0.5 points this month. Keep up the daily walking routine!
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <Button
                    fullWidth
                    variant="primary"
                    className="mt-8 rounded-2xl py-4 font-black text-xs uppercase tracking-widest bg-white text-secondary-900 hover:bg-secondary-50 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                    Full Health Analysis
                </Button>
            </div>
        </Card>
    );
}
