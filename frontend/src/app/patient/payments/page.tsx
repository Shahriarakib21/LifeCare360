'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CreditCard, ChevronLeft, ShieldCheck,
    AlertCircle, CheckCircle2, ArrowRight,
    Lock, Smartphone, Info
} from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PaymentMethodSelector from '@/components/patient/PaymentMethodSelector';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

function PaymentPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const invoiceId = searchParams.get('invoiceId');

    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<any>(null);
    const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'summary' | 'method' | 'success'>('summary');

    useEffect(() => {
        if (!invoiceId) {
            toast.error('Invalid Invoice ID');
            router.push('/patient/dashboard');
            return;
        }

        const fetchPaymentDetails = async () => {
            try {
                const response = await api.get(`/api/payments/${invoiceId}`);
                setPayment(response.data.data.payment);
            } catch (error: any) {
                toast.error(handleApiError(error));
                router.push('/patient/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [invoiceId, router]);

    const handleCompletePayment = async () => {
        if (!selectedMethod) {
            toast.error('Please select a payment method');
            return;
        }

        setIsProcessing(true);
        try {
            // Mocking a gateway response
            const response = await api.post('/api/payments/complete', {
                invoiceId,
                paymentMethod: selectedMethod,
                transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                gatewayResponse: { status: 'success', bank_txn: 'MOCK-BANK-123' }
            });

            if (response.data.success) {
                setPaymentStep('success');
                toast.success('Payment completed successfully!');
            }
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen text="Synchronizing Secure Payment Gateway..." />;

    if (paymentStep === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
                <Card className="max-w-md w-full p-8 text-center shadow-2xl rounded-[2.5rem] border-none">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase italic">Success!</h2>
                    <p className="text-slate-500 font-bold mb-8">
                        Your payment for the {payment.serviceType} service has been processed successfully.
                    </p>

                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left border border-slate-100">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</span>
                            <span className="text-sm font-black text-slate-900">{payment.invoiceId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                            <span className="text-sm font-black text-green-600">৳{(Number(payment.totalAmount) || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push('/patient/dashboard')}
                        className="w-full bg-slate-900 text-white rounded-xl h-14 font-black uppercase tracking-widest shadow-xl shadow-slate-200"
                    >
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors"
                >
                    <ChevronLeft size={20} />
                    Back
                </button>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left: Summary */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase italic leading-none">
                                Payment <span className="text-cyan-500">Summary</span>
                            </h1>

                            <div className="space-y-6 mb-10">
                                {payment.itemBreakdown.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm uppercase">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-black text-slate-900">৳{(Number(item.total) || 0).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <div className="flex justify-between text-slate-500 font-bold text-sm">
                                    <span>Subtotal</span>
                                    <span>৳{(Number(payment.baseAmount) || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 font-bold text-sm">
                                    <span>VAT (5%)</span>
                                    <span>৳{(Number(payment.vatAmount) || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 font-bold text-sm">
                                    <span>Service Charge (2%)</span>
                                    <span>৳{(Number(payment.serviceCharge) || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-4 text-2xl font-black text-slate-900 italic">
                                    <span>Total Payable</span>
                                    <span className="text-cyan-600">৳{(Number(payment.totalAmount) || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-cyan-50 border border-cyan-100 p-6 rounded-[2rem] flex gap-4">
                            <ShieldCheck className="text-cyan-500 shrink-0" size={24} />
                            <div>
                                <h4 className="text-xs font-black text-cyan-800 uppercase tracking-widest mb-1">Encrypted Transaction</h4>
                                <p className="text-[10px] font-bold text-cyan-600 leading-relaxed uppercase">
                                    Your payment information is protected by 256-bit SSL encryption. We do not store your PIN or OTP.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Method */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden text-white h-full flex flex-col">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Lock size={120} />
                            </div>

                            <h3 className="text-xl font-black mb-8 italic relative z-10 flex items-center gap-2">
                                <CreditCard size={20} className="text-cyan-400" />
                                Payment Method
                            </h3>

                            <div className="relative z-10 space-y-6 flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Gateway</p>

                                <div className="space-y-4">
                                    {['bkash', 'nagad'].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setSelectedMethod(method as any)}
                                            className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${selectedMethod === method
                                                ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                                : 'border-white/5 bg-white/5 text-white/40 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${method === 'bkash' ? 'bg-[#D12053]' : 'bg-[#F7941E]'
                                                    } text-white`}>
                                                    {method.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-black uppercase tracking-widest text-sm">{method === 'bkash' ? 'bKash' : 'Nagad'}</span>
                                            </div>
                                            {selectedMethod === method && <CheckCircle2 className="text-cyan-400" size={20} />}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/10">
                                    <Button
                                        onClick={handleCompletePayment}
                                        disabled={!selectedMethod || isProcessing}
                                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-2xl h-16 shadow-xl shadow-cyan-500/20 disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <div className="w-6 h-6 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
                                        ) : (
                                            <>
                                                PROCEED TO PAY
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[9px] text-slate-500 text-center font-black uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2">
                                        <Smartphone size={10} />
                                        Requires Mobile & PIN Verification
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function UnifiedPaymentPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen text="Loading Secure Gateway..." />}>
            <Header />
            <PaymentPageContent />
            <Footer />
        </Suspense>
    );
}
