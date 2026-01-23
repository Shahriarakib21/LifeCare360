'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    FlaskConical, MapPin, Clock, Award, Phone, Mail,
    Search, Filter, ChevronDown, CheckCircle, Info,
    Timer, TestTube2, ArrowLeft, Share2, Star,
    ShoppingCart, Trash2, CreditCard, ChevronRight,
    AlertCircle, Beaker
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Lab {
    _id: string;
    email: string;
    profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
        phone?: string;
        location?: {
            address?: string;
            city?: string;
            state?: string;
        };
    };
    labDetails?: {
        accreditations?: string[];
        operatingHours?: string;
        services?: string[];
        about?: string;
        rating?: number;
        totalReviews?: number;
    };
}

interface Test {
    _id: string;
    testName: string;
    testCode: string;
    price: number;
    description?: string;
    preparationInstructions?: string;
    estimatedDeliveryTime?: string;
    sampleType?: string;
}

export default function LabProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTestId = searchParams.get('testId');

    const [lab, setLab] = useState<Lab | null>(null);
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTest, setExpandedTest] = useState<string | null>(null);
    const [selectedTests, setSelectedTests] = useState<Test[]>([]);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        const fetchLabData = async () => {
            try {
                const response = await api.get(`/api/public/labs/${id}`);
                const labData = response.data?.data?.lab;
                const testData = response.data?.data?.tests || [];
                setLab(labData);
                setTests(testData);

                // Auto-select test if ID provided in query
                if (initialTestId) {
                    const testToSelect = testData.find((t: Test) => t._id === initialTestId);
                    if (testToSelect) setSelectedTests([testToSelect]);
                }
            } catch (error) {
                console.error('Error fetching lab data:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchLabData();
    }, [id, initialTestId]);

    const filteredTests = useMemo(() => {
        return tests.filter(test =>
            test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            test.testCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tests, searchQuery]);

    const toggleTestSelection = (test: Test) => {
        setSelectedTests(prev =>
            prev.find(t => t._id === test._id)
                ? prev.filter(t => t._id !== test._id)
                : [...prev, test]
        );
    };

    const subtotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
    const vat = subtotal * 0.05; // 5% VAT estimation
    const total = subtotal + vat;

    const handleProceedToBooking = async () => {
        setIsBooking(true);
        try {
            // Check authentication
            const userResponse = await api.get('/api/auth/me').catch(() => null);
            if (!userResponse) {
                router.push(`/login?redirect=/labs/${id}`);
                return;
            }

            // Create preliminary lab request
            const requestResponse = await api.post('/api/patient/lab-tests', {
                labId: id,
                tests: selectedTests.map(t => ({
                    testId: t._id,
                    testName: t.testName,
                    price: t.price
                })),
                urgency: 'routine'
            });

            const requestId = requestResponse.data?.data?._id;
            if (requestId) {
                router.push(`/patient/ehr?tab=lab-requests&bookingId=${requestId}`);
            }
        } catch (error) {
            console.error('Booking error:', error);
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!lab) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f8fafc]">
                <Header />
                <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-lg">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4">Laboratory Not Found</h1>
                        <p className="text-slate-500 mb-8 font-medium">This laboratory may have been deactivated or the link is incorrect.</p>
                        <Link href="/labs">
                            <Button size="lg" className="rounded-2xl">Browse All Laboratories</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const labName = `${lab.profile.firstName} ${lab.profile.lastName}`.trim();

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="flex-1">
                {/* Premium Banner */}
                <section className="relative h-64 bg-slate-900">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1579154235602-3c2cfa990176?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent"></div>
                    <div className="container-custom relative h-full">
                        <Link href="/labs" className="absolute top-8 left-0 flex items-center gap-2 text-white/80 hover:text-white font-bold transition-all px-4 py-2 bg-black/20 rounded-xl backdrop-blur-md">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Search
                        </Link>
                    </div>
                </section>

                <div className="container-custom -mt-32 relative z-10 pb-20">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Content */}
                        <div className="flex-1 space-y-8">
                            {/* Profile Information */}
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        <span className="text-lg font-black text-amber-900">{lab.labDetails?.rating?.toFixed(1) || '0.0'}</span>
                                        <span className="text-sm font-bold text-amber-600/60 font-outfit">({lab.labDetails?.totalReviews || 0})</span>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-10 items-start md:items-center mb-12">
                                    <div className="relative">
                                        <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] bg-cyan-100 flex items-center justify-center text-cyan-600 border-[6px] border-white shadow-2xl relative z-10 overflow-hidden">
                                            {lab.profile.avatar ? (
                                                <img
                                                    src={lab.profile.avatar.startsWith('http') ? lab.profile.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${lab.profile.avatar}`}
                                                    className="w-full h-full object-cover"
                                                    alt={labName}
                                                />
                                            ) : (
                                                <Beaker size={60} />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2.5 rounded-2xl shadow-xl z-20 border-4 border-white">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-cyan-100">Trusted Partner</span>
                                            <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">Open Now</span>
                                        </div>
                                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight max-w-xl">
                                            {labName}
                                        </h1>
                                        <div className="flex flex-wrap gap-8">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                <MapPin className="w-5 h-5 text-cyan-600" />
                                                <span>{lab.profile.location?.city}, {lab.profile.location?.state || 'Bangladesh'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                <Clock className="w-5 h-5 text-cyan-600" />
                                                <span>{lab.labDetails?.operatingHours || 'Mon - Sat, 8 AM - 8 PM'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-slate-50">
                                    <div className="p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                                        <Award className="w-8 h-8 text-cyan-600 mb-3" />
                                        <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">Accreditation</h4>
                                        <p className="text-slate-500 text-sm font-medium">{lab.labDetails?.accreditations?.[0] || 'ISO 15189 Certified'}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                                        <Phone className="w-8 h-8 text-cyan-600 mb-3" />
                                        <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">Support</h4>
                                        <p className="text-slate-500 text-sm font-medium">{lab.profile.phone || '+880 1700-000000'}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                                        <Beaker className="w-8 h-8 text-cyan-600 mb-3" />
                                        <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">Home Sample</h4>
                                        <p className="text-slate-500 text-sm font-medium">Available in {lab.profile.location?.city || 'Dhaka'}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                                        <Timer className="w-8 h-8 text-cyan-600 mb-3" />
                                        <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight">Reports</h4>
                                        <p className="text-slate-500 text-sm font-medium">Same Day Available</p>
                                    </div>
                                </div>
                            </div>

                            {/* Catalog Tab Section */}
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 mb-2">Service Catalog</h2>
                                        <p className="text-slate-500 font-medium font-outfit">Showing {filteredTests.length} diagnostic tests and packages.</p>
                                    </div>
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Find a specific test..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-cyan-500 text-slate-900 font-bold placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {filteredTests.map((test) => {
                                        const isSelected = selectedTests.find(t => t._id === test._id);
                                        return (
                                            <div
                                                key={test._id}
                                                className={`rounded-[2rem] transition-all border-2 ${isSelected ? 'border-cyan-500 bg-cyan-50/10' : 'border-slate-50 hover:border-cyan-200 bg-white'}`}
                                            >
                                                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-cyan-600 transition-colors">
                                                        <TestTube2 size={28} />
                                                    </div>
                                                    <div className="flex-1 text-center md:text-left">
                                                        <h4 className="text-lg font-black text-slate-900 mb-1">{test.testName}</h4>
                                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{test.testCode}</div>
                                                            <div className="w-1 h-1 bg-slate-200 rounded-full mt-1.5 hidden md:block"></div>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                                <Clock className="w-3.5 h-3.5" /> {test.estimatedDeliveryTime || '24 hrs'}
                                                            </div>
                                                            <div className="w-1 h-1 bg-slate-200 rounded-full mt-1.5 hidden md:block"></div>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                                <FlaskConical className="w-3.5 h-3.5" /> {test.sampleType || 'Sample Type'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8 border-l border-slate-100 pl-8">
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Price</p>
                                                            <p className="text-2xl font-black text-cyan-600">৳{test.price}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleTestSelection(test);
                                                            }}
                                                            className={`p-4 rounded-2xl transition-all shadow-lg ${isSelected ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-600/20'}`}
                                                        >
                                                            {isSelected ? <Trash2 size={20} /> : <ShoppingCart size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setExpandedTest(expandedTest === test._id ? null : test._id)}
                                                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                                        >
                                                            <ChevronDown className={`w-6 h-6 transition-transform ${expandedTest === test._id ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedTest === test._id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-t border-slate-50"
                                                        >
                                                            <div className="p-8 grid md:grid-cols-2 gap-10">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-cyan-600">
                                                                        <Info className="w-5 h-5" />
                                                                        <h5 className="font-black text-sm uppercase tracking-widest">Test Information</h5>
                                                                    </div>
                                                                    <p className="text-slate-500 font-medium leading-relaxed">{test.description || "Comprehensive clinical assessment using advanced laboratory techniques."}</p>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-cyan-600">
                                                                        <CheckCircle className="w-5 h-5" />
                                                                        <h5 className="font-black text-sm uppercase tracking-widest">Preparation</h5>
                                                                    </div>
                                                                    <p className="text-slate-500 font-medium leading-relaxed">{test.preparationInstructions || "No special preparation needed. Maintain normal diet and hydration."}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Booking Summary */}
                        <div className="lg:col-span-1 w-full lg:w-[420px]">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <ShoppingCart size={150} />
                                    </div>

                                    <h3 className="text-2xl font-black mb-8 relative z-10">Booking Summary</h3>

                                    {selectedTests.length === 0 ? (
                                        <div className="text-center py-12 space-y-4 relative z-10">
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                                <Beaker className="w-8 h-8 text-cyan-400" />
                                            </div>
                                            <p className="text-slate-400 font-bold">Your cart is empty.</p>
                                            <p className="text-xs text-slate-500">Pick diagnostic tests from the catalog to proceed with your booking.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 relative z-10">
                                            <div className="space-y-4 font-outfit">
                                                {selectedTests.map(test => (
                                                    <div key={test._id} className="flex justify-between gap-4 group">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm text-slate-200 line-clamp-1">{test.testName}</p>
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{test.testCode}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-cyan-400">৳{test.price}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-8 border-t border-white/10 space-y-3">
                                                <div className="flex justify-between text-slate-400 font-bold text-sm">
                                                    <span>Subtotal</span>
                                                    <span>৳{subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 font-bold text-sm">
                                                    <span>VAT (5%)</span>
                                                    <span>৳{vat.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-lg font-black">Grand Total</span>
                                                    <span className="text-3xl font-black text-white">৳{total.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={handleProceedToBooking}
                                                disabled={isBooking}
                                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-black py-6 rounded-[1.5rem] shadow-xl shadow-cyan-500/20 text-lg transition-all flex items-center justify-center gap-3"
                                            >
                                                {isBooking ? (
                                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        Proceed to Booking
                                                        <ChevronRight size={24} />
                                                    </>
                                                )}
                                            </Button>

                                            <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">
                                                Secure Payment via SSLCommerz
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                                    <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3 italic">
                                        <Info size={20} className="text-cyan-500" />
                                        Important Advice
                                    </h4>
                                    <ul className="space-y-4">
                                        <li className="flex gap-4 items-start">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-500 font-bold">Fast for 8-12 hours before blood sample collection unless told otherwise.</p>
                                        </li>
                                        <li className="flex gap-4 items-start">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-500 font-bold">Drink plenty of water before urine tests.</p>
                                        </li>
                                        <li className="flex gap-4 items-start">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-500 font-bold">Carry your doctor's prescription if available.</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
