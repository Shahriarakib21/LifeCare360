'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    FlaskConical, MapPin, Clock, ArrowLeft, CheckCircle2,
    AlertCircle, Activity, User, ClipboardList, Info,
    CreditCard, Calendar, Microscope, Upload, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface LabRequest {
    _id: string;
    patient?: {
        user?: {
            profile?: {
                firstName?: string;
                lastName?: string;
                phone?: string;
                email?: string;
            };
        };
    };
    date: string;
    data: {
        labTestRequest: {
            tests: { testId: string; testName: string; price: number }[];
            notes?: string;
            urgency: 'routine' | 'urgent' | 'stat';
            status: string;
            estimatedCost: number;
        };
    };
}

export default function LabRequestDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [request, setRequest] = useState<LabRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchRequest = useCallback(async () => {
        try {
            const response = await api.get(`/api/labs/requests/${id}`);
            setRequest(response.data.data.request);
        } catch (error: any) {
            toast.error(handleApiError(error));
            router.push('/lab/requests');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) fetchRequest();
    }, [id, fetchRequest]);

    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await api.patch(`/api/labs/requests/${id}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
            fetchRequest();
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!request) return null;

    const lr = request.data.labTestRequest;
    const currentStatus = lr.status;
    const patientProfile = request.patient?.user?.profile;
    const patientName = `${patientProfile?.firstName || ''} ${patientProfile?.lastName || ''}`.trim();

    const statusFlow = [
        { id: 'PAID', label: 'Payment Received', color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'SAMPLE_COLLECTED', label: 'Sample Collected', color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'IN_PROGRESS', label: 'Testing in Progress', color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'completed', label: 'Testing Completed', color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'REPORT_UPLOADED', label: 'Report Uploaded', color: 'text-cyan-600', bg: 'bg-cyan-50' }
    ];

    const currentIdx = statusFlow.findIndex(s => s.id === currentStatus);

    return (
        <div className="min-h-screen bg-[#f8fafc] py-12">
            <div className="container-custom max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                        <ArrowLeft size={18} />
                        Back to Stream
                    </button>
                    <div className="flex gap-3">
                        <span className={`px-4 py-2 rounded-[1rem] text-xs font-black uppercase tracking-widest border ${lr.urgency === 'stat' ? 'bg-red-50 text-red-600 border-red-100' :
                                lr.urgency === 'urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-cyan-50 text-cyan-600 border-cyan-100'
                            }`}>
                            Priority: {lr.urgency}
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel: Request Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-50">
                                <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400">
                                    <User size={40} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject Identification</h4>
                                    <h1 className="text-3xl font-black text-slate-900 leading-none mb-2">{patientName}</h1>
                                    <p className="text-slate-500 font-bold flex items-center gap-2 text-sm italic">
                                        <Info size={14} className="text-cyan-500" />
                                        Request ID: {request._id.toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Test Manifest</h3>
                                {lr.tests.map((test, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-cyan-600 shadow-sm border border-slate-50">
                                                <Microscope size={24} />
                                            </div>
                                            <div>
                                                <span className="text-lg font-black text-slate-800 leading-none">{test.testName}</span>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Diagnostic Unit: {idx + 1}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-cyan-600 italic">৳{test.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {lr.notes && (
                                <div className="mt-8 p-6 bg-amber-50/50 rounded-[1.5rem] border border-amber-100/50 flex gap-4">
                                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                    <div>
                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Clinical Observations / Notes</p>
                                        <p className="text-sm font-medium text-amber-900/70 italic leading-relaxed">{lr.notes}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-slate-400" size={18} />
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Registered At</p>
                                        <p className="text-sm font-bold text-slate-800">{formatDate(request.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Total Revenue</p>
                                    <p className="text-3xl font-black text-slate-900 tabular-nums">৳{lr.estimatedCost}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Panel: Workflow Execution */}
                    <div className="space-y-8">
                        <section className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Activity size={120} />
                            </div>

                            <h3 className="text-xl font-black mb-8 italic relative z-10">Status Orchestration</h3>

                            <div className="space-y-4 relative z-10">
                                {statusFlow.map((step, idx) => {
                                    const isCompleted = idx < currentIdx;
                                    const isCurrent = idx === currentIdx;
                                    const isNext = idx === currentIdx + 1;
                                    const isFuture = idx > currentIdx + 1;

                                    return (
                                        <div
                                            key={step.id}
                                            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isCompleted ? 'border-green-500/20 bg-green-500/5 text-green-500' :
                                                    isCurrent ? 'border-cyan-500 bg-cyan-500/10 text-white' :
                                                        isNext ? 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 cursor-pointer' :
                                                            'border-white/5 text-white/20 opacity-40'
                                                }`}
                                            onClick={() => isNext && handleUpdateStatus(step.id)}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-500 text-white' :
                                                    isCurrent ? 'bg-cyan-500 text-white animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.5)]' :
                                                        'bg-white/10 text-white/40'
                                                }`}>
                                                {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">{idx + 1}</span>}
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-widest">{step.label}</span>
                                            {isNext && !updating && <ChevronRight className="ml-auto text-white/40" size={18} />}
                                            {isNext && updating && <div className="ml-auto w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10">
                                <Button
                                    className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl py-6 h-auto"
                                    onClick={() => router.push(`/lab/upload-report?requestId=${request._id}`)}
                                >
                                    <Upload className="mr-2 w-5 h-5" />
                                    UPLOAD RESULTS (UPLINK)
                                </Button>
                                <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-[0.2em] mt-4">Manual Result Transmission Protocol</p>
                            </div>
                        </section>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Activity size={20} className="text-cyan-500" />
                                Execution Control
                            </h4>
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Ensure all diagnostic procedures meet laboratory standards before transitioning to the next stage. Status changes are reflected in real-time on the patient's portal.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all text-left">Flag Discrepancy</button>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-500 transition-all text-left">Contact Submitting Physician</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
