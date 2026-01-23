'use client';

import React, { useState } from 'react';
import { X, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface TestBreakdown {
    testName: string;
    testCode?: string;
    price: number;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    testBreakdown: TestBreakdown[];
    totalAmount: number;
    onSuccess?: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    requestId,
    testBreakdown,
    totalAmount,
    onSuccess,
}: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'mobile_banking' | 'card' | 'cash' | 'online'>('mobile_banking');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePayment = async () => {
        try {
            setLoading(true);
            const response = await api.post('/api/patients/lab-requests/pay', {
                requestId,
                paymentMethod,
            });

            toast.success('Payment successful!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Test Breakdown */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Test Breakdown</h3>
                        <div className="space-y-2">
                            {testBreakdown.map((test, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{test.testName}</p>
                                        {test.testCode && (
                                            <p className="text-xs text-gray-500">Code: {test.testCode}</p>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        ৳{test.price.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-lg font-bold text-gray-900">Total Amount</p>
                            <p className="text-2xl font-bold text-cyan-600">
                                ৳{totalAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('mobile_banking')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'mobile_banking'
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Smartphone className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'mobile_banking' ? 'text-cyan-600' : 'text-gray-400'
                                    }`} />
                                <p className={`text-sm font-medium ${paymentMethod === 'mobile_banking' ? 'text-cyan-900' : 'text-gray-600'
                                    }`}>
                                    Mobile Banking
                                </p>
                                <p className="text-xs text-gray-500 mt-1">bKash, Nagad</p>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-cyan-600' : 'text-gray-400'
                                    }`} />
                                <p className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-cyan-900' : 'text-gray-600'
                                    }`}>
                                    Card
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Credit/Debit</p>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('online')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'online'
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'online' ? 'text-cyan-600' : 'text-gray-400'
                                    }`} />
                                <p className={`text-sm font-medium ${paymentMethod === 'online' ? 'text-cyan-900' : 'text-gray-600'
                                    }`}>
                                    Online
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Net Banking</p>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash'
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'cash' ? 'text-cyan-600' : 'text-gray-400'
                                    }`} />
                                <p className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-cyan-900' : 'text-gray-600'
                                    }`}>
                                    Cash
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Pay at lab</p>
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 border-t border-gray-200 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </div>
                            ) : (
                                `Pay ৳${totalAmount.toLocaleString()}`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
