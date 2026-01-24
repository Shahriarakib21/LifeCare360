'use client';

import React, { useState, useEffect } from 'react';
import {
    FlaskConical,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Download,
    Search,
    ChevronRight,
    MapPin,
    Star,
    DollarSign,
    Info,
    Calendar,
    Stethoscope
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PaymentModal from '@/components/patient/PaymentModal';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface LabRequest {
    _id: string;
    date: string;
    recordedBy: {
        _id: string;
        profile: { firstName: string, lastName: string };
        email: string;
    };
    data: {
        labTestRequest: {
            tests: Array<string | { name: string, price?: number }>;
            status: string;
            urgency: string;
            notes?: string;
            labId?: {
                _id: string;
                profile: { firstName: string, lastName: string };
            };
            estimatedCost?: number;
            priceBreakdown?: Array<{ testName: string, price: number }>;
        };
    };
    createdAt: string;
}

interface AvailableLab {
    labId: string;
    labName: string;
    totalPrice: number;
    tests: Array<{ testName: string, price: number, estimatedDeliveryTime?: string }>;
    isFullMatch: boolean;
    labDetails?: {
        address?: string;
        rating?: number;
        verified?: boolean;
    };
}

export default function LabRequestsPage() {
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
    const [availableLabs, setAvailableLabs] = useState<AvailableLab[]>([]);
    const [loadingLabs, setLoadingLabs] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/patients/lab-requests');
            setRequests(res.data.data.requests || []);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleCompareLabs = async (request: LabRequest) => {
        setSelectedRequest(request);
        setLoadingLabs(true);
        setShowComparison(true);
        try {
            const res = await api.get(`/api/patients/lab-requests/${request._id}/available-labs`);
            setAvailableLabs(res.data.data.availableLabs || []);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setLoadingLabs(false);
        }
    };

    const handleSelectLab = async (labId: string) => {
        if (!selectedRequest) return;
        try {
            await api.post(`/api/patients/lab-requests/assign`, {
                requestId: selectedRequest._id,
                labId
            });
            toast.success('Laboratory selected successfully');
            setShowComparison(false);
            fetchRequests(); // Refresh to show "Pay Now"
        } catch (error) {
            toast.error(handleApiError(error));
        }
    };

    const handlePayNow = (request: LabRequest) => {
        setSelectedRequest(request);
        setShowPaymentModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAYMENT PENDING':
            case 'PENDING':
                return { label: 'Payment Pending', color: 'bg-amber-100 text-amber-700', icon: Clock };
            case 'PAID':
            case 'ASSIGNED':
                return { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle };
            case 'IN_PROGRESS':
            case 'SAMPLE_COLLECTED':
                return { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: FlaskConical };
            case 'COMPLETED':
            case 'REPORT_UPLOADED':
                return { label: 'Report Uploaded', color: 'bg-indigo-100 text-indigo-700', icon: FileText };
            case 'FAILED':
                return { label: 'Failed', color: 'bg-red-100 text-red-700', icon: AlertCircle };
            default:
                return { label: status || 'Unknown', color: 'bg-slate-100 text-slate-700', icon: Info };
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                        Lab <span className="text-cyan-500">Requests</span>
                    </h1>
                    <p className="text-slate-500 flex items-center text-sm font-bold tracking-wide uppercase">
                        <Stethoscope className="w-4 h-4 mr-2 text-cyan-500" />
                        Manage doctor-initiated test orders
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><LoadingSpinner text="Consulting Medical Records..." /></div>
            ) : requests.length === 0 ? (
                <Card className="p-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[3rem]">
                    <FlaskConical className="w-20 h-20 mx-auto mb-6 text-slate-200" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">No Requests Found</h3>
                    <p className="text-slate-500 font-bold max-w-md mx-auto">When your doctor requests lab tests, they will appear here for your review and laboratory selection.</p>
                </Card>
            ) : (
                <div className="grid gap-8">
                    {requests.map(request => {
                        const sInfo = getStatusBadge(request.data.labTestRequest.status);
                        const StatusIcon = sInfo.icon;
                        const tests = request.data.labTestRequest.tests || [];
                        const testNames = tests.map(t => typeof t === 'string' ? t : t.name).join(', ');
                        const isPaymentPending = request.data.labTestRequest.status === 'Payment Pending' || request.data.labTestRequest.status === 'pending';
                        const hasLab = !!request.data.labTestRequest.labId;

                        return (
                            <Card key={request._id} className="p-0 overflow-hidden border-2 border-slate-100 group transition-all hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-100/50 rounded-[2.5rem]">
                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="px-5 py-2 bg-slate-900 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                                    ID: {request._id.slice(-8).toUpperCase()}
                                                </div>
                                                <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${sInfo.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {sInfo.label}
                                                </div>
                                                {request.data.labTestRequest.urgency === 'stat' && (
                                                    <div className="px-5 py-2 bg-red-500 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">
                                                        URGENT
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase italic">{testNames}</h3>
                                                <div className="flex flex-wrap gap-6 text-sm">
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold group/doc bg-slate-50 px-4 py-2 rounded-xl">
                                                        <Stethoscope className="w-4 h-4 text-cyan-500" />
                                                        <span>Dr. <span className="text-slate-900">{request.recordedBy?.profile ? `${request.recordedBy.profile.firstName} ${request.recordedBy.profile.lastName}` : 'Medical Professional'}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl">
                                                        <Calendar className="w-4 h-4 text-cyan-500" />
                                                        <span>Requested: <span className="text-slate-900">{new Date(request.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span></span>
                                                    </div>
                                                </div>
                                            </div>

                                            {request.data.labTestRequest.notes && (
                                                <div className="p-4 bg-amber-50 rounded-2xl border-l-4 border-amber-400">
                                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                        <Info className="w-3.5 h-3.5" /> Doctor's Instructions
                                                    </p>
                                                    <p className="text-sm text-amber-700 font-medium italic">"{request.data.labTestRequest.notes}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="lg:w-80 space-y-6">
                                            {isPaymentPending ? (
                                                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
                                                    {hasLab ? (
                                                        <>
                                                            <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mb-2">
                                                                <FlaskConical className="w-8 h-8" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Laboratory</p>
                                                                <p className="text-lg font-black text-slate-900 uppercase">
                                                                    {request.data.labTestRequest.labId?.profile ?
                                                                        `${request.data.labTestRequest.labId.profile.firstName} ${request.data.labTestRequest.labId.profile.lastName}` :
                                                                        'Selected Lab'}
                                                                </p>
                                                            </div>
                                                            <div className="w-full pt-2">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                                                                <p className="text-3xl font-black text-cyan-600 italic">৳{(request.data.labTestRequest.estimatedCost || 0).toLocaleString()}</p>
                                                            </div>
                                                            <div className="w-full grid grid-cols-2 gap-3 pt-2">
                                                                <Button onClick={() => handleCompareLabs(request)} variant="outline" className="rounded-2xl border-slate-200 text-slate-600 font-black uppercase text-[10px] py-4">Switch</Button>
                                                                <Button onClick={() => handlePayNow(request)} className="rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] py-4 shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all">Pay Now</Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                                                                <Search className="w-8 h-8" />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-600 px-4">Choose a laboratory to view pricing and proceed</p>
                                                            <Button
                                                                onClick={() => handleCompareLabs(request)}
                                                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-cyan-200 flex items-center justify-center gap-2 group/btn"
                                                            >
                                                                Find Laboratory <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
                                                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                        <CheckCircle className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                        <p className="text-xl font-black text-indigo-900 uppercase italic">{sInfo.label}</p>
                                                    </div>
                                                    {(request.data.labTestRequest.status === 'REPORT_UPLOADED' || request.data.labTestRequest.status === 'COMPLETED') && (
                                                        <Button
                                                            onClick={() => window.location.href = '/patient/reports'}
                                                            className="w-full bg-slate-900 text-white font-black uppercase text-[10px] py-4 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-4 h-4" /> Download Report
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Price Comparison Modal */}
            {showComparison && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl flex flex-col animate-slide-up">
                        <div className="p-8 sm:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic mb-1">Compare <span className="text-cyan-500">Laboratories</span></h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select your preferred facility to proceed</p>
                            </div>
                            <button onClick={() => setShowComparison(false)} className="p-4 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                                <ChevronRight className="w-6 h-6 rotate-90" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white">
                            {loadingLabs ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <LoadingSpinner size="large" />
                                    <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning Diagnostic Networks...</p>
                                </div>
                            ) : availableLabs.length === 0 ? (
                                <div className="text-center py-20 px-10">
                                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                    <p className="text-slate-400 font-bold text-lg">No laboratories found offering the requested tests currently.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {availableLabs.map(lab => (
                                        <div key={lab.labId} className="border-2 border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-100/50 transition-all cursor-pointer" onClick={() => handleSelectLab(lab.labId)}>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-900 uppercase mb-1 leading-tight">{lab.labName}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center text-amber-500 gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                                                                <Star className="w-3 h-3 fill-current" />
                                                                <span className="text-[10px] font-black">{lab.labDetails?.rating || '4.5'}</span>
                                                            </div>
                                                            {lab.labDetails?.verified && (
                                                                <div className="flex items-center text-cyan-600 gap-1 bg-cyan-50 px-2 py-0.5 rounded-lg">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    <span className="text-[10px] font-black uppercase">Verified</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Best Price</p>
                                                        <p className="text-2xl font-black text-cyan-600 italic">৳{lab.totalPrice.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-4 border-t border-slate-50">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Test Breakdown</p>
                                                    {lab.tests.map((t, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs font-bold">
                                                            <span className="text-slate-600">{t.testName}</span>
                                                            <span className="text-slate-900 group-hover:text-cyan-600">৳{t.price.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase pt-4">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{lab.labDetails?.address || 'Dhaka Diagnostic Center Main, Panthapath'}</span>
                                                </div>
                                            </div>

                                            <div className="pt-8">
                                                <Button className="w-full bg-slate-900 text-white font-black uppercase text-[10px] py-4 rounded-2xl group-hover:bg-cyan-600 transition-colors shadow-lg">Choose Laboratory</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Payment Modal */}
            {selectedRequest && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    requestId={selectedRequest._id}
                    totalAmount={selectedRequest.data.labTestRequest.estimatedCost || 0}
                    testBreakdown={selectedRequest.data.labTestRequest.priceBreakdown || []}
                    onSuccess={() => {
                        fetchRequests();
                        toast.success('Payment completed! The laboratory has been notified.', { duration: 5000 });
                        setSelectedRequest(null);
                    }}
                />
            )}
        </div>
    );
}
