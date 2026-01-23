'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FlaskConical,
    Search,
    ShoppingCart,
    ArrowRight,
    Check,
    X,
    Stethoscope,
    AlertCircle,
    Info
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface LabTest {
    id: string;
    name: string;
    code: string;
    price: number;
    description?: string;
    lab: {
        id: string;
        name: string;
        email: string;
    }
}

export default function LabBookingPage() {
    const router = useRouter();
    const [tests, setTests] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
    const [activeLabId, setActiveLabId] = useState<string | null>(null);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async (query = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/api/public/lab-tests/search?q=${query}`);
            setTests(res.data.data.tests || []);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTests(searchQuery);
    };

    const toggleTest = (test: LabTest) => {
        const isSelected = selectedTests.find(t => t.id === test.id);

        if (isSelected) {
            const updated = selectedTests.filter(t => t.id !== test.id);
            setSelectedTests(updated);
            if (updated.length === 0) setActiveLabId(null);
        } else {
            if (activeLabId && test.lab.id !== activeLabId) {
                toast.error("Please complete booking for " + selectedTests[0].lab.name + " first, or clear selection.");
                return;
            }
            setSelectedTests([...selectedTests, test]);
            setActiveLabId(test.lab.id);
        }
    };

    const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

    const handleCheckout = async () => {
        if (selectedTests.length === 0) return;

        try {
            const res = await api.post('/api/patients/lab-orders', {
                labId: activeLabId,
                testIds: selectedTests.map(t => t.id),
                urgency: 'routine'
            });

            toast.success('Order created successfully!');
            router.push(`/patient/lab/orders?orderId=${res.data.data.orderId}&pay=true`);
        } catch (error) {
            toast.error(handleApiError(error));
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lab Test Catalog</h1>
                    <p className="text-slate-500 text-lg mt-1 font-sans">Browse and book laboratory tests from verified labs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Catalog Section */}
                <div className="lg:col-span-8 space-y-6">
                    <Card padding="none" className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <form onSubmit={handleSearch} className="p-5 bg-slate-50/50 border-b border-slate-100 flex gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by test name, code or description..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-sans text-slate-700 shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-8 rounded-2xl shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]">
                                Search
                            </Button>
                        </form>

                        {loading ? (
                            <div className="p-20 text-center"><LoadingSpinner /></div>
                        ) : tests.length === 0 ? (
                            <div className="p-20 text-center text-slate-400 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FlaskConical className="w-10 h-10 opacity-30" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No tests found</h3>
                                <p>Try adjusting your search criteria or clear filters.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {tests.map(test => {
                                    const isSelected = selectedTests.some(t => t.id === test.id);
                                    return (
                                        <div key={test.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row items-start justify-between gap-6 group">
                                            <div className="flex gap-5 flex-1">
                                                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                                    <Stethoscope className="w-7 h-7" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="font-bold text-xl text-slate-900 leading-tight">{test.name}</h3>
                                                    <p className="text-slate-500 text-sm leading-relaxed max-w-md">{test.description || 'Modern diagnostic assessment using state-of-the-art laboratory equipment for accurate results.'}</p>
                                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                                        <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-white border-slate-200 text-slate-600 uppercase tracking-widest">
                                                            {test.code}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            Provided by <span className="text-teal-600 font-bold hover:underline cursor-pointer">{test.lab.name}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                                                <div className="text-2xl font-black text-slate-900">৳{test.price.toLocaleString()}</div>
                                                <Button
                                                    size="lg"
                                                    variant={isSelected ? "ghost" : "primary"}
                                                    className={`rounded-2xl px-6 min-w-[140px] transition-all font-bold ${isSelected
                                                        ? "border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                        : "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 active:scale-95"
                                                        }`}
                                                    onClick={() => toggleTest(test)}
                                                >
                                                    {isSelected ? <><X className="w-5 h-5 mr-2" /> Remove</> : <><ShoppingCart className="w-5 h-5 mr-2" /> Book Now</>}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                    <Card className="border-teal-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 -m-6 mb-6">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                    <ShoppingCart className="w-6 h-6 text-teal-400" />
                                </div>
                                <h2 className="font-bold text-xl tracking-wide">Order Summary</h2>
                            </div>
                        </div>

                        {selectedTests.length === 0 ? (
                            <div className="py-16 text-center text-slate-400 animate-in fade-in duration-700">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <ShoppingCart className="w-7 h-7 opacity-20" />
                                </div>
                                <p className="text-sm font-medium">Your selection is empty</p>
                                <p className="text-xs mt-1 text-slate-400">Choose tests from the catalog to proceed</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedTests.map(test => (
                                        <div key={test.id} className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0 group">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 truncate leading-tight">{test.name}</p>
                                                <p className="text-[10px] text-teal-600 font-medium mt-1 uppercase tracking-wider">{test.lab.name}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-slate-700">৳{test.price.toLocaleString()}</span>
                                                <button
                                                    onClick={() => toggleTest(test)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
                                        <span>Subtotal</span>
                                        <span>৳{totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-900 font-black text-2xl pt-2">
                                        <span>Total</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-teal-600">৳{totalPrice.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest">BDT Inclusive of VAT</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-4">
                                    <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex gap-3 shadow-inner">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <p className="text-[11px] text-amber-800 leading-normal font-medium">
                                            Payment is required upfront to confirm your slot. You'll be redirected to our SSL-secured payment portal.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleCheckout}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-2xl shadow-xl shadow-teal-500/20 font-black text-lg group transition-all transform active:scale-[0.98]"
                                    >
                                        Place Order <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                <Info className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Booking Policy</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Instant confirmation after successful payment",
                                "Reports accessible via Dashboard once completed",
                                "Cancellation allowed up to 12 hours before slot",
                                "Please carry the digital receipt to the lab"
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-xs text-slate-500 font-medium leading-relaxed">
                                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
