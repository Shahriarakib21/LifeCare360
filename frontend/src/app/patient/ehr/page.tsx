'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, User, Filter, Download, Building2, AlertCircle, CreditCard, FlaskConical, Activity, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { usePatient } from '@/hooks/usePatient';
import { formatDate } from '@/lib/utils';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function EHRPage() {
  const { ehrRecords, fetchEHR, loading } = usePatient();
  const router = useRouter();
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const [labs, setLabs] = useState<any[]>([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchEHR(filters);
  }, []);

  const fetchLabs = async (testCodes?: string[]) => {
    try {
      let testCodesArray: string[] = [];
      if (testCodes && Array.isArray(testCodes)) {
        testCodesArray = testCodes.map((tc: any) => {
          if (typeof tc === 'string') return tc;
          if (typeof tc === 'object' && tc) {
            return tc.testCode || tc.code || tc.name || String(tc);
          }
          return String(tc);
        }).filter(Boolean);
      }

      const testCodesParam = testCodesArray.length > 0
        ? testCodesArray.join(',')
        : undefined;

      const url = testCodesParam
        ? `/api/patients/labs?testCodes=${encodeURIComponent(testCodesParam)}`
        : '/api/patients/labs';

      const response = await api.get(url);
      const labsData = response.data?.data?.labs || [];
      setLabs(labsData);
      if (labsData.length === 0) {
        console.warn('No lab users found in the system. Please ensure lab users are registered.');
      }
    } catch (error: any) {
      console.error('Error fetching labs:', error);
      toast.error(error?.response?.data?.message || 'Failed to load labs. Please try again.');
    }
  };

  const handleOpenLabModal = (request: any) => {
    setSelectedRequest(request);
    const testCodes = request.data?.labTestRequest?.tests || [];
    fetchLabs(testCodes);
    setShowLabModal(true);
  };

  const handleAssignLab = async () => {
    if (!selectedRequest || !selectedLabId) {
      toast.error('Please select a lab');
      return;
    }

    setAssigning(true);
    try {
      await api.post('/api/patients/lab-requests/assign', {
        requestId: selectedRequest._id,
        labId: selectedLabId,
      });
      toast.success('Lab assigned successfully!');
      setShowLabModal(false);
      setSelectedRequest(null);
      setSelectedLabId('');
      fetchEHR(filters);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setAssigning(false);
    }
  };

  const handleFilter = () => {
    fetchEHR(filters);
  };

  // Helper function to get lab name from labId
  const getLabName = (labId: any): string => {
    if (!labId) return 'Unknown Lab';

    // If labId is populated (object with profile/email)
    if (typeof labId === 'object' && labId !== null) {
      const profile = labId.profile || {};
      const firstName = profile.firstName || '';
      const lastName = profile.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      if (labId.email) {
        return labId.email.split('@')[0];
      }
    }

    // If labId is just a string ID, return a placeholder
    return 'Lab';
  };

  // Helper function to get download URL from record
  const getDownloadUrl = (record: any): string | null => {
    if (record.type === 'prescription') {
      const pdfUrl = record.data?.prescription?.pdfUrl;
      const attachments = record.data?.attachments || [];
      const pdfAttachment = Array.isArray(attachments) ? attachments.find((att: any) => att.type === 'pdf') : null;
      const anyAttachment = Array.isArray(attachments) && attachments.length > 0 ? attachments[0] : null;
      const downloadUrl = pdfUrl || pdfAttachment?.url || anyAttachment?.url;
      return downloadUrl || null;
    }

    if (record.type === 'lab') {
      const attachments = record.data?.attachments || [];
      const pdfAttachment = Array.isArray(attachments) ? attachments.find((att: any) => att.type === 'pdf') : null;
      const anyAttachment = Array.isArray(attachments) && attachments.length > 0 ? attachments[0] : null;
      const downloadUrl = pdfAttachment?.url || anyAttachment?.url;
      return downloadUrl || null;
    }

    return null;
  };

  // Helper function to construct full URL
  const constructFullUrl = (url: string): string => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const fullUrl = url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/uploads/${url}`;
    return fullUrl;
  };

  // Handle file download with authentication
  const handleDownload = async (record: any, e: React.MouseEvent) => {
    e.preventDefault();

    // For prescriptions, generate PDF if it doesn't exist
    if (record.type === 'prescription' && !record.data?.prescription?.pdfUrl && !record.data?.attachments?.find((a: any) => a.type === 'pdf')) {
      try {
        const response = await api.post(`/api/patients/prescriptions/${record._id}/generate-pdf`);
        if (response.data?.data?.pdfUrl) {
          const fullUrl = constructFullUrl(response.data.data.pdfUrl);
          window.open(fullUrl, '_blank');
          return;
        }
      } catch (error) {
        toast.error('Failed to generate PDF. Please try again.');
        return;
      }
    }

    // For lab results, generate PDF if it doesn't exist
    if (record.type === 'lab' && !record.data?.attachments?.find((a: any) => a.type === 'pdf')) {
      try {
        toast.loading('Generating PDF...', { id: 'generate-lab-pdf' });
        const response = await api.post(`/api/patients/lab-results/${record._id}/generate-pdf`);

        if (response.data?.data?.pdfUrl) {
          toast.success('PDF generated successfully!', { id: 'generate-lab-pdf' });
          const fullUrl = constructFullUrl(response.data.data.pdfUrl);
          window.open(fullUrl, '_blank');
          // Refresh EHR to get updated record with PDF
          fetchEHR(filters);
          return;
        } else {
          toast.error('PDF generation failed: No PDF URL returned', { id: 'generate-lab-pdf' });
        }
      } catch (error: any) {
        toast.error(handleApiError(error) || 'Failed to generate PDF. Please try again.', { id: 'generate-lab-pdf' });
        return;
      }
    }
    e.stopPropagation();

    let downloadUrl = getDownloadUrl(record);

    // If no PDF exists for prescription, generate it on-demand
    if (!downloadUrl && record.type === 'prescription') {
      try {
        toast.loading('Generating PDF...', { id: 'generate-pdf' });
        const response = await api.post(`/api/patients/prescriptions/${record._id}/generate-pdf`);
        downloadUrl = response.data.data.pdfUrl;

        if (!downloadUrl) {
          toast.error('PDF generation failed: No URL returned', { id: 'generate-pdf' });
          return;
        }

        toast.success('PDF generated successfully!', { id: 'generate-pdf' });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        console.error('PDF generation error:', {
          message: errorMessage,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error(errorMessage || 'Failed to generate PDF. Please check backend logs.', { id: 'generate-pdf' });
        return;
      }
    }

    if (!downloadUrl) {
      toast.error('No file available for download');
      return;
    }

    const fullUrl = constructFullUrl(downloadUrl);

    try {
      // If it's an S3 URL or external URL, try direct download
      if (fullUrl.startsWith('https://') && (fullUrl.includes('s3') || fullUrl.includes('amazonaws'))) {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      // For local files, use authenticated download
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await axios.get(fullUrl, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = record.data?.attachments?.[0]?.name || `${record.type}_${record._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);

      // Fallback: try opening in new tab
      try {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      } catch (fallbackError) {
        toast.error('Failed to download file. Please try again.');
      }
    }
  };

  const ehrTypes = [
    { value: '', label: 'All Types' },
    { value: 'vital', label: 'Vital Signs' },
    { value: 'lab', label: 'Lab Results' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'note', label: 'Notes' },
  ];

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
      vital: 'primary',
      lab: 'success',
      diagnosis: 'error',
      prescription: 'warning',
    };
    return variants[type] || 'primary';
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />

      <main className="flex-1 container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Medical Records</h1>
          <p className="text-secondary-600">Your complete electronic health record</p>
        </div>

        {/* Filters */}
        <Card padding="lg" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Type"
              options={ehrTypes}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            />
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} fullWidth>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Records */}
        {loading ? (
          <LoadingSpinner fullScreen text="Loading records..." />
        ) : (
          <div className="space-y-4">
            {ehrRecords && ehrRecords.length > 0 ? (
              ehrRecords.map((record: any) => {
                // Prescription data is available in record.data
                return (
                  <Card key={record._id} padding="lg" hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-secondary-900 capitalize">
                              {record.type}
                            </h3>
                            <Badge variant={getTypeBadge(record.type)} size="sm">
                              {record.type}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-secondary-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(record.date, 'long')}
                          </div>
                        </div>
                      </div>
                      {/* Download button for prescriptions and lab tests */}
                      {(record.type === 'prescription' || record.type === 'lab') && (() => {
                        const downloadUrl = getDownloadUrl(record);
                        const hasDownloadableFile = !!downloadUrl;

                        // Always show button for prescriptions (can generate PDF on-demand)
                        // For lab tests, only show if file exists
                        if (record.type === 'prescription' || hasDownloadableFile) {
                          return (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => handleDownload(record, e)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          );
                        } else {
                          // Show disabled button if no file available (for lab tests only)
                          return (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              className="flex items-center gap-2 opacity-50 cursor-not-allowed"
                              title={`No ${record.type} file available`}
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          );
                        }
                      })()}
                    </div>

                    {/* Record Content */}
                    <div className="pl-16">
                      {record.type === 'prescription' && (
                        <div className="space-y-3">
                          {record.data?.prescription?.diagnosis && (
                            <div className="mb-3">
                              <p className="text-sm text-secondary-600">Diagnosis</p>
                              <p className="font-semibold text-secondary-900">{record.data.prescription.diagnosis}</p>
                            </div>
                          )}

                          {/* Handle multiple medications (new format) */}
                          {record.data?.prescription?.medications && Array.isArray(record.data.prescription.medications) && record.data.prescription.medications.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-secondary-700">Medications:</p>
                              {record.data.prescription.medications.map((med: any, idx: number) => (
                                <div key={idx} className="p-3 bg-primary-50 rounded-lg border-l-4 border-primary-500">
                                  <p className="font-semibold text-secondary-900">{med.name || med.medication || 'Medication'}</p>
                                  <div className="mt-2 space-y-1 text-sm text-secondary-600">
                                    {med.dosage && <p><span className="font-medium">Dosage:</span> {med.dosage}</p>}
                                    {med.frequency && <p><span className="font-medium">Frequency:</span> {med.frequency}</p>}
                                    {med.duration && <p><span className="font-medium">Duration:</span> {med.duration}</p>}
                                    {med.instructions && (
                                      <p><span className="font-medium">Instructions:</span> {med.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : record.data?.prescription?.medication ? (
                            /* Handle single medication (old format) */
                            <div className="p-3 bg-primary-50 rounded-lg border-l-4 border-primary-500">
                              <p className="font-semibold text-secondary-900">{record.data.prescription.medication}</p>
                              <div className="mt-2 space-y-1 text-sm text-secondary-600">
                                {record.data.prescription.dosage && <p><span className="font-medium">Dosage:</span> {record.data.prescription.dosage}</p>}
                                {record.data.prescription.frequency && <p><span className="font-medium">Frequency:</span> {record.data.prescription.frequency}</p>}
                                {record.data.prescription.duration && <p><span className="font-medium">Duration:</span> {record.data.prescription.duration}</p>}
                                {record.data.prescription.instructions && (
                                  <p><span className="font-medium">Instructions:</span> {record.data.prescription.instructions}</p>
                                )}
                              </div>
                            </div>
                          ) : record.data?.prescription ? (
                            /* Show prescription data even if no medications */
                            <div className="p-3 bg-primary-50 rounded-lg">
                              <p className="text-sm text-secondary-600">Prescription details available</p>
                              {record.data.prescription.notes && (
                                <p className="mt-2"><span className="font-medium">Notes:</span> {record.data.prescription.notes}</p>
                              )}
                            </div>
                          ) : record.data?.notes ? (
                            /* Fallback - show notes if available */
                            <div className="p-3 bg-secondary-50 rounded-lg">
                              <p className="text-sm text-secondary-600">{record.data.notes}</p>
                            </div>
                          ) : (
                            /* Show that this is a prescription but no details available - debug mode */
                            <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                              <p className="text-sm text-warning-700 font-medium mb-2">Prescription record found</p>
                              {record.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-secondary-500 cursor-pointer">View raw data (debug)</summary>
                                  <pre className="mt-2 text-xs text-secondary-500 overflow-auto bg-white p-2 rounded border">
                                    {JSON.stringify(record.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          )}

                          {record.data?.prescription?.notes && (
                            <div className="mt-3 pt-3 border-t border-secondary-200">
                              <p className="text-sm text-secondary-600"><span className="font-medium">Notes:</span> {record.data.prescription.notes}</p>
                            </div>
                          )}

                          {record.data?.prescription?.followUpDate && (
                            <div className="mt-2">
                              <p className="text-sm text-secondary-600"><span className="font-medium">Follow-up Date:</span> {new Date(record.data.prescription.followUpDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {record.type === 'diagnosis' && record.data.diagnosis && (
                        <div className="space-y-2">
                          <p><strong>Condition:</strong> {record.data.diagnosis.condition}</p>
                          <p><strong>Severity:</strong> {record.data.diagnosis.severity}</p>
                          {record.data.diagnosis.notes && (
                            <p><strong>Notes:</strong> {record.data.diagnosis.notes}</p>
                          )}
                        </div>
                      )}

                      {record.type === 'lab' && record.data.labResults && (
                        <div className="space-y-2">
                          {record.data.labResults.map((result: any, idx: number) => (
                            <div key={idx} className="p-3 bg-secondary-50 rounded-lg">
                              <p><strong>{result.testName}:</strong> {result.value} {result.unit}</p>
                              <Badge
                                variant={
                                  result.status === 'normal' ? 'success' :
                                    result.status === 'critical' ? 'error' : 'warning'
                                }
                                size="sm"
                              >
                                {result.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {(record.type === 'lab-test-request' || record.type === 'Lab-Test-Request') && (
                        <div className="space-y-6">
                          {/* Status Tracker */}
                          {(() => {
                            const status = record.data?.labTestRequest?.status || 'REQUESTED';
                            const steps = [
                              { id: 'REQUESTED', label: 'Requested', icon: AlertCircle },
                              { id: 'PENDING_PAYMENT', label: 'Payment', icon: CreditCard },
                              { id: 'SAMPLE_COLLECTED', label: 'Sampling', icon: FlaskConical },
                              { id: 'IN_PROGRESS', label: 'Testing', icon: Activity },
                              { id: 'REPORT_UPLOADED', label: 'Report', icon: CheckCircle2 }
                            ];

                            // Determine status indices
                            const statusMap: Record<string, number> = {
                              'REQUESTED': 0, 'ASSIGNED': 0,
                              'PENDING_PAYMENT': 1, 'PAID': 2,
                              'SAMPLE_COLLECTED': 2, 'IN_PROGRESS': 3,
                              'completed': 4, 'REPORT_UPLOADED': 4
                            };

                            const currentIdx = statusMap[status] ?? 0;

                            return (
                              <div className="py-6 px-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex justify-between relative">
                                  {/* Progress Line */}
                                  <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 -z-0">
                                    <div
                                      className="h-full bg-cyan-500 transition-all duration-500"
                                      style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                                    ></div>
                                  </div>

                                  {steps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isCompleted = idx < currentIdx;
                                    const isCurrent = idx === currentIdx;
                                    const isPending = idx > currentIdx;

                                    return (
                                      <div key={step.id} className="flex flex-col items-center relative z-10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${isCompleted ? 'bg-cyan-500 border-cyan-100 text-white' :
                                          isCurrent ? 'bg-white border-cyan-500 text-cyan-600 shadow-lg shadow-cyan-200' :
                                            'bg-white border-slate-200 text-slate-400'
                                          }`}>
                                          {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter mt-2 mt-2 ${isCurrent ? 'text-cyan-600' : 'text-slate-400'}`}>
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Request Details */}
                          {record.data?.labTestRequest ? (
                            <div className="grid md:grid-cols-2 gap-6 p-6 bg-white rounded-3xl border border-slate-100">
                              <div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Ordered Tests</h4>
                                <div className="space-y-2">
                                  {record.data.labTestRequest.tests?.map((test: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                      <span className="font-bold text-slate-800 text-sm">{test.testName || test.name || test}</span>
                                      {test.price && <span className="font-black text-cyan-600 text-sm">৳{test.price}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col justify-between">
                                <div>
                                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Provider Info</h4>
                                  {record.data.labTestRequest.labId ? (
                                    <div className="flex items-center gap-4 p-4 bg-cyan-50 rounded-2xl border border-cyan-100">
                                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-cyan-600 shadow-sm">
                                        <Building2 size={20} />
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-900 leading-none mb-1">{getLabName(record.data.labTestRequest.labId)}</p>
                                        <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">Assigned Laboratory</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                                      <AlertCircle className="text-amber-500" size={20} />
                                      <div className="flex-1">
                                        <p className="text-xs font-black text-amber-900 uppercase tracking-tight mb-1">No Lab Assigned</p>
                                        <Button size="xs" onClick={() => handleOpenLabModal(record)}>Assign Lab Now</Button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-6 p-4 bg-slate-900 rounded-2xl shadow-lg">
                                  <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount</span>
                                    <span className="text-2xl font-black text-white italic">৳{record.data.labTestRequest.estimatedCost || 0}</span>
                                  </div>

                                  {(record.data.labTestRequest.status === 'PENDING_PAYMENT' || record.data.labTestRequest.status === 'REQUESTED') && (
                                    <Button
                                      className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 border-none h-12 text-sm font-black uppercase tracking-widest"
                                      onClick={() => router.push(`/patient/payments?requestId=${record._id}&amount=${record.data.labTestRequest.estimatedCost}&type=lab`)}
                                    >
                                      <CreditCard className="mr-2 w-4 h-4" /> Pay & Confirm
                                    </Button>
                                  )}

                                  {record.data.labTestRequest.status === 'PAID' && (
                                    <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                                      <CheckCircle2 className="text-green-500" size={16} />
                                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Payment Confirmed</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                              <p className="text-slate-400 font-bold italic">Request details missing. Please refresh or contact support.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {record.type === 'vital' && record.data.vitals && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {record.data.vitals.bloodPressure && (
                            <div>
                              <p className="text-sm text-secondary-600">Blood Pressure</p>
                              <p className="font-semibold">
                                {record.data.vitals.bloodPressure.systolic}/
                                {record.data.vitals.bloodPressure.diastolic}
                              </p>
                            </div>
                          )}
                          {record.data.vitals.heartRate && (
                            <div>
                              <p className="text-sm text-secondary-600">Heart Rate</p>
                              <p className="font-semibold">{record.data.vitals.heartRate} bpm</p>
                            </div>
                          )}
                          {record.data.vitals.temperature && (
                            <div>
                              <p className="text-sm text-secondary-600">Temperature</p>
                              <p className="font-semibold">{record.data.vitals.temperature}°F</p>
                            </div>
                          )}
                          {record.data.vitals.bmi && (
                            <div>
                              <p className="text-sm text-secondary-600">BMI</p>
                              <p className="font-semibold">{record.data.vitals.bmi}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {record.recordedBy && (
                        <div className="mt-4 pt-4 border-t border-secondary-200 flex items-center text-sm text-secondary-600">
                          <User className="w-4 h-4 mr-2" />
                          Recorded by: {record.recordedBy?.profile?.firstName} {record.recordedBy?.profile?.lastName}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card padding="lg">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600">No records found</p>
                </div>
              </Card>
            )}
          </div>
        )
        }
      </main >

      <Footer />

      {/* Lab Selection Modal */}
      <Modal
        isOpen={showLabModal}
        onClose={() => {
          setShowLabModal(false);
          setSelectedRequest(null);
          setSelectedLabId('');
          setLabs([]);
        }}
        title="Select Lab"
        size="lg"
      >
        <div className="space-y-4">
          {selectedRequest && (
            <div className="p-3 bg-secondary-50 rounded-lg">
              <p className="text-sm font-medium text-secondary-700 mb-2">Requested Tests:</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedRequest.data?.labTestRequest?.tests?.map((test: any, idx: number) => {
                  const testName = typeof test === 'string' ? test : (test.name || test.testName || 'Test');
                  return (
                    <Badge key={idx} variant="primary" size="sm">
                      {testName}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Choose a Lab
            </label>
            {labs.length === 0 ? (
              <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                <p className="text-sm text-warning-700">
                  No lab users found in the system. Please contact an administrator to register lab users.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {labs.map((lab) => {
                  // Use labName from backend if available, otherwise compute it
                  const labName = (lab as any).labName ||
                    (lab.profile?.firstName && lab.profile?.lastName
                      ? `${lab.profile.firstName} ${lab.profile.lastName}`.trim()
                      : lab.profile?.firstName || lab.email?.split('@')[0] || 'Lab');
                  const location = (lab as any).location ||
                    (lab.profile?.location?.city && lab.profile?.location?.state
                      ? `${lab.profile.location.city}, ${lab.profile.location.state}`
                      : lab.profile?.location?.city || lab.profile?.location?.state || null);
                  const locationStr = location ? ` - ${location}` : '';
                  const isSelected = selectedLabId === (lab._id || lab.id);
                  const prices = (lab as any).prices || [];
                  const totalPrice = (lab as any).totalPrice || 0;

                  return (
                    <div
                      key={lab._id || lab.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                        }`}
                      onClick={() => setSelectedLabId(lab._id || lab.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-secondary-900">{labName}</h3>
                            {location && (
                              <span className="text-xs text-secondary-500">{locationStr}</span>
                            )}
                          </div>

                          {/* Price breakdown - Show All */}
                          {prices.length > 0 && (
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                              <p className="text-xs font-semibold text-secondary-500 mb-1">Available Tests:</p>
                              {prices.map((price: any, idx: number) => (
                                <div key={idx} className={`flex justify-between text-sm ${price.isMatch ? 'bg-primary-100 font-medium p-1 rounded' : ''}`}>
                                  <span className="text-secondary-600">{price.testName || price.testCode}:</span>
                                  <span className="font-medium text-secondary-900">৳{price.price.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          {totalPrice > 0 ? (
                            <div>
                              <p className="text-xs text-secondary-500 mb-1">Estimated Cost</p>
                              <p className="text-lg font-bold text-primary-600">৳{totalPrice.toLocaleString()}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-secondary-400">Total not calculated</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-secondary-200">
            <Button
              variant="ghost"
              onClick={() => {
                setShowLabModal(false);
                setSelectedRequest(null);
                setSelectedLabId('');
                setLabs([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignLab}
              disabled={!selectedLabId || assigning}
            >
              {assigning ? 'Assigning...' : 'Assign Lab'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

