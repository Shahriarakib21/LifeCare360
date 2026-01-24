'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, Activity, Shield, Zap, Info, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Input from '@/components/ui/Input';
import Toast from '@/components/lab/Toast';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
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
      status: 'REQUESTED' | 'ASSIGNED' | 'completed';
    };
  };
}

interface TestResult {
  testName: string;
  value: number;
  unit: string;
  normalRange: {
    min: number;
    max: number;
  };
  status: 'normal' | 'low' | 'high' | 'critical';
}

export default function UploadReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('requestId') || '');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resultSummary, setResultSummary] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'file'>('manual');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

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
      const fetchedRequests = response.data.data.requests || [];
      setRequests(fetchedRequests);

      if (selectedRequestId) {
        const found = fetchedRequests.find((r: LabRequest) => r._id === selectedRequestId);
        if (found) {
          setSelectedRequest(found);
          const tests = found.data?.labTestRequest?.tests || [];
          setTestResults(
            tests.map((testName: string) => ({
              testName,
              value: 0,
              unit: '',
              normalRange: { min: 0, max: 100 },
              status: 'normal',
            }))
          );
        }
      }
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [authChecked, selectedRequestId]);

  useEffect(() => {
    if (authChecked) fetchRequests();
  }, [authChecked, fetchRequests]);

  useEffect(() => {
    if (selectedRequestId) {
      const found = requests.find((r) => r._id === selectedRequestId);
      if (found) {
        setSelectedRequest(found);
        const tests = found.data?.labTestRequest?.tests || [];
        setTestResults(
          tests.map((testName: string) => ({
            testName,
            value: 0,
            unit: '',
            normalRange: { min: 0, max: 100 },
            status: 'normal',
          }))
        );
      }
    } else {
      setSelectedRequest(null);
      setTestResults([]);
    }
  }, [selectedRequestId, requests]);

  const handleUpdateTestResult = (index: number, field: keyof TestResult, value: any) => {
    const updated = [...testResults];
    if (field === 'normalRange') {
      updated[index] = { ...updated[index], normalRange: value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    // Auto status
    if (field === 'value' || field === 'normalRange') {
      const result = updated[index];
      const val = typeof result.value === 'number' ? result.value : parseFloat(result.value);
      const min = typeof result.normalRange.min === 'number' ? result.normalRange.min : parseFloat(result.normalRange.min);
      const max = typeof result.normalRange.max === 'number' ? result.normalRange.max : parseFloat(result.normalRange.max);

      if (!isNaN(val) && !isNaN(min) && !isNaN(max)) {
        if (val < min) result.status = 'low';
        else if (val > max) result.status = val > max * 1.5 ? 'critical' : 'high';
        else result.status = 'normal';
      }
    }
    setTestResults(updated);
  };

  const handleSubmit = async () => {
    if (!selectedRequestId) return toast.error('Please select a request');
    const validResults = testResults.filter((r) => r.testName && !isNaN(r.value) && r.value >= 0 && r.unit.trim() !== '');
    if (validResults.length === 0) return toast.error('Please enter valid test results including assessment units');
    if (validResults.length !== testResults.length) {
      return toast.error('Some results are missing measurement units. All parameters require a valid unit.');
    }

    setSubmitting(true);
    try {
      await api.post('/api/labs/requests/submit', {
        requestId: selectedRequestId,
        results: validResults,
        notes: resultSummary,
      });
      toast.success('Uplink complete. Redirecting...');
      setTimeout(() => router.push('/lab/requests'), 1500);
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedRequestId) return toast.error('Please select a request');
    if (!fileToUpload) return toast.error('Please select a file to upload');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('report', fileToUpload);
      formData.append('notes', resultSummary);

      console.log('[handleFileUpload] Transmitting to:', `/api/labs/requests/${selectedRequestId}/upload`);
      console.log('[handleFileUpload] File:', fileToUpload.name, fileToUpload.size, fileToUpload.type);

      await api.post(`/api/labs/requests/${selectedRequestId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('File transmission successful. Redirecting...');
      setTimeout(() => router.push('/lab/requests'), 1500);
    } catch (error: any) {
      console.error('[handleFileUpload] Error:', error);
      if (error.response) {
        console.error('[handleFileUpload] Error Response:', error.response.data);
      }
      toast.error(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  if (!authChecked || loading) return <LoadingSpinner fullScreen text="Synchronizing Upload Terminal..." />;

  const getRequestLabel = (request: LabRequest) => {
    const patientName = request.patient?.user?.profile
      ? `${request.patient.user.profile.firstName || ''} ${request.patient.user.profile.lastName || ''}`.trim()
      : 'Unknown Subject';
    return `${request._id.slice(-8).toUpperCase()} - ${patientName}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic">
            Upload <span className="text-cyan-400">Terminal</span>
          </h1>
          <p className="text-gray-400 flex items-center text-sm tracking-wide font-medium">
            <Upload className="w-4 h-4 mr-2 text-cyan-500" />
            Uplink Status: <span className="text-green-400 ml-1">READY FOR TRANSMISSION</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="lg" glow glowColor="cyan">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Target Request</label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
                >
                  <option value="" className="bg-slate-900">CHOOSE DIAGNOSTIC STREAM...</option>
                  {requests.map((req) => (
                    <option key={req._id} value={req._id} className="bg-slate-900">{getRequestLabel(req)}</option>
                  ))}
                </select>
              </div>

              {selectedRequest && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setUploadMode('manual')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${uploadMode === 'manual' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-gray-300'
                          }`}
                      >
                        MANUAL INPUT
                      </button>
                      <button
                        onClick={() => setUploadMode('file')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${uploadMode === 'file' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-gray-300'
                          }`}
                      >
                        FILE UPLOAD
                      </button>
                    </div>

                    {uploadMode === 'manual' && (
                      <GlowButton variant="outline" size="sm" onClick={() => setTestResults([...testResults, { testName: '', value: 0, unit: '', normalRange: { min: 0, max: 100 }, status: 'normal' }])}>
                        <Plus className="w-3 h-3 mr-2" /> ADD PARAMETER
                      </GlowButton>
                    )}
                  </div>

                  {uploadMode === 'manual' ? (

                    <div className="space-y-4">
                      {testResults.map((result, index) => (
                        <div key={index} className="p-4 rounded-2xl bg-white/5 border border-white/10 relative group">
                          <button onClick={() => setTestResults(testResults.filter((_, i) => i !== index))} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="PARAMETER NAME" value={result.testName} onChange={(e) => handleUpdateTestResult(index, 'testName', e.target.value)} />
                            <Input label="RECORDED VALUE" type="number" value={isNaN(result.value) ? '' : result.value} onChange={(e) => handleUpdateTestResult(index, 'value', e.target.value === '' ? NaN : parseFloat(e.target.value))} />
                            <Input label="MEASUREMENT UNIT" value={result.unit} onChange={(e) => handleUpdateTestResult(index, 'unit', e.target.value)} />
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Safety Thresholds</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="number" placeholder="MIN" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50" value={isNaN(result.normalRange.min) ? '' : result.normalRange.min} onChange={(e) => handleUpdateTestResult(index, 'normalRange', { ...result.normalRange, min: e.target.value === '' ? NaN : parseFloat(e.target.value) })} />
                                <input type="number" placeholder="MAX" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50" value={isNaN(result.normalRange.max) ? '' : result.normalRange.max} onChange={(e) => handleUpdateTestResult(index, 'normalRange', { ...result.normalRange, max: e.target.value === '' ? NaN : parseFloat(e.target.value) })} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center group hover:border-cyan-500/50 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.csv,.png,.jpg,.jpeg,.xls,.xlsx"
                      />
                      <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-cyan-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">
                        {fileToUpload ? fileToUpload.name : 'DROP FILE OR CLICK TO BROWSE'}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        SUPPORTED: PDF, CSV, PNG, JPG, EXCEL (MAX 10MB)
                      </p>
                      {fileToUpload && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setFileToUpload(null);
                          }}
                          className="mt-4 text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                        >
                          REMOVE FILE
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Diagnostic Summary</label>
                    <textarea
                      value={resultSummary}
                      onChange={(e) => setResultSummary(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500/50 transition-all min-h-[120px]"
                      placeholder="ENTER OBSERVATIONS..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <GlowButton
                      onClick={uploadMode === 'manual' ? handleSubmit : handleFileUpload}
                      isLoading={submitting}
                      variant="cyan"
                      className="flex-1 font-black tracking-[0.2em]"
                      disabled={uploadMode === 'file' && !fileToUpload}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadMode === 'manual' ? 'BROADCAST RESULTS' : 'TRANSMIT FILE'}
                    </GlowButton>
                    <GlowButton variant="outline" onClick={() => router.back()}>CANCEL</GlowButton>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-black text-white tracking-widest uppercase italic">Secure Protocols</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Ensure all metrics are calibrated correctly.',
                'Double-verify high/critical value markers.',
                'Attach digital signatures where required.',
                'Encrypted uplink will initiate upon broadcast.'
              ].map((text, i) => (
                <li key={i} className="flex gap-3 items-start group">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                    <span className="text-[10px] font-black text-cyan-400">{i + 1}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium group-hover:text-white transition-colors">{text}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard padding="lg" className="border-violet-500/20 bg-violet-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-black text-white tracking-widest uppercase italic">System Sync</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              All transmissions are logged to the blockchain for audit persistence. Unauthorized data injection is strictly prohibited.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
