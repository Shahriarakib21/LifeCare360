'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Upload, Clock, ClipboardList, Filter, ChevronRight, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/lab/StatusBadge';
import Badge from '@/components/ui/Badge';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';
import FuturisticBadge from '@/components/ui/FuturisticBadge';

interface LabRequest {
  _id: string;
  requestId?: string;
  patient?: any;
  recordedBy?: any;
  date: string;
  data: {
    labTestRequest: {
      tests: string[];
      notes?: string;
      urgency: 'routine' | 'urgent' | 'stat';
      status: string;
      estimatedCost?: number;
      priceBreakdown?: { testName: string; price: number }[];
    };
  };
}

export default function RequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Auth check
  useEffect(() => {
    initialize();
    if (isAuthenticated && user?.role === 'lab') {
      setAuthChecked(true);
    } else {
      const timer = setTimeout(() => {
        if (!isAuthenticated || user?.role !== 'lab') router.push('/auth/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, initialize, router]);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!authChecked) return;

    setLoading(true);
    try {
      const response = await api.get('/api/labs/requests/pending');
      setRequests(response.data.data.requests || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [authChecked]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const patientName = `${req.patient?.user?.profile?.firstName || ''} ${req.patient?.user?.profile?.lastName || ''}`.toLowerCase();
    const tests = (req.data?.labTestRequest?.tests || []).join(' ').toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      patientName.includes(searchLower) ||
      tests.includes(searchLower) ||
      req._id.includes(searchLower);

    const matchesUrgency = urgencyFilter === 'all' || req.data?.labTestRequest?.urgency === urgencyFilter;

    return matchesSearch && matchesUrgency;
  });

  if (!authChecked || loading) {
    return <LoadingSpinner fullScreen text="Synchronizing Request Stream..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic">
            Request <span className="text-cyan-400">Stream</span>
          </h1>
          <p className="text-gray-400 flex items-center text-sm tracking-wide font-medium">
            <ClipboardList className="w-4 h-4 mr-2 text-cyan-500" />
            LIVE FEED: MONITORING INCOMING DIAGNOSTIC PAYLOADS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Uplink Active</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY PATIENT NAME / TEST / ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-[10px] font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all tracking-widest placeholder:text-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'routine', 'urgent', 'stat'].map((type) => (
              <button
                key={type}
                onClick={() => setUrgencyFilter(type)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${urgencyFilter === type
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Requests Stream */}
      <GlassCard padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Subject Profile</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Manifest</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Revenue</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Priority</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Timeline</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request._id} className="group hover:bg-white/[0.015] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent flex items-center justify-center font-black text-cyan-400 border border-white/5 group-hover:border-cyan-500/30 transition-all">
                          {request.patient?.user?.profile?.firstName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white tracking-wide group-hover:text-cyan-400 transition-colors uppercase">
                            {request.patient?.user?.profile?.firstName} {request.patient?.user?.profile?.lastName}
                          </p>
                          <p className="text-[10px] text-gray-600 font-bold font-mono tracking-tighter mt-0.5 uppercase">ID: {request._id.slice(-12)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {(request.data?.labTestRequest?.tests || []).map((test: string, idx: number) => {
                          const testName = typeof test === 'string' ? test : (test as any).testName || 'Test';
                          // Find price if breakdown exists
                          const priceInfo = request.data?.labTestRequest?.priceBreakdown?.find((p: any) => p.testName === testName);

                          return (
                            <div key={idx} className="flex flex-col gap-1">
                              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-wider group-hover:text-white transition-colors">
                                {testName}
                              </span>
                              {priceInfo && (
                                <span className="text-[8px] text-cyan-500/70 font-mono text-center">৳{priceInfo.price}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white tracking-wide">
                          {request.data?.labTestRequest?.estimatedCost ? `৳${request.data?.labTestRequest?.estimatedCost.toLocaleString()}` : '—'}
                        </span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Estimated</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <FuturisticBadge variant={request.data?.labTestRequest?.urgency === 'stat' ? 'red' : request.data?.labTestRequest?.urgency === 'urgent' ? 'violet' : 'cyan'}>
                        {(request.data?.labTestRequest?.urgency || 'routine').toUpperCase()}
                      </FuturisticBadge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold tracking-tight">{formatDate(request.date)}</span>
                        <span className="text-[9px] text-gray-600 font-black font-mono mt-1 flex items-center uppercase italic">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          Registered at {new Date(request.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <GlowButton
                          onClick={() => router.push(`/lab/requests/${request._id}`)}
                          size="sm"
                          variant="outline"
                          className="text-[10px] tracking-widest px-4 font-black"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          VIEW
                        </GlowButton>
                        <GlowButton
                          variant="cyan"
                          size="sm"
                          disabled={request.data?.labTestRequest?.status !== 'PAID' && request.data?.labTestRequest?.status !== 'SAMPLE_COLLECTED' && request.data?.labTestRequest?.status !== 'IN_PROGRESS'}
                          onClick={() => router.push(`/lab/upload-report?requestId=${request._id}`)}
                          className="text-[10px] tracking-widest px-4 font-black disabled:opacity-30"
                        >
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          UPLINK
                        </GlowButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="relative inline-block">
                      <Activity className="w-16 h-16 text-white/5 mx-auto mb-4" />
                      <div className="absolute inset-0 bg-cyan-500/5 blur-2xl rounded-full" />
                    </div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">No incoming diagnostic streams detected</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
