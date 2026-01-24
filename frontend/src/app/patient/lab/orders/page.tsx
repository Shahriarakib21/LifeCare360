'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Download,
    FlaskConical,
    Receipt,
    Activity
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PaymentModal from '@/components/patient/PaymentModal';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface LabOrder {
    _id: string;
    date: string;
    data: {
        labTestRequest: {
            tests: Array<{ name: string, testCode?: string, price: number }>;
            status: string;
            labId: {
                _id: string;
                profile: { firstName: string, lastName: string };
            };
            paymentId?: {
                transactionId: string;
                paymentDate: string;
                amount: number;
                status: string;
            };
        };
    };
    createdAt: string;
}

function OrdersContent() {
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        const pay = searchParams.get('pay');
        if (orderId && pay === 'true' && orders.length > 0) {
            const order = orders.find(o => o._id === orderId);
            if (order && order.data.labTestRequest.status === 'pending') {
                setSelectedOrder(order);
                setShowPaymentModal(true);
            }
        }
    }, [searchParams, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/patients/lab-orders');
            setOrders(res.data.data.orders || []);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID':
                return { label: 'Paid & Ready', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle };
            case 'ASSIGNED':
                return { label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: Clock };
            case 'SAMPLE_COLLECTED':
                return { label: 'Sample Collected', color: 'bg-indigo-100 text-indigo-700', icon: FlaskConical };
            case 'IN_PROGRESS':
                return { label: 'Testing...', color: 'bg-purple-100 text-purple-700', icon: Activity };
            case 'COMPLETED':
            case 'REPORT_UPLOADED':
                return { label: 'Results Ready', color: 'bg-green-100 text-green-700', icon: FileText };
            case 'FAILED':
                return { label: 'Payment Failed', color: 'bg-red-100 text-red-700', icon: AlertCircle };
            case 'PAYMENT PENDING':
            case 'PENDING':
                return { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock };
            default:
                return { label: status || 'Processing', color: 'bg-slate-100 text-slate-700', icon: Clock };
        }
    };

    const handlePayNow = (order: LabOrder) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8 px-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Lab Orders</h1>
                <p className="text-slate-500 font-sans mt-1">Track your test bookings, payments, and results</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
            ) : orders.length === 0 ? (
                <Card className="p-20 text-center text-slate-400">
                    <FlaskConical className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Lab Orders Yet</h3>
                    <p className="mb-6">You haven't booked any lab tests through the digital portal.</p>
                    <Button onClick={() => window.location.href = '/patient/lab/booking'} className="bg-teal-600 text-white font-bold px-8 rounded-2xl">
                        Book Your First Test
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {orders.map(order => {
                        const status = getStatusInfo(order.data.labTestRequest.status);
                        const StatusIcon = status.icon;
                        const tests = order.data.labTestRequest.tests || [];
                        const total = tests.reduce((sum, t) => sum + t.price, 0);

                        return (
                            <Card key={order._id} className="p-0 overflow-hidden border-slate-100 group transition-all hover:shadow-lg">
                                <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest">
                                                Order #{order._id.slice(-8).toUpperCase()}
                                            </div>
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${status.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {status.label}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                                {tests.length > 0 ? tests.map(t => t.name).join(', ') : 'Lab Test Order'}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                                <FlaskConical className="w-4 h-4 text-teal-600" />
                                                Laboratory: <span className="text-slate-900 font-bold">
                                                    {order.data.labTestRequest.labId?.profile
                                                        ? `${order.data.labTestRequest.labId.profile.firstName} ${order.data.labTestRequest.labId.profile.lastName}`
                                                        : 'Selected Laboratory'}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                            <span>Requested on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span>{tests.length} {tests.length === 1 ? 'test' : 'tests'} included</span>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pt-6 md:pt-0 border-t md:border-0 border-slate-100">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Bill</p>
                                            <p className="text-3xl font-black text-slate-900">৳{total.toLocaleString()}</p>
                                        </div>

                                        <div className="flex gap-3">
                                            {['PENDING', 'PAYMENT PENDING'].includes(order.data.labTestRequest.status?.toUpperCase()) ? (
                                                <Button
                                                    onClick={() => handlePayNow(order)}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl shadow-xl shadow-slate-950/20 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <CreditCard className="w-5 h-5" /> Pay Now
                                                </Button>
                                            ) : ['COMPLETED', 'REPORT_UPLOADED'].includes(order.data.labTestRequest.status?.toUpperCase()) ? (
                                                <Button
                                                    onClick={() => window.location.href = '/patient/reports'}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <Download className="w-5 h-5" /> View Results
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    disabled
                                                    className="border-slate-200 text-slate-400 font-bold px-6 py-3 rounded-2xl cursor-not-allowed"
                                                >
                                                    Processing...
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {order.data.labTestRequest.paymentId && (
                                    <div className="bg-slate-50/80 px-8 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                                            <Receipt className="w-4 h-4 text-teal-600" />
                                            <span>Payment Receipt: <span className="text-slate-900 font-bold">{(order.data.labTestRequest.paymentId as any).transactionId}</span></span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Paid via Secure Portal on {new Date((order.data.labTestRequest.paymentId as any).paymentDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {selectedOrder && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    requestId={selectedOrder._id}
                    totalAmount={selectedOrder.data.labTestRequest.tests.reduce((sum, t) => sum + t.price, 0)}
                    testBreakdown={selectedOrder.data.labTestRequest.tests.map(t => ({
                        testName: t.name,
                        testCode: t.testCode,
                        price: t.price
                    }))}
                    onSuccess={() => {
                        fetchOrders();
                        toast.success('Your laboratory test has been booked!', { duration: 5000 });
                        setSelectedOrder(null);
                    }}
                />
            )}
        </div>
    );
}

export default function LabOrdersPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>}>
            <OrdersContent />
        </Suspense>
    );
}
