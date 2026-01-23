'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Upload, Filter, Search, Calendar, BrainCircuit, Activity } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface Report {
    id: string; // EHR ID
    title: string;
    type: string;
    date: string;
    doctorName?: string;
    fileUrl?: string;
    summary?: string;
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'lab' | 'prescription'>('all');
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // Fetch both lab reports and prescriptions to show in one unified view
            const [labRes, ehrRes] = await Promise.all([
                api.get('/api/patients/lab-reports'),
                api.get('/api/patients/ehr?type=prescription')
            ]);

            const labReports = (labRes.data.data.reports || []).map((r: any) => {
                const tests = r.data?.labTestRequest?.tests || [];
                const testNames = tests.map((t: any) => t.testName || t.name || t).join(', ');

                return {
                    id: r._id,
                    title: testNames || 'Diagnostic Report',
                    type: 'lab',
                    date: r.date,
                    doctorName: r.data?.labTestRequest?.labId?.profile?.firstName
                        ? `${r.data.labTestRequest.labId.profile.firstName} ${r.data.labTestRequest.labId.profile.lastName}`
                        : 'Laboratory',
                    fileUrl: r.data?.attachments?.[0]?.url,
                    summary: r.data?.labTestRequest?.status === 'REPORT_UPLOADED' ? 'Report Ready' : 'Processing'
                };
            });

            const prescriptions = (ehrRes.data.data.records || []).map((r: any) => ({
                id: r._id,
                title: r.data?.prescription?.diagnosis ? `Prescription: ${r.data.prescription.diagnosis}` : 'Prescription',
                type: 'prescription',
                date: r.date,
                doctorName: r.recordedBy?.profile?.lastName
                    ? `Dr. ${r.recordedBy.profile.lastName.charAt(0).toUpperCase() + r.recordedBy.profile.lastName.slice(1)}`
                    : 'Unknown Doctor',
                fileUrl: r.data?.prescription?.pdfUrl
            }));

            setReports([...labReports, ...prescriptions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileToUpload) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', 'report'); // Generic type for patient upload

        try {
            await api.post('/api/patients/reports/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Report uploaded successfully');
            setShowUploadModal(false);
            setFileToUpload(null);
            fetchReports();
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (report: Report) => {
        try {
            if (report.fileUrl) {
                window.open(report.fileUrl, '_blank');
                return;
            }

            if (report.type === 'lab') {
                toast.loading('Generating PDF...', { id: 'pdf-gen' });
                const response = await api.post(`/api/patients/lab-results/${report.id}/generate-pdf`);
                toast.dismiss('pdf-gen');

                if (response.data?.data?.pdfUrl) {
                    // Update local state to include the new URL so we don't generate it again
                    setReports(prev => prev.map(r =>
                        r.id === report.id ? { ...r, fileUrl: response.data.data.pdfUrl } : r
                    ));
                    window.open(response.data.data.pdfUrl, '_blank');
                    toast.success('Report downloaded');
                } else {
                    toast.error('Failed to generate PDF');
                }
            } else if (report.type === 'prescription') {
                // Similar logic for prescriptions if needed, though they usually have a file
                toast.error('No file available for this prescription');
            }
        } catch (error: any) {
            toast.dismiss('pdf-gen');
            toast.error(handleApiError(error));
        }
    };

    const filteredReports = activeTab === 'all' ? reports : reports.filter(r => r.type === activeTab);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Medical Reports & Records</h1>
                    <p className="text-slate-500">View and manage your health history documents</p>
                </div>
                <Button onClick={() => setShowUploadModal(true)} className="bg-slate-900 text-white hover:bg-slate-800">
                    <Upload className="w-4 h-4 mr-2" /> Upload Report
                </Button>
            </div>

            {/* AI Insights Banner */}
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BrainCircuit className="w-48 h-48 text-white" />
                </div>
                <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-indigo-200" />
                            <span className="text-indigo-100 font-medium">Health Insights</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Health Record Analysis</h3>
                        <p className="text-indigo-100 max-w-2xl">
                            Your recent reports have been processed. Use our AI tools to visualize trends and get personalized recommendations based on this data.
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/patient/insights'}
                        className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm whitespace-nowrap"
                    >
                        View Full Analysis
                    </Button>
                </div>
            </Card>

            {/* Filters & List */}
            <Card className="min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                        {['all', 'lab', 'prescription'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab === 'all' ? 'All' : tab + 's'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search reports..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p>No records found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredReports.map(report => (
                            <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${report.type === 'lab' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                                    <FileText className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 truncate">{report.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(report.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{report.doctorName}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-500 hover:text-teal-600"
                                        onClick={() => handleDownload(report)}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-500 hover:text-teal-600"
                                        onClick={() => handleDownload(report)}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Medical Record">
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer relative bg-slate-50">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-700">{fileToUpload ? fileToUpload.name : 'Click to select file'}</p>
                        <p className="text-xs text-slate-500 mt-1">PDF, JPG up to 10MB</p>
                    </div>

                    <Button type="submit" className="w-full bg-slate-900 text-white" disabled={!fileToUpload || uploading}>
                        {uploading ? 'Uploading...' : 'Upload Record'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
