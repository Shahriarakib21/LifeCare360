'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Search, ArrowRight, Activity, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface CommonTest {
    testName: string;
    providers: {
        labId: string;
        labName: string;
        price: number;
        location: string;
    }[];
}

const PriceTransparency = () => {
    const [commonTests, setCommonTests] = useState<CommonTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const fetchCommonTests = async () => {
            try {
                const response = await api.get('/api/public/lab-tests/common');
                setCommonTests(response.data?.data || []);
            } catch (error) {
                console.error('Error fetching common tests:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommonTests();
    }, []);

    if (loading || commonTests.length === 0) return null;

    return (
        <section className="py-24 bg-white">
            <div className="container-custom">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-bold mb-4">
                        <TrendingDown className="w-4 h-4" />
                        Transparent Pricing
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                        Lab Test Price Comparison
                    </h2>
                    <p className="text-xl text-secondary-600">
                        Easily compare prices for common diagnostic tests across different laboratories and save on your healthcare costs.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Test Selection Tabs */}
                    <div className="lg:col-span-4 space-y-3">
                        {commonTests.map((test, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                className={`w-full text-left p-6 rounded-2xl transition-all border ${activeTab === index
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-200'
                                        : 'bg-white border-secondary-200 text-secondary-600 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className={`text-lg font-bold ${activeTab === index ? 'text-white' : 'text-secondary-900'}`}>
                                            {test.testName}
                                        </h3>
                                        <p className={`text-sm ${activeTab === index ? 'text-primary-100' : 'text-secondary-500'}`}>
                                            {test.providers.length} Laboratories offering this
                                        </p>
                                    </div>
                                    <Activity className={`w-5 h-5 ${activeTab === index ? 'text-primary-200' : 'text-primary-500'}`} />
                                </div>
                            </button>
                        ))}

                        <Link href="/lab-tests/compare" className="block pt-4">
                            <Button variant="secondary" className="w-full justify-between">
                                Explore More Tests
                                <Search className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Provider Comparison Table */}
                    <div className="lg:col-span-8">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-secondary-50 rounded-3xl p-8 border border-secondary-200"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-secondary-900">
                                    Providers for {commonTests[activeTab]?.testName}
                                </h3>
                                <Link href={`/lab-tests/search?q=${commonTests[activeTab]?.testName}`}>
                                    <span className="text-primary-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                                        See All <ArrowRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {commonTests[activeTab]?.providers.map((provider, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-6 rounded-2xl border border-secondary-100 flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-600 ring-2 ring-white">
                                                <FlaskConical className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-secondary-900">{provider.labName}</h4>
                                                <p className="text-sm text-secondary-500">{provider.location || 'Location varies'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-secondary-400 uppercase tracking-wider font-bold">Price Start At</p>
                                                <p className="text-2xl font-black text-primary-600">৳{provider.price}</p>
                                            </div>
                                            <Link href={`/labs/${provider.labId}`}>
                                                <Button size="sm">Book Now</Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">!</div>
                                <p className="text-sm text-primary-700">
                                    Prices are subject to change. Some labs may charge additional fees for home collection or emergency reports.
                                    Always verify the final price during booking.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PriceTransparency;
