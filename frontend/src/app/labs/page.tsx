'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FlaskConical, MapPin, Star, ArrowRight, Search, Filter,
    ChevronRight, X, Clock, Shield, DollarSign, Activity,
    CheckCircle2, Info, Building2
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface Lab {
    _id: string;
    email: string;
    profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
        about?: string;
        location?: {
            city?: string;
            state?: string;
        };
    };
    labDetails?: {
        rating?: number;
        totalReviews?: number;
        services?: string[];
        isVerified?: boolean;
    };
}

interface TestResult {
    id: string;
    name: string;
    price: number;
    lab: {
        id: string;
        name: string;
        location?: { city?: string };
        labDetails?: { rating?: number; isVerified?: boolean };
    };
}

export default function LabsListingPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'lab' | 'test'>('test');
    const [selectedCity, setSelectedCity] = useState('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [showFilters, setShowFilters] = useState(false);

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            if (searchMode === 'lab') {
                const response = await api.get(`/api/public/labs?city=${selectedCity}`);
                setLabs(response.data?.data?.labs || []);
                setTestResults([]);
            } else {
                // If query is empty, fetch all tests (or limited set) by passing empty q
                const endpoint = searchQuery
                    ? `/api/public/lab-tests/search?q=${searchQuery}`
                    : `/api/public/lab-tests/search?q=`;
                const response = await api.get(endpoint);
                setTestResults(response.data?.data?.tests || []);
                setLabs([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [searchMode, selectedCity, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [fetchResults]);

    const filteredLabs = labs.filter(lab => {
        const matchesName = `${lab.profile.firstName} ${lab.profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesName;
    });

    const filteredTests = testResults.filter(test => {
        return test.price >= priceRange[0] && test.price <= priceRange[1];
    });

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="flex-1">
                {/* Hero / Search Section */}
                <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-br from-cyan-600 to-teal-700">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                        <FlaskConical size={600} className="absolute -right-20 -bottom-20 text-white rotate-12" />
                    </div>

                    <div className="container-custom relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl mx-auto text-center text-white"
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                                Compare. Book. <span className="text-cyan-200 underline decoration-cyan-400/50">Save.</span>
                            </h1>
                            <p className="text-xl text-cyan-50 mb-12 max-w-2xl mx-auto font-medium opacity-90">
                                Access real-time pricing from the most trusted laboratories.
                                Transparent. Fast. Reliable.
                            </p>

                            <div className="bg-white rounded-[2rem] p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2 border-4 border-white/20">
                                <div className="flex bg-slate-100 rounded-2xl p-1 w-full md:w-auto">
                                    <button
                                        onClick={() => setSearchMode('lab')}
                                        className={`flex-1 md:px-6 py-3 rounded-xl text-sm font-bold transition-all ${searchMode === 'lab' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Labs
                                    </button>
                                    <button
                                        onClick={() => setSearchMode('test')}
                                        className={`flex-1 md:px-6 py-3 rounded-xl text-sm font-bold transition-all ${searchMode === 'test' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tests
                                    </button>
                                </div>
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={searchMode === 'lab' ? "Search laboratory by name..." : "Search for specific test (e.g. CBC, MRI) or browse all..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-0 text-slate-900 font-semibold placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="relative md:w-48 w-full border-l border-slate-100 hidden md:block">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="w-full pl-10 pr-8 py-4 rounded-2xl bg-transparent border-none focus:ring-0 text-slate-900 font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="">Anywhere</option>
                                        <option value="Dhaka">Dhaka</option>
                                        <option value="Chittagong">Chittagong</option>
                                        <option value="Sylhet">Sylhet</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-4 rounded-2xl transition-all ${showFilters ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Filter className="w-5 h-5" />
                                </button>
                                <Button className="w-full md:w-auto rounded-2xl md:px-8 py-4 bg-cyan-600 hover:bg-cyan-700">
                                    Search
                                </Button>
                            </div>

                            {/* Advanced Filters Popover */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-2xl mt-4 z-50"
                                    >
                                        <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-white/20 text-slate-800 text-left">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-lg">Filters</h3>
                                                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-slate-400" /></button>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Price Range (BDT)</label>
                                                    <div className="space-y-4">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="10000"
                                                            step="100"
                                                            value={priceRange[1]}
                                                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                                                        />
                                                        <div className="flex justify-between font-bold text-slate-900">
                                                            <span>৳{priceRange[0]}</span>
                                                            <span>৳{priceRange[1]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Location</label>
                                                    <select
                                                        value={selectedCity}
                                                        onChange={(e) => setSelectedCity(e.target.value)}
                                                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-cyan-500 text-slate-900 font-bold"
                                                    >
                                                        <option value="">All Cities</option>
                                                        <option value="Dhaka">Dhaka</option>
                                                        <option value="Chittagong">Chittagong</option>
                                                        <option value="Sylhet">Sylhet</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-2">
                                                <Button variant="secondary" onClick={() => { setPriceRange([0, 10000]); setSelectedCity(''); }}>Reset</Button>
                                                <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </section>

                {/* Results Section */}
                <div className="container-custom -mt-16 relative z-20 pb-20">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-medium font-outfit">Searching for the best options...</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                                    <h2 className="text-2xl font-black text-slate-900">
                                        {searchMode === 'lab' ? `${filteredLabs.length} Laboratories` : `${filteredTests.length} Tests Found`}
                                    </h2>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                                        <Activity className="w-4 h-4 text-cyan-600" />
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Updates</span>
                                    </div>
                                </div>

                                {searchMode === 'lab' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                        {filteredLabs.map((lab, index) => (
                                            <motion.div
                                                key={lab._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all flex flex-col h-full overflow-hidden relative"
                                            >
                                                {lab.labDetails?.isVerified && (
                                                    <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full shadow-lg" title="Verified Lab">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                )}

                                                <div className="relative w-20 h-20 mb-6 group-hover:scale-110 transition-transform duration-500">
                                                    {lab.profile?.avatar ? (
                                                        <img
                                                            src={lab.profile.avatar.startsWith('http') ? lab.profile.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${lab.profile.avatar}`}
                                                            alt={lab.profile.firstName}
                                                            className="w-full h-full rounded-2xl object-cover border-2 border-slate-50 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 border-2 border-white shadow-inner">
                                                            <Building2 className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-grow">
                                                    <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight group-hover:text-cyan-600 transition-colors">
                                                        {`${lab.profile.firstName} ${lab.profile.lastName}`.trim()}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-3">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        <span>{lab.profile.location?.city || 'City not listed'}</span>
                                                    </div>

                                                    <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 rounded-xl w-fit">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                            <span className="font-black text-slate-900 text-sm">{lab.labDetails?.rating?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{lab.labDetails?.totalReviews || 0} Reviews</span>
                                                    </div>

                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10 group-hover:text-slate-600">
                                                        {lab.profile.about || "Reliable pathology services with certified specialists and modern technology."}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => window.location.href = `/labs/${lab._id}`}
                                                    className="w-full bg-slate-50 group-hover:bg-cyan-600 text-slate-600 group-hover:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    View Details
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {filteredTests.map((test, index) => (
                                            <motion.div
                                                key={test.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-cyan-200 hover:shadow-xl transition-all flex flex-col sm:flex-row justify-between items-center gap-6"
                                            >
                                                <div className="flex items-center gap-5 w-full">
                                                    <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner">
                                                        <FlaskConical className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">{test.name}</h4>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 font-bold">
                                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                                {test.lab.name}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-lg font-bold">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {test.lab.location?.city || 'Global'}
                                                            </div>
                                                            {test.lab.labDetails?.isVerified && (
                                                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                                                    Verified
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-slate-50">
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Price</p>
                                                        <p className="text-2xl font-black text-cyan-600 leading-none">৳{test.price}</p>
                                                    </div>
                                                    <Link href={`/labs/${test.lab.id}?testId=${test.id}`}>
                                                        <Button className="rounded-2xl px-8 shadow-lg shadow-cyan-600/20">Book</Button>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {filteredLabs.length === 0 && filteredTests.length === 0 && !loading && (
                                    <div className="text-center py-32 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <Search className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">Zero Matches Found</h3>
                                        <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">We couldn't find any labs or tests matching your criteria. Try loosening your filters or searching for something else.</p>
                                        <Button variant="secondary" className="rounded-xl border-slate-200" onClick={() => { setSearchQuery(''); setSelectedCity(''); setPriceRange([0, 10000]); setLabs([]); setTestResults([]); }}>Clear Everything</Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start gap-5">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 mb-1">Secure & HIPAA Compliant</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">Your medical records and transaction data are protected with the highest security standards.</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start gap-5">
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
                                <Star className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 mb-1">Certified Laboratories</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">We only partner with ISO-certified laboratories that meet our strict quality protocols.</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-start gap-5">
                            <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-inner">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 mb-1">Fast Turnaround</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">Get your digital reports directly in your dashboard within the estimated delivery time.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
