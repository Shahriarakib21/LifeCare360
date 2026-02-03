'use client';

import React, { useState, useEffect } from 'react';
import { Search, Database, FlaskConical, Filter, ArrowUpDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';

interface LabTest {
    id: string;
    name: string;
    category: string;
    unit: string;
    referenceRange: string;
    priceBDT: number;
}

export default function LabTestsMasterPage() {
    const [tests, setTests] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        fetchTests();
    }, [search, category]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/labs/master-tests', {
                params: { search, category }
            });
            setTests(res.data.data.tests);
        } catch (err) {
            console.error('Error fetching lab tests:', err);
        } finally {
            setLoading(false);
        }
    };

    const categories = Array.from(new Set(tests.map(t => t.category))).filter(Boolean);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase italic flex items-center gap-3">
                    <FlaskConical className="w-10 h-10 text-cyan-400" />
                    Master <span className="text-cyan-400">Test List</span>
                </h1>
                <p className="text-gray-400 mt-2 font-medium tracking-wide">
                    CENTRAL REPOSITORY OF ALL AVAILABLE LABORATORY DIAGNOSTICS
                </p>
            </header>

            <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            label="SEARCH TEST NAME"
                            placeholder="e.g., Hemoglobin..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                            Filter Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-colors uppercase text-sm font-bold"
                        >
                            <option value="" className="bg-gray-900">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </GlassCard>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner text="Querying Lab Database..." />
                </div>
            ) : (
                <GlassCard padding="none" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnostic Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Range</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valuation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tests.length > 0 ? (
                                    tests.map((test) => (
                                        <tr key={test.id} className="hover:bg-cyan-500/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase">
                                                    {test.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-gray-400 uppercase">
                                                    {test.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-mono text-gray-500">{test.referenceRange || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-400 italic">{test.unit || 'units'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black text-cyan-400 font-mono tracking-tighter">
                                                    ৳{Number(test.priceBDT).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Database className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No diagnostic matches found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
